// fetchKyotei24.js
import fs from "fs";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

const DATA_PATH = path.resolve("./server/data/data.json");

// ボートレース場番号と名前
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// 今日の日付（YYYYMMDD形式）
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const dateStr = `${yyyy}${mm}${dd}`;

async function fetchVenue(venueId) {
  const url = `https://racelist.kyotei24.jp/race/list/${dateStr}/${venueId}`;
  try {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    // レースデータ抽出（例: レース番号とタイトル）
    const races = [];
    $(".raceListBox li").each((i, el) => {
      const raceNum = $(el).find(".raceNum").text().trim();
      const title = $(el).find(".raceTitle").text().trim();
      if (raceNum && title) {
        races.push({
          race_number: Number(raceNum),
          race_title: title
        });
      }
    });

    return races;
  } catch (err) {
    console.warn(`${VENUES[venueId-1]}：データ取得失敗`, err.message);
    return [];
  }
}

async function fetchAllVenues() {
  const programs = [];
  for (let i = 1; i <= VENUES.length; i++) {
    console.log(`🌊 ${i}番場：取得中...`);
    const races = await fetchVenue(i);
    if (races.length > 0) {
      races.forEach(race => {
        programs.push({
          race_date: `${yyyy}-${mm}-${dd}`,
          race_stadium_number: i,
          race_number: race.race_number,
          race_title: race.race_title
        });
      });
    } else {
      console.warn(`⚠️ ${i}番場：レース情報なし`);
    }
  }
  return programs;
}

async function main() {
  console.log("🚀 Kyotei24 レースデータ取得を開始します...");
  const programs = await fetchAllVenues();

  if (programs.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  const data = {
    updated: new Date().toISOString(),
    venues: { programs }
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ データ保存完了: ${DATA_PATH}`);
}

main();