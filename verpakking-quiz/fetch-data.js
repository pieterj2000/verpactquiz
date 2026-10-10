import fs from "fs";
import path from "path";
import { chromium } from "playwright";

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
    `Found ${rawItems.length} products. Launching browser with networkidle to scrape precise data...`,
  );

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const catalogItems = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const fullUrl = `https://www.verpact.nl${item.url}`;
    try {
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 20000 });

      const scraped = await page.evaluate(() => {
        const titleEl = document.querySelector("h1");

        const subEl = document.querySelector(".NodeProduct__alternative_names");
        const subtitleText = subEl
          ? subEl.innerText || subEl.textContent || ""
          : "";

        const imgEl = document.querySelector(
          "img[src*='/sites/default/files/']",
        );
        const bodyEl = document.querySelector("main") || document.body;

        // Get description paragraphs
        const ps = Array.from(
          bodyEl.querySelectorAll(
            "p, li, .NodeBasicPage__body p, .NodeProduct__body p",
          ),
        )
          .map((el) => el.innerText || el.textContent || "")
          .map((t) => t.trim())
          .filter(
            (t) => t.length > 0 && t !== (titleEl ? titleEl.innerText : ""),
          );

        const uniquePs = Array.from(new Set(ps));
        const descText = uniquePs.join(" ");

        const materialEls = Array.from(
          bodyEl.querySelectorAll(
            ".material, .material-tag, [class*='material'], [class*='materiaalsoort'], .NodeProduct__material, .tag",
          ),
        )
          .map((el) => el.textContent?.trim())
          .filter(Boolean);

        const materials = Array.from(new Set(materialEls));
        if (materials.length === 0) {
          materials.push("Diversen");
        }

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
          imageUrl: imgEl ? imgEl.src : "",
          description: descText.trim().replace(/\s+/g, " "),
          materials,
          tableInfo: info,
        };
      });

      let cleanDesc = (scraped.description || item.title).replace(
        /\.([A-Z])/g,
        ". $1",
      );

      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: scraped.title || item.title,
        subtitle: scraped.subtitle || "",
        imageUrl: scraped.imageUrl || "",
        description: cleanDesc,
        materials: scraped.materials,
        tableInfo: scraped.tableInfo,
        url: item.url,
      });

      if ((i + 1) % 20 === 0) {
        console.log(`Scraped ${i + 1} / ${rawItems.length} items...`);
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`Failed to scrape ${fullUrl}:`, err.message);
      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: item.title,
        subtitle: "",
        imageUrl: "",
        description: item.title,
        materials: ["Diversen"],
        tableInfo: {
          verpakking: false,
          bijdrageplichtig: false,
          verkooppuntverpakking: false,
          potetieleMeermaligeVerpakking: false,
          logistiekHulpmiddel: false,
          verpaktProduct: false,
          exoot: false,
        },
        url: item.url,
      });
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  await browser.close();

  const outDir = path.resolve("public");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, "verpakkingen.json"),
    JSON.stringify(catalogItems, null, 2),
  );
  console.log(
    `Successfully scraped and saved ${catalogItems.length} items to public/verpakkingen.json`,
  );
}

fetchCatalog();
