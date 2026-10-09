import fs from "fs";
import path from "path";

async function fetchCatalog() {
  const url =
    "https://www.verpact.nl/api-proxy/elasticsearch-proxy?_api_proxy_uri=" +
    encodeURIComponent("elasticsearch_index_afv_prod_content/_search");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: 500,
      query: { match: { type: "product" } },
    }),
  });
  const data = await res.json();
  const items = data.hits.hits.map((h) => {
    const rawBody = h._source.body?.[0] || "";
    const cleanBody = rawBody.replace(/<[^>]*>?/gm, "").trim();
    const title = h._source.title?.[0] || "";

    // Determine category / isPackaging based on text
    const lower = (title + " " + cleanBody).toLowerCase();
    let isPackaging = true;
    if (
      lower.includes("geen verpakking") ||
      lower.includes("geen sprake van verpakking") ||
      lower.includes("geen verpakkingsmateriaal")
    ) {
      isPackaging = false;
    }

    return {
      id: h._id,
      nid: h._source.nid?.[0],
      title,
      url: h._source.url?.[0],
      description: cleanBody || title,
      isPackaging,
    };
  });

  const outDir = path.resolve("public");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, "verpakkingen.json"),
    JSON.stringify(items, null, 2),
  );
  console.log(
    `Successfully saved ${items.length} items to public/verpakkingen.json`,
  );
}

fetchCatalog();
