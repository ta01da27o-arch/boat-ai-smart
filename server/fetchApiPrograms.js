/**
 * 外部APIから全国のレースデータを取得（無料ソース利用）
 * 保存先: ./server/data/data.json
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const DATA_DIR = path.resolve("server/data");
const DATA_PATH = path.join(DATA_DIR, "data.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

// 無料の代替ソース（例: boatraceの代替JSON APIラッパー）
const API_URL = "https://kyotei-api.vercel.app/api/today"; // ← 無料公開ミラーAPI

async function fetchRaceData() {
  console.log("🚀 Fetching race data from external API...");

  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  // data.json 形式に合わせて整形
  const output = json.map(item => ({
    stadium: item.stadium || "不明",
    date: item.date,
    races: item.races.map(r => ({
      race_no: r.no,
      title: r.title,
      entries: r.entries.map(e => ({
        no: e.no,
        name: e.name,
        class: e.class,
        st: e.st,
        rank: e.rank,
        motor: e.motor,
        course: e.course,
        evaluation: e.evaluation || "-"
      }))
    }))
  }));

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(output, null, 2));
  console.log("✅ Saved:", DATA_PATH);

  // history.json（最新結果更新）
  const history = {
    updated: new Date().toISOString(),
    records: []
  };
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log("✅ Saved:", HISTORY_PATH);
}

fetchRaceData()
  .then(() => console.log("🎯 Fetch completed"))
  .catch(err => {
    console.error("❌ Fetch failed:", err);
    process.exit(1);
  });