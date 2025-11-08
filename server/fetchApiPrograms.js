// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio"; // ✅ 修正版
import { chromium } from "playwright";

const OUTPUT_PATH = path.resolve("./server/data/data.json");
const HISTORY_PATH = path.resolve("./server/data/history.json");
const VENUE_CODES = Array.from({ length: 24 }, (_, i) => i + 1);
const API_BASE = "https://api.boatrace-db.net/v1/races/today"; // 仮API

// === Main ===
(async () => {
  console.log("🚀 外部APIからレースデータを取得しています...");
  let allPrograms = [];

  try {
    // ===== ① 外部API からデータ取得 =====
    const res = await fetch(API_BASE);
    if (res.ok) {
      const apiData = await res.json();
      if (apiData?.races?.length > 0) {
        allPrograms = apiData.races;
        console.log(`✅ 外部APIから ${allPrograms.length} 件取得成功`);
      } else {
        throw new Error("API空データ");
      }
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`⚠️ API接続失敗 → HTMLスクレイピングに切替\n理由: ${e.message}`);
    allPrograms = await scrapeBoatraceJP();
  }

  if (!allPrograms || allPrograms.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  // ===== データ保存 =====
  const result = {
    updated: new Date().toISOString(),
    venues: { programs: allPrograms },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);

  // ===== history.json更新 =====
  const history = fs.existsSync(HISTORY_PATH)
    ? JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"))
    : [];
  history.push({ time: new Date().toISOString(), count: allPrograms.length });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log("✅ history.json 更新完了");
})();

/**
 * 🕵️ boatrace.jpからスクレイピング（バックアップ）
 */
async function scrapeBoatraceJP() {
  console.log("🌐 HTMLスクレイピング開始...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");

  let allPrograms = [];

  for (const jcd of VENUE_CODES) {
    console.log(`🌊 ${String(jcd).padStart(2, "0")}番場：取得中...`);
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${yyyymmdd}&jcd=${String(
      jcd
    ).padStart(2, "0")}`;

    try {
      await page.goto(url, { waitUntil: "networkidle" });
      const html = await page.content();
      const $ = cheerio.load(html);

      const races = $(".race_list_table tr")
        .map((_, el) => {
          const raceTitle = $(el).find(".race_title").text().trim();
          if (!raceTitle) return null;

          return {
            race_date: today.toISOString().slice(0, 10),
            race_stadium_number: jcd,
            race_number: Number($(el).find(".race_no").text().trim()) || 0,
            race_title: raceTitle,
            race_subtitle: $(el).find(".subtitle").text().trim(),
            race_distance: 1800,
            boats: [],
          };
        })
        .get();

      if (races.length > 0) {
        console.log(`✅ ${jcd}番場：${races.length}R取得`);
        allPrograms.push(...races);
      } else {
        console.log(`⚠️ ${jcd}番場：レース情報なし`);
      }
    } catch (err) {
      console.log(`❌ ${jcd}番場：取得失敗 (${err.message})`);
    }
  }

  await browser.close();
  return allPrograms;
}