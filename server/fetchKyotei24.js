// server/fetchKyotei24.js
import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";

const DATA_PATH = path.resolve("./server/data/data.json");
const VENUE_IDS = Array.from({ length: 24 }, (_, i) => i + 1); // 1～24番場
const BASE_URL = "https://racelist.kyotei24.jp";

// 現在日付取得（YYYYMMDD）
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayStr = `${yyyy}${mm}${dd}`;

// 初期データ構造
let data = { updated: new Date().toISOString(), venues: { programs: [] } };

async function fetchVenue(venueId) {
  try {
    const url = `${BASE_URL}/racelist?date=${todayStr}&jcd=${venueId}`;
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const races = [];

    // レーステーブルを解析
    $("table.race-table tbody tr").each((_, el) => {
      const tds = $(el).find("td");
      if (tds.length < 5) return;

      const raceNumber = Number($(tds[0]).text().trim());
      const raceTitle = $(tds[1]).text().trim();
      const raceDistance = $(tds[2]).text().trim();
      const raceClosedAt = $(tds[3]).text().trim();

      const boats = [];
      $(tds[4]).find("li").each((i, li) => {
        const name = $(li).text().trim();
        boats.push({ racer_boat_number: i + 1, racer_name: name });
      });

      races.push({
        race_date: `${yyyy}-${mm}-${dd}`,
        race_stadium_number: venueId,
        race_number: raceNumber,
        race_closed_at: raceClosedAt,
        race_title: raceTitle,
        race_distance,
        boats,
      });
    });

    if (races.length === 0) {
      console.warn(`⚠️ ${venueId}番場：レース情報なし`);
    }

    data.venues.programs.push(...races);
  } catch (err) {
    console.error(`❌ ${venueId}番場：取得失敗`, err.message);
  }
}

async function main() {
  console.log("🚀 kyotei24 から本日のレースデータを取得しています...");

  for (const vid of VENUE_IDS) {
    await fetchVenue(vid);
  }

  if (data.venues.programs.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ データ保存完了: ${DATA_PATH}`);
}

main();