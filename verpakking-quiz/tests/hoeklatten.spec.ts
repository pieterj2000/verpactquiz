import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("verify scraped data for hoeklatten", () => {
  const filePath = path.resolve(__dirname, "../public/verpakkingen.json");

  if (!fs.existsSync(filePath)) {
    test.fail();
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const item = data.find(
    (p: any) =>
      p.title.toLowerCase().includes("hoeklatten") ||
      p.url?.includes("hoeklatten"),
  );

  expect(item).toBeDefined();
  expect(item.title).toBe("Hoeklatten");
  expect(item.subtitle).toBe("Beschermlat, Hoeksteun");
  expect(item.materials).toEqual(["Plastic", "Papier en Karton", "Hout"]);
  expect(item.imageUrl).toContain(
    "/sites/default/files/styles/cropped_medium_3_2/public/2026-09/_S0A0927%20hoeklatten%20LR.jpg",
  );
  expect(item.description).toBe("Hoeklatten om de kratten.");

  expect(item.tableInfo).toBeDefined();
  expect(item.tableInfo.verpakking).toBe(true);
  expect(item.tableInfo.bijdrageplichtig).toBe(true);
  expect(item.tableInfo.verkooppuntverpakking).toBe(false);
  expect(item.tableInfo.potetieleMeermaligeVerpakking).toBe(true);
  expect(item.tableInfo.logistiekHulpmiddel).toBe(false);
  expect(item.tableInfo.verpaktProduct).toBe(false);
  expect(item.tableInfo.exoot).toBe(false);
});
