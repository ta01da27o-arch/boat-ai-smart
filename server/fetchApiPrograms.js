// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const API_URL = "https://kyotei-json.vercel.app/today"; // 無料の外部API
const DATA_DIR = path.resolve("server/data");
const DATA_PATH = path.join(DATA_DIR, "data.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

/** ダミーデータ生成関数 */
function generateDummyData() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
  ];

  const dummy = {
    updated: new Date().toISOString(),
    venues: {
      programs: []
    }
  };

  for (let v = 0; v < venues.length; v++) {
    for (let r = 1; r <= 12; r++) {
      const race = {
        race_date: new Date().toISOString().slice(0, 10),
        race_stadium_number: v + 1,
        race_number: r,
        race_closed_at: new Date(Date.now() + r * 3600000).toISOString(),
        race_grade_number: Math.floor(Math.random() * 5) + 1,
        race_title: `${venues[v]} ${r}R テスト杯`,
        race_subtitle: "予選",
        race_distance: 1800,
        boats: Array.from({ length: 6 }).map((_, i) => ({
          racer_boat_number: i + 1,
          racer_name: `選手${i + 1}`,
          racer_number: 4000 + i,
          racer_experience: Math.floor(Math.random() * 10) + 1,
          racer_st: (Math.random() * 0.2 + 0.1).toFixed(2),
          racer_f_count: Math.floor(Math.random() * 3),
          racer_laps: (Math.random() * 1.5 + 6.0).toFixed(2),
          racer_rank: ["A1", "A2", "B1", "B2"][Math.floor(Math.random() * 4)]
        }))
      };
      dummy.venues.programs.push(race);
    }
  }

  return dummy;
}

/** ファイル保存 */
function saveJSON(filePath, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** メイン処理 */
async function main() {
  console.log("🚀 外部APIからレースデータを取得しています...");

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // API構造を標準化
    const formatted = {
      updated: new Date().toISOString(),
      venues: data
    };

    saveJSON(DATA_PATH, formatted);
    saveJSON(HISTORY_PATH, { history: [], updated: formatted.updated });
    console.log(`✅ APIデータ取得成功: ${formatted.updated}`);

  } catch (err) {
    console.warn(`⚠️ API接続に失敗: ${err.message}`);
    console.log("➡️ ダミーデータを生成します...");
    const dummy = generateDummyData();
    saveJSON(DATA_PATH, dummy);
    saveJSON(HISTORY_PATH, { history: [], updated: dummy.updated });
    console.log(`✅ ダミーデータ保存完了: ${DATA_PATH}`);
  }
}

main().catch((e) => {
  console.error("❌ 致命的エラー:", e);
  process.exit(1);
});
