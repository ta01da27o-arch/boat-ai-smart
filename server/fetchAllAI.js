/**
 * fetchAllAI.js
 * 🚤 競艇公式サイトスクレイピング＋AI予想自動生成
 * Node.js（GitHub Actions）用
 */

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import cheerio from "cheerio";

// データ保存先
const DATA_PATH = path.resolve("./data/data.json");
const HISTORY_PATH = path.resolve("./data/history.json");

// 全国24場コード
const VENUES = [
  { name: "桐生", code: "01" },
  { name: "戸田", code: "02" },
  { name: "江戸川", code: "03" },
  { name: "平和島", code: "04" },
  { name: "多摩川", code: "05" },
  { name: "浜名湖", code: "06" },
  { name: "蒲郡", code: "07" },
  { name: "常滑", code: "08" },
  { name: "津", code: "09" },
  { name: "三国", code: "10" },
  { name: "琵琶湖", code: "11" },
  { name: "住之江", code: "12" },
  { name: "尼崎", code: "13" },
  { name: "鳴門", code: "14" },
  { name: "丸亀", code: "15" },
  { name: "児島", code: "16" },
  { name: "宮島", code: "17" },
  { name: "徳山", code: "18" },
  { name: "下関", code: "19" },
  { name: "若松", code: "20" },
  { name: "芦屋", code: "21" },
  { name: "福岡", code: "22" },
  { name: "唐津", code: "23" },
  { name: "大村", code: "24" },
];

// ====================================================
// 公式サイトURL生成
function getRaceUrl(venueCode) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `https://www.boatrace.jp/owpc/pc/race/raceindex?hd=${y}${m}${d}&jcd=${venueCode}`;
}

// ====================================================
// 出走表スクレイピング
async function fetchVenue(venue) {
  const url = getRaceUrl(venue.code);
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const races = [];

  $(".is-fs18").each((i, elem) => {
    const raceTitle = $(elem).text().trim() || `第${i+1}R`;
    const entries = [];

    $(elem).closest("table").find("tr").each((j, tr) => {
      if (j === 0) return; // ヘッダスキップ
      const tds = $(tr).find("td");
      if (tds.length < 5) return;

      entries.push({
        lane: tds.eq(0).text().trim(),
        klass: tds.eq(1).text().trim(),
        name: tds.eq(2).text().trim(),
        st: tds.eq(3).text().trim(),
        f: tds.eq(4).text().trim(),
        national: tds.eq(5)?.text().trim() || "",
        local: tds.eq(6)?.text().trim() || "",
        mt: tds.eq(7)?.text().trim() || "",
        course: tds.eq(8)?.text().trim() || "",
        eval: tds.eq(9)?.text().trim() || ""
      });
    });

    races.push({
      raceTitle,
      entries,
      aiMain: [],
      aiSub: [],
      ranking: [],
      comments: []
    });
  });

  return races;
}

// ====================================================
// AI予想自動生成（簡易ランダムロジック）
function generateAIPrediction(race) {
  const lanes = race.entries.map(e => e.lane);
  // 本命：ランダム1～3号艇
  race.aiMain = lanes
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .map(l => ({ pick: l, rate: Math.floor(Math.random() * 40) + 60 }));

  // 穴：ランダム残り
  race.aiSub = lanes
    .filter(l => !race.aiMain.some(a => a.pick === l))
    .map(l => ({ pick: l, rate: Math.floor(Math.random() * 30) + 10 }));

  // 順位予測
  race.ranking = lanes
    .map(l => ({
      rank: parseInt(l),
      lane: l,
      name: race.entries.find(e => e.lane === l)?.name || "-",
      value: Math.floor(Math.random() * 100)
    }))
    .sort((a,b) => b.value - a.value);

  // 展開コメント
  race.comments = lanes.map(l => `コース${l}は展開${["逃げ","差し","まくり","まくり差し"][Math.floor(Math.random()*4)]}`);
}

// ====================================================
// 全場取得＋AI予想生成
async function fetchAllVenues() {
  const data = { venues: {} };
  for (const v of VENUES) {
    try {
      console.log(`Fetching: ${v.name}`);
      const races = await fetchVenue(v);
      races.forEach(r => generateAIPrediction(r));
      data.venues[v.name] = races;
    } catch (err) {
      console.error(`❌ Error fetching ${v.name}:`, err);
      data.venues[v.name] = [];
    }
  }
  return data;
}

// ====================================================
// JSON保存
async function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ data.json saved: ${DATA_PATH}`);
}

// history.json ダミー生成
async function saveHistory() {
  const dummy = {
    recent: [
      { rank:1, lane:1, name:"山田太郎", st:"0.12" },
      { rank:2, lane:2, name:"鈴木一郎", st:"0.14" },
      { rank:3, lane:3, name:"佐藤次郎", st:"0.15" }
    ]
  };
  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(dummy, null, 2), "utf-8");
  console.log(`✅ history.json saved: ${HISTORY_PATH}`);
}

// ====================================================
// メイン実行
(async () => {
  const data = await fetchAllVenues();
  await saveData(data);
  await saveHistory();
})();
