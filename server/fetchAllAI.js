import fs from "fs";
import path from "path";
import { VENUES } from "./venues.js";
import { fetchVenueRaces } from "./scrape.js";

const DATA_PATH = path.resolve("./data/data.json");
const HISTORY_PATH = path.resolve("./data/history.json");

async function fetchAll() {
  const data = { venues: {} };

  for (const venue of VENUES) {
    try {
      const races = await fetchVenueRaces(venue);
      data.venues[venue] = races;
      console.log(`✅ ${venue} fetched`);
    } catch (err) {
      console.error(`❌ ${venue} fetch failed`, err);
      data.venues[venue] = [];
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ data.json saved: ${DATA_PATH}`);

  // ダミーの直近レース結果
  const history = {
    recent: [
      { rank: 1, lane: 1, name: "山田太郎", st: "0.12" },
      { rank: 2, lane: 2, name: "鈴木一郎", st: "0.14" },
      { rank: 3, lane: 3, name: "佐藤次郎", st: "0.15" }
    ]
  };

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log(`✅ history.json saved: ${HISTORY_PATH}`);
}

fetchAll();
