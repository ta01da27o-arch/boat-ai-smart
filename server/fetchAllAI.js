import fs from "fs";
import path from "path";
import { VENUES } from "./venues.js";
import { scrapeVenue } from "./scrape.js";

const DATA_PATH = path.resolve("./data/data.json");
const HISTORY_PATH = path.resolve("./data/history.json");

async function fetchAll() {
  const data = { venues: {} };

  for (const v of VENUES) {
    try {
      console.log(`■ FETCH：${v}`);
      const races = await scrapeVenue(v);
      data.venues[v] = races;
    } catch (err) {
      console.error(`❌ ERROR：${v}`, err);
      data.venues[v] = [];
    }
  }

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ 保存：${DATA_PATH}`);

  // 最新レース結果（例として各会場1Rの上位3を抜粋）
  let recent = [];
  for (const v of VENUES) {
    const r0 = data.venues[v]?.[0];
    if (r0 && r0.entries) {
      recent = recent.concat(
        r0.entries.slice(0, 3).map((e, idx) => ({
          rank: idx + 1,
          lane: e.lane,
          name: e.name,
          st: e.st
        }))
      );
    }
  }

  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify({ recent }, null, 2), "utf-8");
  console.log(`✅ 保存：${HISTORY_PATH}`);
}

fetchAll();