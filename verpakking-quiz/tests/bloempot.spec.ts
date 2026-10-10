import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("verify scraped data for Bloempot voor buitenplant", () => {
  const filePath = path.resolve(__dirname, "../public/verpakkingen.json");

  if (!fs.existsSync(filePath)) {
    test.fail();
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const item = data.find(
    (p: any) =>
      p.title.toLowerCase().includes("bloempot voor buitenplant") ||
      p.url?.includes("bloempot-voor-buitenplant"),
  );

  expect(item).toBeDefined();
  expect(item.title).toBe("Bloempot voor buitenplant");
  expect(item.subtitle).toBe("Kweekpot, Teelpot, Transportpot");
  expect(item.materials).toEqual(["Plastic"]);
  expect(item.imageUrl).toContain(
    "/sites/default/files/styles/cropped_medium_3_2/public/2026-07/_S0A2012%20LR.jpg",
  );
  expect(item.description).toBe(
    "Bloempot (buitenplanten) die alleen wordt gebruikt voor de verkoop en het vervoer van planten en niet bedoeld is voor de hele levensduur van de plant. Zie ook: Bloempot voor binnenplant",
  );

  expect(item.tableInfo).toBeDefined();
  expect(item.tableInfo.verpakking).toBe(true);
  expect(item.tableInfo.bijdrageplichtig).toBe(true);
  expect(item.tableInfo.verkooppuntverpakking).toBe(false);
  expect(item.tableInfo.potetieleMeermaligeVerpakking).toBe(false);
  expect(item.tableInfo.logistiekHulpmiddel).toBe(false);
  expect(item.tableInfo.verpaktProduct).toBe(false);
  expect(item.tableInfo.exoot).toBe(false);
});
