// server/scrape.js
import puppeteer from "puppeteer";
import { VENUES } from "./venues.js";

export async function scrapeRaceData(dateStr) {
  const results = {};
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();

  for (const { id, name } of VENUES) {
    console.log(`■ FETCH：${name}`);
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${dateStr}&jcd=${id}`;
    console.log(`▶︎ URL: ${url}`);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      // 新しい構造対応: 出走表レース番号を抽出
      const raceData = await page.$$eval(".table1.is-w495 tbody tr", rows => {
        return rows.map(row => {
          const num = row.querySelector("th")?.textContent?.trim();
          const name = row.querySelector("td.is-fs14")?.textContent?.trim();
          return num && name ? `${num}R: ${name}` : null;
        }).filter(Boolean);
      });

      console.log(`✅ 抽出：${name} → レース数 ${raceData.length}`);
      results[name] = raceData;
    } catch (err) {
      console.error(`❌ ${name} failed:`, err.message);
      results[name] = [];
    }
  }

  await browser.close();
  return results;
}