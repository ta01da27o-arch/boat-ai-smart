import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

const __dirname = path.resolve();
const DATA_DIR = path.join(__dirname, "server", "data");
const OUTPUT_PATH = path.join(DATA_DIR, "data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 指定場のレースデータを外部APIまたはHTMLスクレイピングで取得
 */
async function fetchRaceData(stadiumNumber, retry = 0) {
  const apiUrl = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd=${String(
    stadiumNumber
  ).padStart(2, "0")}`;

  try {
    console.log(`🌊 ${String(stadiumNumber).padStart(2, "0")}番場：取得中 (${retry + 1}回目)`);

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // レース一覧をパース
    const programs = [];
    $(".race_table1 tbody tr").each((i, el) => {
      const raceNo = $(el).find(".is-fs18").text().trim();
      const title = $(el).find(".is-fs12").text().trim();
      if (raceNo) {
        programs.push({
          race_number: Number(raceNo),
          race_title: title,
          race_stadium_number: stadiumNumber,
        });
      }
    });

    if (programs.length === 0) throw new Error("HTML構造にデータなし");
    return programs;

  } catch (err) {
    // リトライ処理
    if (retry < 2) {
      console.warn(`⚠️ ${stadiumNumber}番場：失敗 → 再試行します (${retry + 1})`);
      await new Promise((r) => setTimeout(r, 2000));
      return fetchRaceData(stadiumNumber, retry + 1);
    }
    console.error(`❌ ${stadiumNumber}番場：データ取得失敗 (${err.message})`);
    return [];
  }
}

/**
 * PlaywrightでのHTML取得 (API失敗時のバックアップ)
 */
async function fetchWithPlaywright(stadiumNumber) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd=${String(
    stadiumNumber
  ).padStart(2, "0")}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const html = await page.content();

    const $ = cheerio.load(html);
    const programs = [];
    $(".race_table1 tbody tr").each((i, el) => {
      const raceNo = $(el).find(".is-fs18").text().trim();
      const title = $(el).find(".is-fs12").text().trim();
      if (raceNo) {
        programs.push({
          race_number: Number(raceNo),
          race_title: title,
          race_stadium_number: stadiumNumber,
        });
      }
    });

    return programs;

  } catch (err) {
    console.error(`⚠️ Playwrightスクレイピング失敗 (${stadiumNumber}番場): ${err.message}`);
    return [];

  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 全場のデータ取得
 */
async function main() {
  console.log("🚀 外部APIからレースデータを取得しています...");
  const allData = [];
  const totalVenues = 24;

  for (let i = 1; i <= totalVenues; i++) {
    let programs = await fetchRaceData(i);

    // HTMLスクレイピングへフォールバック
    if (programs.length === 0) {
      console.warn(`⚠️ ${String(i).padStart(2, "0")}番場：HTMLスクレイピングに切替`);
      programs = await fetchWithPlaywright(i);
    }

    if (programs.length === 0) {
      console.warn(`⚠️ ${String(i).padStart(2, "0")}番場：レース情報なし`);
    } else {
      allData.push(...programs);
    }
  }

  if (allData.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  const output = {
    updated: new Date().toISOString(),
    venues: { programs: allData },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ 致命的エラー:", err);
  process.exit(1);
});