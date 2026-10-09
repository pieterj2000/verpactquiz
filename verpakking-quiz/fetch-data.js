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
      size: 300,
      query: { match: { type: "product" } },
    }),
  });
  const data = await res.json();

  // List of known non-packaging items from Verpact catalog
  const nonPackagingTitles = [
    "markeringsstift",
    "bandenplakset",
    "naaldendoosje",
    "mierendoosje",
    "inpakpapier los",
    "sieradendoos",
    "speld",
    "oog- of neusdruppelaar",
    "koelelement",
    "aansteker",
    "doseerdop fles",
    "tie-wrap",
    "waxinecup",
    "vogelvoer",
    "stektray",
    "mechanische molen niet navulbaar",
    "doseerdop los",
    "ijslepeltje",
    "verfblik",
    "rietje",
    "vat voor thuistap",
    "adventskalender",
    "kaaskorst",
    "ehbo doos",
    "lippenstifthouder",
    "koekjestrommel leeg",
    "steriel barrieresysteem",
    "bakvorm gevuld",
    "sticker op fruit",
    "brillendoos met bril",
    "cd spindel met cd",
    "blister",
    "opvulmateriaal",
    "bloempot voor buitenplant",
    "niet-navulbare pen",
    "injectiespuit",
    "schoenveterdoosje",
    "kleerhanger bij kledingstuk",
    "tandflosdoosje",
    "plakbandroller met plakband",
    "kleerhanger los",
    "wegwerpbestek",
    "rijstbuidel",
    "horlogedoos",
    "gereedschapsdoos",
    "toilettasje gevuld",
    "enveloppen geadresseerd",
    "plantensubstraat",
    "wegwerpservies (thuis)",
    "koffiepad",
    "mascaraborstel aan dop",
    "garenklosje",
    "luciferdoosje",
    "fles voor injectievloeistof",
    "luchtverfrisser",
    "cd spindel leeg",
    "petrischaal",
    "bloempot voor binnenplant",
    "pleister liners",
    "spellendoos",
    "campinggas",
    "worstvel",
    "zwangerschapstest",
    "brillendoos leeg",
    "beschermkapje scheermes",
    "doseerdop",
    "nietjes in een verpakking",
    "map voor briefpapier",
    "koffiecapsule",
    "verfpalet",
    "roerstaaf",
    "kleefetiketten",
    "enveloppen klein",
    "enveloppen algemene verzending",
    "aanmaakzak",
    "graflicht",
    "rfid",
    "printercartridge",
    "pods",
    "correctieroller",
    "deodorantroller",
    "printerpatronen",
    "vispapier",
    "schrijfstift",
    "inbrenghuls",
    "ringendoos",
    "gebruiksaanwijzing",
    "houtwol",
    "krijtpapier",
    "band/strap",
    "potlodendoosje",
    "theezakje",
    "monster parfum",
    "infuuszak",
    "make-up kwast",
    "oordopdoosje",
    "doosje met vishaken",
    "schroevendoosje",
    "sneeuwketting",
    "plaktape",
    "krimpfolie",
    "koekjestrommel gevuld",
    "brandpastakuipje",
    "eierdoos",
    "label",
    "champignonbakje",
    "mosterdglas",
    "geurstokjes",
    "geurolieflesje",
    "lenzendoosje",
    "bellenblaassetje",
    "fotorolletje",
    "doosje nietjes",
    "rolmaat",
    "mechanische molen navulbaar",
    "navulbare stalen gasfles",
    "etiket op rol",
    "lijmstift",
    "tandpastadoos",
    "doos voor computerspel",
    "oorbellendoos",
    "theezakje met touwtje en label",
    "doosje met bitjes",
    "spuitmond spuitbus",
    "bakvorm leeg",
    "dekbed tas",
    "doosje voor fotolensfilter",
    "platenhoes",
    "schrijfblok",
  ];

  // List of logistics aids / pallets / crates
  const logisticsTitles = [
    "krat vanaf 8 liter",
    "kratje (kleiner dan 8 liter) voor vervoer flessen",
    "octabin",
    "tussenplaat",
    "emmer (vanaf 20 liter)",
    "bananendoos",
    "gasfles (vanaf 20 liter)",
    "intermediate bulk container (ibc)",
    "pallet",
    "tray",
    "glasbok",
    "vaten (vanaf 20 liter)",
    "houten wijnkist",
    "krat (kleiner dan 8 liter)",
    "big bag",
    "palletbox",
    "krimphoezen voor transport",
    "jerrycan (vanaf 20 liter)",
    "doos vanaf 1m3 inhoudsmaat",
    "hoeklatten",
    "opzetrand",
    "rolcontainer",
  ];

  const items = data.hits.hits.map((h) => {
    const rawBody = h._source.body?.[0] || "";
    const cleanBody = rawBody.replace(/<[^>]*>?/gm, "").trim();
    const title = h._source.title?.[0] || "";
    const lowerTitle = title.toLowerCase().trim();

    let isPackaging = true;
    let category = "Verkoopverpakking";

    if (nonPackagingTitles.some((t) => lowerTitle.includes(t))) {
      isPackaging = false;
      category = "Geen verpakking (product/hulpmiddel)";
    } else if (logisticsTitles.some((t) => lowerTitle.includes(t))) {
      isPackaging = true;
      category = "Logistiek hulpmiddel / Transportverpakking";
    } else if (
      lowerTitle.includes("verkooppunt") ||
      lowerTitle.includes("draagtas") ||
      lowerTitle.includes("snackbox") ||
      lowerTitle.includes("broodzakje")
    ) {
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
      feeLiable: isPackaging && !category.includes("Logistiek"), // general rule of thumb for quiz
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
    `Successfully saved ${items.length} enriched items to public/verpakkingen.json`,
  );
}

fetchCatalog();
