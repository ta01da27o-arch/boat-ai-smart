// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

const OUTPUT_PATH = path.resolve("./server/data/data.json");
const HISTORY_PATH = path.resolve("./server/data/history.json");
const VENUE_CODES = Array.from({ length: 24 }, (_, i) => i + 1);
const API_BASE = "https://api.boatrace-db.net/v1/races/today";

(async () => {
  console.log("🚀 外部APIからレースデータを取得しています...");
  let allPrograms = [];

  try {
    const res = await fetch(API_BASE, { timeout: 10000 });
    if (res.ok) {
      const apiData = await res.json();
      if (apiData?.races?.length > 0) {
        allPrograms = apiData.races;
        console.log(`✅ 外部APIから ${allPrograms.length} 件取得成功`);
      } else throw new Error("API空データ");
    } else throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.log(`⚠️ API接続失敗 → HTMLスクレイピングに切替 (${e.message})`);
    allPrograms = await scrapeBoatraceJP();
  }

  if (!allPrograms || allPrograms.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  const result = {
    updated: new Date().toISOString(),
    venues: { programs: allPrograms },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);

  const history = fs.existsSync(HISTORY_PATH)
    ? JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"))
    : [];
  history.push({ time: new Date().toISOString(), count: allPrograms.length });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log("✅ history.json 更新完了");
})();

/** HTMLスクレイピング処理 */
async function scrapeBoatraceJP() {
  console.log("🌐 HTMLスクレイピング開始...");
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
  let allPrograms = [];

  for (const jcd of VENUE_CODES) {
    const code = String(jcd).padStart(2, "0");
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${yyyymmdd}&jcd=${code}`;
    console.log(`🌊 ${code}番場：取得中...`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      // ページ読み込み後に一拍待つ（JS生成を待つ）
      await page.waitForTimeout(2000);

      const html = await page.content();
      const $ = cheerio.load(html);
      const raceRows = $(".table1 tbody tr");

      const races = raceRows
        .map((_, el) => {
          const title = $(el).find(".is-fs18").text().trim();
          if (!title) return null;
          return {
            race_date: today.toISOString().slice(0, 10),
            race_stadium_number: jcd,
            race_number: Number($(el).find(".is-fs12").text().replace("R", "").trim()) || 0,
            race_title: title,
            race_subtitle: $(el).find(".table1_boatTitle").text().trim(),
            race_distance: 1800,
            boats: [],
          };
        })
        .get();

      if (races.length > 0) {
        console.log(`✅ ${code}番場：${races.length}R取得`);
        allPrograms.push(...races);
      } else {
        console.log(`⚠️ ${code}番場：レース情報なし`);
      }
    } catch (err) {
      console.log(`❌ ${code}番場：取得失敗 (${err.message})`);
    }
  }

  await browser.close();
  return allPrograms;
}