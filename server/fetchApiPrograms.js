// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import * as cheerio from "cheerio"; // ← 修正ポイント（defaultではなく*）

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "data", "data.json");

async function fetchRaceData() {
  const API_URL = "https://www.boatrace.jp/owpc/pc/RaceProgram"; // 外部公式URL例
  console.log("🚀 外部APIからレースデータを取得しています...");

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // 🧠 仮：24場リストを取得（例）
    const venues = [];
    $(".table1").each((i, el) => {
      const name = $(el).find("caption").text().trim();
      if (name) venues.push({ name, status: "開催中" });
    });

    const result = {
      updated: new Date().toISOString(),
      venues: {
        programs: venues,
      },
    };

    fs.writeFileSync(DATA_PATH, JSON.stringify(result, null, 2), "utf-8");
    console.log(`✅ データ保存完了: ${DATA_PATH}`);
  } catch (err) {
    console.error(`❌ 取得失敗: ${err}`);
    process.exit(1);
  }
}

await fetchRaceData();