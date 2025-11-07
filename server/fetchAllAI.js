import fs from "fs";
import path from "path";
import { generateAIPredictions } from "./ai_engine.js";

const __dirname = process.cwd();
const DATA_PATH = path.join(__dirname, "server/data/data.json");
const HISTORY_PATH = path.join(__dirname, "server/data/history.json");
const OUTPUT_PATH = path.join(__dirname, "server/data/predictions.csv");

console.log("🤖 AI予想データ生成開始...");

if (!fs.existsSync(DATA_PATH)) {
  console.error("❌ data.json が見つかりません。先に fetchApiPrograms.js を実行してください。");
  process.exit(1);
}

// 最新レースデータを読み込み
const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
const programs = data.venues.programs || [];
if (programs.length === 0) {
  console.error("❌ レースデータが空です。");
  process.exit(1);
}

// 既存履歴を読み込み
let history = [];
if (fs.existsSync(HISTORY_PATH)) {
  history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
}

// 予測を生成
let csvLines = ["stadium,race_number,buy,probability"];
for (const venue of programs) {
  const { stadium_code, stadium_name, races } = venue;
  if (!races || races.length === 0) continue;

  for (const race of races) {
    const aiPredictions = generateAIPredictions(stadium_name, race.race_number);
    for (const pred of aiPredictions) {
      csvLines.push(`${stadium_name},${race.race_number},${pred.buy},${pred.probability}`);
    }
  }
}

// CSV出力
fs.writeFileSync(OUTPUT_PATH, csvLines.join("\n"), "utf-8");
console.log(`✅ 予想データ出力完了: ${OUTPUT_PATH}`);

// 学習データ履歴を更新
history.push({
  timestamp: new Date().toISOString(),
  updated: data.updated,
  total_venues: programs.length,
});
fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
console.log(`🧩 学習履歴更新完了: ${HISTORY_PATH}`);