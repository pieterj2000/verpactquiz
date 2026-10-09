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
    const lowerText = (title + " " + cleanBody).toLowerCase();

    // Dynamically classify based on text patterns in the live Verpact data
    let isPackaging = true;
    let category = "Verkoopverpakking";

    // Non-packaging indicators in catalog descriptions or titles
    const nonPackagingKeywords = [
      "geen verpakking",
      "niet als verpakking",
      "hulpmiddel",
      "hulpmiddelen",
      "stift",
      "pen",
      "potlood",
      "garen",
      "instrument",
      "apparaat",
      "krijt",
      "label",
      "etiket",
      "plakband",
      "schrijfblok",
      "kantoormateriaal",
      "monster",
      "gebruiksaanwijzing",
      "sieraad",
      "bril",
      "cd",
      "dop los",
    ];

    // Logistics / Transport packaging / pallets / crates indicators
    const logisticsKeywords = [
      "transport",
      "pallet",
      "krat",
      "tray",
      "octabin",
      "emmer",
      "vat",
      "big bag",
      "container",
      "ibc",
      "glasbok",
      "hoeklat",
      "opzetrand",
      "rolcontainer",
    ];

    // Point of sale packaging indicators
    const posKeywords = [
      "verkooppunt",
      "draagtas",
      "zakje",
      "snackbox",
      "frietzak",
    ];

    if (nonPackagingKeywords.some((kw) => lowerText.includes(kw))) {
      // Check if it's explicitly stated as not packaging or a non-packaging product
      if (
        lowerText.includes("geen verpakking") ||
        lowerText.includes("niet als verpakking") ||
        !lowerText.includes("verpakking")
      ) {
        isPackaging = false;
        category = "Geen verpakking (product/hulpmiddel)";
      }
    }

    if (logisticsKeywords.some((kw) => lowerText.includes(kw))) {
      isPackaging = true;
      category = "Logistiek hulpmiddel / Transportverpakking";
    } else if (posKeywords.some((kw) => lowerText.includes(kw))) {
      isPackaging = true;
      category = "Verkooppuntverpakking";
    }

    return {
      id: h._id,
      nid: h._source.nid?.[0],
      title,
      url: h._source.url?.[0],
      description:
        cleanBody ||
        `Officiële vermelding in de Verpact catalogus voor ${title}.`,
      isPackaging,
      category,
      feeLiable: isPackaging && !category.includes("Logistiek"),
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
    `Successfully fetched and saved ${items.length} dynamic items to public/verpakkingen.json`,
  );
}

fetchCatalog();
