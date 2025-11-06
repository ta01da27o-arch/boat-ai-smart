// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const API_URL = "https://boatrace-api-example.free.beeceptor.com/race_programs"; // 仮の無料API例
const DATA_PATH = path.resolve("server/data/data.json");
const HISTORY_PATH = path.resolve("server/data/history.json");

console.log("🚀 外部APIからレースデータを取得しています...");

async function fetchRaceData() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 🔧 現行API構造対応
    const programs = data?.venues?.programs || data?.programs || [];
    if (programs.length === 0) throw new Error("データ配列が空です。");

    // 💾 保存形式：app.jsが読み取れる形（配列のみ）
    const output = {
      updated: new Date().toISOString(),
      programs: programs,
    };

    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(output.programs, null, 2), "utf8");

    console.log(`✅ ${programs.length}件のレースデータを保存しました。`);
    return true;
  } catch (err) {
    console.error("❌ 取得失敗:", err);
    return false;
  }
}

// （任意）レース結果もダミーで保存（今後AI学習で使用）
async function writeHistoryStub() {
  const stub = {
    updated: new Date().toISOString(),
    results: [],
  };
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(stub, null, 2), "utf8");
}

(async () => {
  const ok = await fetchRaceData();
  if (ok) await writeHistoryStub();
})();