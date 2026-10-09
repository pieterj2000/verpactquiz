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
    `Found ${rawItems.length} products. Launching browser to purely scrape live page elements and tables...`,
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

      // Purely extract live table rows, keys, values, and text from the DOM
      const scrapedPageData = await page.evaluate(() => {
        const titleEl = document.querySelector("h1");
        const bodyEl = document.querySelector("main") || document.body;

        const paragraphs = Array.from(
          bodyEl.querySelectorAll("p, li, div.WysiwygField, .field"),
        )
          .map((el) => el.textContent?.trim())
          .filter(Boolean);

        // Extract all tables, key-value pairs, list items, and table cells
        const properties = {};

        // Check standard tables
        const tables = bodyEl.querySelectorAll("table");
        tables.forEach((table) => {
          const rows = table.querySelectorAll("tr");
          rows.forEach((row) => {
            const cols = row.querySelectorAll("th, td");
            if (cols.length >= 2) {
              const k = cols[0].textContent?.trim().toLowerCase();
              const v = cols[1].textContent?.trim();
              if (k && v) properties[k] = v;
            }
          });
        });

        // Check definition lists or list items
        const dts = bodyEl.querySelectorAll("dt");
        dts.forEach((dt) => {
          const dd = dt.nextElementSibling;
          if (dt && dd) {
            properties[dt.textContent.trim().toLowerCase()] =
              dd.textContent.trim();
          }
        });

        // Extract raw text for general analysis
        const rawText = bodyEl.innerText || "";

        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          paragraphs,
          properties,
          rawText,
        };
      });

      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: scrapedPageData.title || item.title,
        url: item.url,
        description: scrapedPageData.paragraphs[0] || item.title,
        paragraphs: scrapedPageData.paragraphs,
        properties: scrapedPageData.properties,
        rawText: scrapedPageData.rawText,
      });

      if ((i + 1) % 20 === 0) {
        console.log(`Scraped ${i + 1} / ${rawItems.length} items live...`);
      }

      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.log(`Failed to scrape ${fullUrl}:`, err.message);
      catalogItems.push({
        id: item.id,
        nid: item.nid,
        title: item.title,
        url: item.url,
        description: `Officiële verpakkingscatalogus item: ${item.title}`,
        paragraphs: [],
        properties: {},
        rawText: item.title,
      });
      await new Promise((r) => setTimeout(r, 250));
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
    `Successfully scraped and saved ${catalogItems.length} pure items to public/verpakkingen.json`,
  );
}

fetchCatalog();
