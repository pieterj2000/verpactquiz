import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test("verify scraped data for Bloempot voor buitenplant", () => {
  const filePath = path.resolve(__dirname, "../public/verpakkingen.json");

  if (!fs.existsSync(filePath)) {
    test.skip();
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
  expect(item.subtitle).toContain("Kweekpot");
  expect(item.materials).toContain("Plastic");
  expect(item.imageUrl).toContain("/sites/default/files/");
  expect(item.description).toContain("Bloempot (buitenplanten)");

  expect(item.tableInfo).toBeDefined();
  expect(item.tableInfo.verpakking).toBe(true);
  expect(item.tableInfo.bijdrageplichtig).toBe(true);
  expect(item.tableInfo.verkooppuntverpakking).toBe(false);
  expect(item.tableInfo.potetieleMeermaligeVerpakking).toBe(false);
  expect(item.tableInfo.logistiekHulpmiddel).toBe(false);
  expect(item.tableInfo.verpaktProduct).toBe(false);
  expect(item.tableInfo.exoot).toBe(false);
});
