import puppeteer from "puppeteer";
import { VENUE_CODES } from "./venues.js";

/**
 * venueName（例："桐生"）を指定して、その場の出走表を取得
 * @param {string} venueName
 * @returns {Promise<Array>} races
 */
export async function scrapeVenue(venueName) {
  const code = VENUE_CODES[venueName];
  if (!code) {
    console.warn(`⚠️ 無効な会場コード: ${venueName}`);
    return [];
  }

  // 日付を YYYYMMDD 形式
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hd = `${y}${m}${d}`;

  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${hd}&jcd=${code}`;

  console.log(`▶︎ URL: ${url}`);
  const browser = await puppeteer.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // ページ内で JS 実行完了後 HTML を取得
  const html = await page.content();
  await browser.close();

  // cheerio を使って解析する（軽量モード）でも良いですが、ここでは Puppeteer evaluate を利用
  const races = await (async () => {
    const page2 = await puppeteer.launch({ args: ["--no-sandbox","--disable-setuid-sandbox"] });
    const p2 = await page2.newPage();
    await p2.setContent(html);
    const result = await p2.evaluate(() => {
      const out = [];
      // 12レース想定
      const tables = document.querySelectorAll(".table1");
      tables.forEach((tbl, i) => {
        const raceTitle = `${i + 1}R`;
        const entries = [];
        const rows = tbl.querySelectorAll("tbody tr");
        rows.forEach(tr => {
          const tds = tr.querySelectorAll("td");
          if (tds.length >= 8) {
            entries.push({
              lane: tds[0]?.innerText.trim(),
              klass: tds[1]?.innerText.trim(),
              name: tds[2]?.innerText.trim(),
              st: tds[6]?.innerText.trim(),
              course: tds[7]?.innerText.trim()
            });
          }
        });
        if (entries.length > 0) {
          out.push({ raceTitle, entries, aiMain: [], aiSub: [], ranking: [], comments: [] });
        }
      });
      return out;
    });
    await page2.close();
    return result;
  })();

  console.log(`✅ 抽出：${venueName} → レース数 ${races.length}`);
  return races;
}