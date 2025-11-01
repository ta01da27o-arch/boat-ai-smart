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
      await page.goto(url, { waitUntil: "networkidle2", timeout: 40000 });
      const html = await page.content();

      const raceData = await page.$$eval(".table1 tbody tr", rows =>
        rows.map(row => {
          const cols = Array.from(row.querySelectorAll("td")).map(td => td.textContent.trim());
          return cols.join(" | ");
        })
      );

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