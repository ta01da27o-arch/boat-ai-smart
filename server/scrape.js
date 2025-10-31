// server/scrape.js
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { VENUE_CODES } from "./venues.js";

const CACHE_DIR = "./server/cache";
const DATA_OUT = "./data/data.json";

async function fetchRaceData(venueCode, dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?jcd=${venueCode}&hd=${dateStr}`;
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const races = await page.evaluate(() => {
    const raceTitles = Array.from(document.querySelectorAll(".is-fs18")).map(el => el.textContent.trim());
    const tables = Array.from(document.querySelectorAll("table.is-w495"));
    const data = [];
    tables.forEach((table, i) => {
      const trs = table.querySelectorAll("tbody tr");
      const rows = [];
      trs.forEach(tr => {
        const tds = tr.querySelectorAll("td");
        if (tds.length >= 9) {
          rows.push({
            lane: tds[0].textContent.trim(),
            name: tds[1].textContent.trim(),
            klass: tds[2].textContent.trim(),
            st: tds[3].textContent.trim(),
            f: tds[4].textContent.trim(),
            national: tds[5].textContent.trim(),
            local: tds[6].textContent.trim(),
            mt: tds[7].textContent.trim(),
            course: tds[8].textContent.trim(),
          });
        }
      });
      data.push({ raceTitle: raceTitles[i] || `第${i + 1}R`, entries: rows });
    });
    return data;
  });

  await browser.close();
  return races;
}

export async function scrapeAllVenues() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const cacheFile = path.join(CACHE_DIR, `${dateStr}.json`);

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // キャッシュチェック（1時間以内）
    const stat = await fs.stat(cacheFile).catch(() => null);
    if (stat && Date.now() - stat.mtimeMs < 1000 * 60 * 60) {
      console.log("🟢 キャッシュが新しいため再取得しません。");
      return JSON.parse(await fs.readFile(cacheFile, "utf8"));
    }

    const result = { date: dateStr, venues: {} };
    for (const [venueName, code] of Object.entries(VENUE_CODES)) {
      try {
        console.log(`取得中：${venueName}`);
        const data = await fetchRaceData(code, dateStr);
        result.venues[venueName] = data;
      } catch (err) {
        console.warn(`⚠️ 取得失敗：${venueName}`, err.message);
      }
    }

    await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    await fs.writeFile(DATA_OUT, JSON.stringify(result, null, 2));
    console.log(`✅ 保存完了: ${DATA_OUT}`);
    return result;

  } catch (err) {
    console.error("❌ スクレイピング失敗:", err);
  }
}
