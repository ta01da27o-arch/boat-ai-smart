// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const DATA_DIR = path.resolve("./data");
const DATA_PATH = path.join(DATA_DIR, "data.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

// Boatrace Open API for Programs
const API_BASE = "https://boatraceopenapi.github.io/programs/v2";
const TODAY_URL = API_BASE + "/today.json";

async function fetchPrograms() {
  console.log("▶︎ Fetching API:", TODAY_URL);
  const res = await fetch(TODAY_URL);
  if (!res.ok) {
    throw new Error(`API HTTP ${res.status}`);
  }
  const json = await res.json();
  return json;
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    const apiData = await fetchPrograms();
    // 整形（必要に応じ調整してください）
    const output = {
      updated: new Date().toISOString(),
      venues: apiData
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(output, null, 2));
    console.log(`✅ data.json saved: ${DATA_PATH}`);

    // history 更新
    let history = [];
    if (fs.existsSync(HISTORY_PATH)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    history.unshift({
      date: dateStr,
      venues: Object.keys(apiData)
    });

    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history.slice(0, 30), null, 2));
    console.log(`✅ history.json updated: ${HISTORY_PATH}`);
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    process.exit(1);
  }
}

main();