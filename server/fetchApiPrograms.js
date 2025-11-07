import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const __dirname = path.resolve();
const OUTPUT_PATH = path.join(__dirname, "server/data/data.json");

// 公式HTML or 外部API候補URL
const API_URL = "https://www.boatrace.jp/owpc/pc/RaceProgram";
const API_FALLBACK = "https://api.boatrace-db.net/v1/programs/today"; // 無料APIが生きていれば利用

// 各場コード（01〜24）
const VENUE_CODES = [
  "01", "02", "03", "04", "05", "06", "07", "08",
  "09", "10", "11", "12", "13", "14", "15", "16",
  "17", "18", "19", "20", "21", "22", "23", "24"
];

console.log("🚀 外部APIからレースデータを取得しています...");

async function fetchRaceData() {
  let programs = [];

  // ✅ 1️⃣ 外部API試行
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

  // ✅ 2️⃣ HTMLスクレイピング fallback
  for (const code of VENUE_CODES) {
    try {
      const url = `${API_URL}?jcd=${code}&hd=${getToday()}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $(".heading1_title").text().trim();
      const races = [];

      $(".table1 tbody tr").each((i, el) => {
        const tds = $(el).find("td");
        if (tds.length >= 4) {
          races.push({
            race_number: i + 1,
            race_title: $(tds[1]).text().trim(),
            race_closed_at: $(tds[2]).text().trim(),
          });
        }
      });

      programs.push({
        stadium_code: code,
        stadium_name: $(".heading1_title").text().replace("レース展望", "").trim(),
        race_date: getToday(),
        races,
        title
      });
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
    venues: {
      programs: data,
    },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);
})();