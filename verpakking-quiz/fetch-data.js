import fs from "fs";
import path from "path";
import { chromium } from "playwright";

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function fetchCatalog() {
  console.log("Fetching product URLs from Elasticsearch API...");
  const url =
    "https://www.verpact.nl/api-proxy/elasticsearch-proxy?_api_proxy_uri=" +
    encodeURIComponent("elasticsearch_index_afv_prod_content/_search");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: 300,
      query: { match: { type: "product" } },
    }),
  });
  const data = await res.json();
  const rawItems = data.hits.hits
    .map((h) => ({
      id: h._id,
      nid: h._source.nid?.[0],
      title: h._source.title?.[0] || "",
      url: h._source.url?.[0] || "",
    }))
    .filter((i) => i.url);

  console.log(
    `Found ${rawItems.length} products. Launching browser to scrape details and download images locally (adding localImageUrl)...`,
  );

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const imgDir = path.resolve("public/images");
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  const catalogItems = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const fullUrl = `https://www.verpact.nl${item.url}`;
    try {
      await page.goto(fullUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await page.waitForSelector("h1", { timeout: 10000 });

      const h1Text = await page
        .locator("h1")
        .textContent()
        .catch(() => "");
      if (
        h1Text &&
        (h1Text.includes("geen toegang") ||
          h1Text.includes("403") ||
          h1Text.includes("Niet gevonden"))
      ) {
        console.log(`Skipping restricted or missing page: ${fullUrl}`);
        continue;
      }

      await page
        .waitForSelector("img[src*='/sites/default/files/']", {
          timeout: 5000,
        })
        .catch(() => {});
      await page
        .waitForSelector(".NodeProduct__information__item", { timeout: 5000 })
        .catch(() => {});

      const scraped = await page.evaluate((currentUrl) => {
        const titleEl = document.querySelector("h1");

        const subEl = document.querySelector(".NodeProduct__alternative_names");
        const subtitleText = subEl
          ? subEl.innerText || subEl.textContent || ""
          : "";

        const imgEl = document.querySelector(
          "img[src*='/sites/default/files/']",
        );
        let imgUrl = imgEl ? imgEl.src : "";

        const bodyEl = document.querySelector("main") || document.body;

        let descText = "";
        const headings = Array.from(
          bodyEl.querySelectorAll("h2, h3, h4, .section-title"),
        );
        const toelichtingHeading = headings.find(
          (h) => h.textContent?.trim().toLowerCase() === "toelichting",
        );
        if (toelichtingHeading) {
          let next = toelichtingHeading.nextElementSibling;
          while (next && !["H1", "H2", "H3", "H4"].includes(next.tagName)) {
            descText += " " + (next.innerText || next.textContent || "");
            next = next.nextElementSibling;
          }
        }

        if (!descText.trim()) {
          const ps = Array.from(
            bodyEl.querySelectorAll(
              "p, li, .NodeBasicPage__body p, .NodeProduct__body p",
            ),
          )
            .map((el) => el.innerText || el.textContent || "")
            .map((t) => t.trim())
            .filter(
              (t) =>
                t.length > 0 &&
                t !== (titleEl ? titleEl.innerText : "") &&
                t !== subtitleText,
            );
          const uniquePs = Array.from(new Set(ps));
          descText = uniquePs.join(" ");
        }

        const materialNodes = Array.from(
          bodyEl.querySelectorAll(
            ".NodeProduct__materials a.NodeProduct__type, .NodeProduct__materials .NodeProduct__type",
          ),
        )
          .map((el) => el.textContent?.trim())
          .filter(Boolean);

        const materials = Array.from(new Set(materialNodes));

        const info = {
          verpakking: false,
          bijdrageplichtig: false,
          verkooppuntverpakking: false,
          potetieleMeermaligeVerpakking: false,
          logistiekHulpmiddel: false,
          verpaktProduct: false,
          exoot: false,
        };

        const infoRows = bodyEl.querySelectorAll(
          ".NodeProduct__information__item",
        );

        if (!titleEl || !titleEl.innerText.trim()) {
          throw new Error("Missing product title (h1)");
        }
        if (!imgEl || !imgEl.src) {
          throw new Error("Missing product image");
        }
        if (materials.length === 0) {
          throw new Error("Missing product materials");
        }
        if (infoRows.length === 0) {
          throw new Error("Missing product information rows");
        }

        infoRows.forEach((row) => {
          const divs = row.querySelectorAll("div");
          if (divs.length >= 2) {
            const key = (divs[0].textContent || "").trim().toLowerCase();
            const valDiv = divs[1];
            const hasCheck = !!valDiv.querySelector(".icon-checkmark");

            if (
              key.includes("verpakking") &&
              !key.includes("verkooppunt") &&
              !key.includes("meermalig")
            ) {
              info.verpakking = hasCheck;
            } else if (key.includes("bijdrageplichtig")) {
              info.bijdrageplichtig = hasCheck;
            } else if (key.includes("verkooppuntverpakking")) {
              info.verkooppuntverpakking = hasCheck;
            } else if (key.includes("meermalig")) {
              info.potetieleMeermaligeVerpakking = hasCheck;
            } else if (key.includes("logistiek hulpmiddel")) {
              info.logistiekHulpmiddel = hasCheck;
            } else if (key.includes("verpakt product")) {
              info.verpaktProduct = hasCheck;
            } else if (key.includes("exoot")) {
              info.exoot = hasCheck;
            }
          }
        });

        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          subtitle: subtitleText.trim(),
          imageUrl: imgUrl,
          description: descText.trim().replace(/\s+/g, " "),
          materials,
          tableInfo: info,
        };
      }, fullUrl);

      let cleanDesc = scraped.description.replace(/\.([A-Z])/g, ". $1");

      if (!item.id) {
        throw new Error(`Missing product id for ${fullUrl}`);
      }
      if (item.nid === undefined || item.nid === null) {
        throw new Error(`Missing product nid for ${fullUrl}`);
      }
      if (!scraped.title) {
        throw new Error(`Missing scraped title for ${fullUrl}`);
      }
      if (!scraped.imageUrl) {
        throw new Error(`Missing scraped imageUrl for ${fullUrl}`);
      }

      let localImageUrl = "";
      const extMatch = scraped.imageUrl.match(
        /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i,
      );
      const ext = extMatch ? extMatch[1] : "jpg";
      const filename = `${item.id.replace(/[:\/]/g, "_")}.${ext}`;
      const destPath = path.join(imgDir, filename);
      const success = await downloadImage(scraped.imageUrl, destPath);
      if (!success) {
        throw new Error(`Failed to download local image for ${fullUrl}`);
      }
      localImageUrl = `/images/${filename}`;

      if (!Array.isArray(scraped.materials) || scraped.materials.length === 0) {
        throw new Error(`Missing materials for ${fullUrl}`);
      }
      if (!scraped.tableInfo || typeof scraped.tableInfo !== "object") {
        throw new Error(`Missing tableInfo for ${fullUrl}`);
      }

      const requiredTableKeys = [
        "verpakking",
        "bijdrageplichtig",
        "verkooppuntverpakking",
        "potetieleMeermaligeVerpakking",
        "logistiekHulpmiddel",
        "verpaktProduct",
        "exoot",
      ];
      for (const k of requiredTableKeys) {
        if (typeof scraped.tableInfo[k] !== "boolean") {
          throw new Error(
            `Missing or invalid tableInfo property '${k}' for ${fullUrl}`,
          );
        }
      }

      if (!item.url) {
        throw new Error(`Missing url for ${fullUrl}`);
      }

      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: scraped.title,
        subtitle: scraped.subtitle || "",
        imageUrl: scraped.imageUrl,
        localImageUrl: localImageUrl,
        description: cleanDesc,
        materials: scraped.materials,
        tableInfo: scraped.tableInfo,
        url: `https://www.verpact.nl${item.url}`,
      });

      if ((i + 1) % 20 === 0) {
        console.log(
          `Scraped and downloaded ${i + 1} / ${rawItems.length} items...`,
        );
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`Failed to scrape ${fullUrl}:`, err.message);
      throw err;
    }
  }

  await browser.close();

  const validItems = catalogItems.filter(
    (item) => item.title && !item.title.toLowerCase().includes("geen toegang"),
  );

  console.log(
    `Filtered out ${catalogItems.length - validItems.length} inaccessible items.`,
  );

  const outDir = path.resolve("public");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, "verpakkingen.json"),
    JSON.stringify(validItems, null, 2),
  );
  console.log(
    `Successfully saved ${validItems.length} valid items with imageUrl and localImageUrl to public/verpakkingen.json`,
  );
}

fetchCatalog();
