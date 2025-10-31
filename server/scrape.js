// server/scrape.js
import puppeteer from "puppeteer";
import fs from "fs";
import { venues } from "./venues.js";

const today = new Date();
const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

export async function scrapeAllRaces() {
  const browser = await puppeteer.launch({
    headless: "new", // 新しいHeadlessモード
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const allData = [];

  for (const v of venues) {
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${yyyymmdd}&jcd=${v.id}`;
    console.log(`■ FETCH：${v.name}`);
    console.log(`▶︎ URL: ${url}`);

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

    // ✅ 新しいHTML構造に対応
    const races = await page.$$eval(".table1 tbody tr", (rows) => {
      return rows
        .map((row) => {
          const raceNum = row.querySelector("th a")?.textContent?.trim();
          const title = row.querySelector("td.is-fs12")?.textContent?.trim();
          if (!raceNum || !title) return null;
          return { raceNum, title };
        })
        .filter(Boolean);
    });

    console.log(`✅ 抽出：${v.name} → レース数 ${races.length}`);
    allData.push({ venue: v.name, races });

    await page.close();
  }

  await browser.close();

  // 保存
  const path = "./data/data.json";
  fs.writeFileSync(path, JSON.stringify(allData, null, 2));
  console.log(`💾 保存完了: ${path}`);
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAllRaces();
}