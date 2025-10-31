import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { load } from "cheerio";

const DATA_PATH = path.resolve("./data/data.json");
const HISTORY_PATH = path.resolve("./data/history.json");

const VENUES = [
  { name: "桐生", code: "01" }, { name: "戸田", code: "02" },
  { name: "江戸川", code: "03" }, { name: "平和島", code: "04" },
  { name: "多摩川", code: "05" }, { name: "浜名湖", code: "06" },
  { name: "蒲郡", code: "07" }, { name: "常滑", code: "08" },
  { name: "津", code: "09" }, { name: "三国", code: "10" },
  { name: "琵琶湖", code: "11" }, { name: "住之江", code: "12" },
  { name: "尼崎", code: "13" }, { name: "鳴門", code: "14" },
  { name: "丸亀", code: "15" }, { name: "児島", code: "16" },
  { name: "宮島", code: "17" }, { name: "徳山", code: "18" },
  { name: "下関", code: "19" }, { name: "若松", code: "20" },
  { name: "芦屋", code: "21" }, { name: "福岡", code: "22" },
  { name: "唐津", code: "23" }, { name: "大村", code: "24" }
];

function getRaceUrl(venueCode) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${y}${m}${d}&jcd=${venueCode}`;
}

async function fetchVenue(venue) {
  const url = getRaceUrl(venue.code);
  const res = await fetch(url);
  const html = await res.text();
  const $ = load(html);
  const races = [];

  // 各レース枠ごとのブロックを取得
  $(".table1").each((i, elem) => {
    const raceTitle = `${i + 1}R`;
    const entries = [];

    $(elem).find("tbody tr").each((j, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 5) return;

      entries.push({
        lane: tds.eq(0).text().trim(),
        klass: tds.eq(1).text().trim(),
        name: tds.eq(2).text().trim(),
        st: tds.eq(6)?.text().trim() || "",
        course: tds.eq(7)?.text().trim() || ""
      });
    });

    if (entries.length > 0) {
      races.push({
        raceTitle,
        entries,
        aiMain: [],
        aiSub: [],
        ranking: [],
        comments: []
      });
    }
  });

  return races;
}

function generateAIPrediction(race) {
  const lanes = race.entries.map(e => e.lane);
  race.aiMain = lanes.slice(0, 2).map(l => ({ pick: l, rate: 70 + Math.floor(Math.random() * 20) }));
  race.aiSub = lanes.slice(2).map(l => ({ pick: l, rate: 20 + Math.floor(Math.random() * 30) }));
  race.ranking = lanes.map((l, i) => ({
    rank: i + 1,
    lane: l,
    name: race.entries.find(e => e.lane === l)?.name || "",
    value: Math.floor(Math.random() * 100)
  }));
  race.comments = lanes.map(l => `コース${l}は${["逃げ", "差し", "まくり", "まくり差し"][Math.floor(Math.random() * 4)]}展開`);
}

async function fetchAllVenues() {
  const data = { venues: {} };
  for (const v of VENUES) {
    try {
      console.log(`Fetching: ${v.name}`);
      const races = await fetchVenue(v);
      races.forEach(r => generateAIPrediction(r));
      data.venues[v.name] = races;
    } catch (err) {
      console.error(`❌ ${v.name} 取得エラー:`, err);
      data.venues[v.name] = [];
    }
  }
  return data;
}

async function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ data.json saved`);
}

async function saveHistory() {
  const dummy = {
    recent: [
      { rank: 1, lane: 1, name: "山田太郎", st: "0.12" },
      { rank: 2, lane: 2, name: "鈴木一郎", st: "0.14" },
      { rank: 3, lane: 3, name: "佐藤次郎", st: "0.15" }
    ]
  };
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(dummy, null, 2), "utf-8");
  console.log(`✅ history.json saved`);
}

(async () => {
  const data = await fetchAllVenues();
  await saveData(data);
  await saveHistory();
})();
