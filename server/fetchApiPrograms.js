// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "data.json");

const API_URL = "https://www.boatrace.jp/api/api/bosyu/racecard"; // ← 実際のAPI先

async function fetchRaceData() {
  console.log("🚀 外部APIからレースデータを取得しています...");

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data || !data.venues || !data.venues.programs)
      throw new Error("不正なAPIレスポンス");

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");

    console.log("✅ 本物データ取得完了:", DATA_PATH);
  } catch (err) {
    console.error("❌ 取得失敗:", err);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchRaceData();
}