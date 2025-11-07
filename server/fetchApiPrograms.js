import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const __dirname = process.cwd();
const OUTPUT_PATH = path.join(__dirname, "data/data.json");

const API_FALLBACK = "https://api.boatrace-db.net/v1/programs/today";
const VENUE_CODES = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

console.log("🚀 外部APIからレースデータを取得しています...");

async function fetchRaceData() {
  let programs = [];

  // ===== 1️⃣ 外部API試行 =====
  try {
    const res = await fetch(API_FALLBACK);
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.length > 0) {
        console.log("✅ 外部APIから取得成功");
        return json.data;
      }
    } else {
      console.log("⚠️ 外部API応答なし:", res.status);
    }
  } catch {
    console.log("⚠️ 外部API接続失敗 → HTMLスクレイピングに切替");
  }

  // ===== 2️⃣ スクレイピング =====
  const today = getToday();

  for (const code of VENUE_CODES) {
    const url = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${code}&hd=${today}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // ✅ 開催タイトル取得（例：『第14回マスターズVSルーキーズ・マンスリーBR杯』）
      const title = $(".is-blink .heading2_title, .heading1_title").first().text().trim() || "開催なし";

      // ✅ 開催なしの場合スキップ
      if (title === "開催なし" || title === "") {
        continue;
      }

      const races = [];

      // ✅ レースカード要素取得（例：第1R〜第12R）
      $(".table1 .is-fs12").each((i, el) => {
        const raceName = $(el).text().trim();
        if (raceName) {
          races.push({
            race_number: i + 1,
            race_title: raceName,
            race_closed_at: null,
          });
        }
      });

      if (races.length > 0) {
        programs.push({
          stadium_code: code,
          stadium_name: $("title").text().replace("｜BOAT RACE オフィシャルウェブサイト", "").trim(),
          race_date: today,
          races,
        });
        console.log(`✅ ${code}番場: ${races.length}R取得`);
      }
    } catch (e) {
      console.log(`⚠️ ${code}番場の取得失敗: ${e.message}`);
    }
  }

  return programs;
}

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

(async () => {
  const data = await fetchRaceData();

  if (!data || data.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  const output = {
    updated: new Date().toISOString(),
    venues: { programs: data },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);
})();