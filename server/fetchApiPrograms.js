// server/fetchApiPrograms.js
import fs from "fs";
import fetch from "node-fetch";

const DATA_DIR = "./server/data";
const DATA_FILE = `${DATA_DIR}/data.json`;
const HISTORY_FILE = `${DATA_DIR}/history.json`;

// テスト用のダミーAPI（安定してアクセス可）
const API_URL = "https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json";

async function fetchRaceData() {
  console.log("🚀 外部 API からレースデータを取得しています...");

  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const json = await res.json();

  // ダミー構造：競艇風に整形
  const today = new Date().toISOString().split("T")[0];
  const data = {
    updated: today,
    venues: {
      大村: [
        {
          race_no: 1,
          title: json[0].publishingOffice + "杯 第1R",
          weather: json[0].timeSeries[0].areas[0].weathers[0],
          wind: json[0].timeSeries[0].areas[0].winds[0],
          temp: json[0].timeSeries[0].areas[0].temps
            ? json[0].timeSeries[0].areas[0].temps[0]
            : "--",
        },
      ],
    },
  };

  // 保存先フォルダがなければ作成
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([data], null, 2));

  console.log(`✅ Saved: ${DATA_FILE}`);
  console.log(`✅ Saved: ${HISTORY_FILE}`);
  console.log("🎯 Fetch completed");
}

fetchRaceData().catch((err) => {
  console.error("❌ 取得失敗:", err);
  process.exit(1);
});