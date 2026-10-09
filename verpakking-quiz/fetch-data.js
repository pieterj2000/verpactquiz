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
    `Found ${rawItems.length} products. Launching browser to scrape official details with rate-limiting...`,
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
      await page.goto(fullUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      const details = await page.evaluate(() => {
        const titleEl = document.querySelector("h1");
        const bodyEl = document.querySelector("main") || document.body;

        const paragraphs = Array.from(
          bodyEl.querySelectorAll("p, li, div.WysiwygField, .field"),
        )
          .map((el) => el.textContent?.trim())
          .filter(Boolean);

        const textContent = bodyEl.innerText || "";

        return {
          pageTitle: titleEl ? titleEl.innerText.trim() : "",
          paragraphs,
          textContent,
        };
      });

      const fullText = details.textContent.toLowerCase();

      let isPackaging = true;
      if (
        fullText.includes("geen verpakking") ||
        fullText.includes("wordt niet gezien als verpakking") ||
        fullText.includes("geen sprake van een verpakking")
      ) {
        isPackaging = false;
      }

      let category = "Verkoopverpakking";
      if (
        fullText.includes("logistiek hulpmiddel") ||
        fullText.includes("transport") ||
        fullText.includes("pallet") ||
        fullText.includes("krat") ||
        fullText.includes("tray")
      ) {
        category = "Logistiek hulpmiddel";
      } else if (
        fullText.includes("meermalig") ||
        fullText.includes("potentiële meermalige")
      ) {
        category = "Potentiële meermalige verpakking";
      } else if (
        fullText.includes("verkooppunt") ||
        fullText.includes("draagtas")
      ) {
        category = "Verkooppuntverpakking";
      } else if (!isPackaging) {
        category = "Geen verpakking";
      }

      const materials = [];
      if (fullText.includes("plastic") || fullText.includes("kunststof"))
        materials.push("Kunststof");
      if (fullText.includes("papier") || fullText.includes("karton"))
        materials.push("Papier/Karton");
      if (fullText.includes("glas")) materials.push("Glas");
      if (
        fullText.includes("aluminium") ||
        fullText.includes("metaal") ||
        fullText.includes("staal") ||
        fullText.includes("blik")
      )
        materials.push("Metaal");
      if (fullText.includes("hout")) materials.push("Hout");
      if (materials.length === 0) materials.push("Diversen");

      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: details.pageTitle || item.title,
        url: item.url,
        description: details.paragraphs[0] || item.title,
        isPackaging,
        category,
        materials,
        feeLiable: isPackaging && !category.includes("Logistiek"),
      });

      if ((i + 1) % 20 === 0) {
        console.log(`Scraped ${i + 1} / ${rawItems.length} items...`);
      }

      // Rate-limit: wait 300ms between requests to avoid hammering the server
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(`Failed to scrape ${fullUrl}:`, err.message);
      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: item.title,
        url: item.url,
        description: `Officiële verpakkingscatalogus item: ${item.title}`,
        isPackaging: true,
        category: "Verkoopverpakking",
        materials: ["Diversen"],
        feeLiable: true,
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
    `Successfully scraped and saved ${catalogItems.length} official items to public/verpakkingen.json`,
  );
}

fetchCatalog();
