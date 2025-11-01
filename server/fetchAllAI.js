// server/fetchAllAI.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeRaceData } from "./scrape.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../data");
const DATA_PATH = path.join(DATA_DIR, "data.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

const today = new Date();
const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
console.log(`📅 Fetching Boat Race Data for ${dateStr}`);

(async () => {
  try {
    const raceData = await scrapeRaceData(dateStr);

    // data.json保存
    const dataJson = { updated: new Date().toISOString(), venues: raceData };
    fs.writeFileSync(DATA_PATH, JSON.stringify(dataJson, null, 2));
    console.log(`✅ data.json saved: ${DATA_PATH}`);

    // history.json更新
    let history = [];
    if (fs.existsSync(HISTORY_PATH)) {
      const content = fs.readFileSync(HISTORY_PATH, "utf-8");
      try {
        const parsed = JSON.parse(content);
        history = Array.isArray(parsed) ? parsed : [];
      } catch {
        history = [];
      }
    }

    history.unshift({ date: dateStr, summary: Object.keys(raceData) });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history.slice(0, 30), null, 2));
    console.log(`✅ history.json updated: ${HISTORY_PATH}`);
  } catch (e) {
    console.error("❌ Fetch failed:", e);
    process.exit(1);
  }
})();