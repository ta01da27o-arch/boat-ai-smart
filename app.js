// ============================
// app.js（AI学習 永続保存版）
// ============================

import {
  generateAIPredictions,
  generateAIComments,
  analyzeRace,
  learnFromResults,
  loadAIMemory,
  saveAIMemory,
  resetAIMemory
} from "./ai_engine.js";

const DATA_URL = "./data/data.json";
const HISTORY_URL = "./data/history.json";

const SCREENS = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail")
};

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.querySelector("#entryTable tbody");
const aiMain = document.querySelector("#aiMain tbody");
const aiSub = document.querySelector("#aiSub tbody");
const commentTable = document.querySelector("#commentTable tbody");
const rankingTable = document.querySelector("#rankingTable tbody");
const resultTable = document.querySelector("#resultTable tbody");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const resetBtn = document.getElementById("resetMemoryBtn"); // ← AIリセットボタン（任意）

let allPrograms = [];
let allResults = [];
let currentDateType = "today";
let selectedVenueNumber = null;
let selectedVenueName = null;
let selectedRaces = [];
let selectedRace = null;

// ----------------------------
// 初期化
// ----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupButtons();
  updateDateLabel();

  // ✅ 既存AIメモリを復元
  const restored = loadAIMemory();
  if (restored) {
    aiStatus.textContent = "AI記憶データを読み込みました 🧠";
  }

  await loadData();
});

// ----------------------------
// タブ切替
// ----------------------------
function setupTabs() {
  todayBtn.addEventListener("click", async () => {
    if (currentDateType === "today") return;
    currentDateType = "today";
    toggleTabs();
    updateDateLabel();
    await loadData();
  });
  yesterdayBtn.addEventListener("click", async () => {
    if (currentDateType === "yesterday") return;
    currentDateType = "yesterday";
    toggleTabs();
    updateDateLabel();
    await loadData();
  });
}
function toggleTabs() {
  todayBtn.classList.toggle("active", currentDateType === "today");
  yesterdayBtn.classList.toggle("active", currentDateType === "yesterday");
}
function updateDateLabel() {
  const d = new Date();
  if (currentDateType === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

// ----------------------------
// データ取得 + 学習
// ----------------------------
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    const [programRes, historyRes] = await Promise.all([
      fetch(DATA_URL, { cache: "no-store" }),
      fetch(HISTORY_URL, { cache: "no-store" })
    ]);
    const dataJson = await programRes.json();
    const historyJson = await historyRes.json();

    allPrograms = dataJson?.venues?.programs || [];
    allResults = historyJson?.results || [];

    renderVenues();
    aiStatus.textContent = "AI学習中...";

    await performLearning();

    aiStatus.textContent = "AI更新完了 ✅";
  } catch (err) {
    console.warn("⚠️ データ取得失敗:", err);
    aiStatus.textContent = "ダミーデータ使用中";
    allPrograms = generateDummyData();
    allResults = [];
    renderVenues();
  }
}

// ----------------------------
// AI学習処理 + 永続化
// ----------------------------
async function performLearning() {
  let learnCount = 0;
  for (const result of allResults) {
    const race = allPrograms.find(
      p =>
        p.race_stadium_number === result.race_stadium_number &&
        p.race_number === result.race_number
    );
    if (race) {
      learnFromResults(race, result);
      learnCount++;
    }
  }

  // ✅ 永続保存（localStorage）
  saveAIMemory();

  console.log(`🧠 AI学習完了 (${learnCount}件)`);
}

// ----------------------------
// 24場表示
// ----------------------------
function renderVenues() {
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, idx) => {
    const venueNo = idx + 1;
    const races = allPrograms.filter(r => r.race_stadium_number === venueNo);
    const active = races.length > 0;

    const card = document.createElement("div");
    card.className = `venue-card ${active ? "clickable" : "disabled"}`;
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status ${active ? "active" : "closed"}">${active ? "開催中" : "ー"}</div>
    `;
    if (active) {
      card.addEventListener("click", () => {
        selectedVenueNumber = venueNo;
        selectedVenueName = name;
        selectedRaces = races;
        showRaces();
      });
    }
    venuesGrid.appendChild(card);
  });
  showScreen("venues");
}

// ----------------------------
// レース番号画面
// ----------------------------
function showRaces() {
  racesGrid.innerHTML = "";
  venueTitle.textContent = selectedVenueName;
  for (let i = 1; i <= 12; i++) {
    const race = selectedRaces.find(r => r.race_number === i);
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    if (!race) btn.classList.add("disabled");
    else btn.addEventListener("click", () => showRaceDetail(race));
    racesGrid.appendChild(btn);
  }
  showScreen("races");
}

// ----------------------------
// 出走表 + AI予想 + 結果
// ----------------------------
function showRaceDetail(race) {
  raceTitle.textContent = `${selectedVenueName} 第${race.race_number}R`;
  entryTable.innerHTML = "";
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  commentTable.innerHTML = "";
  rankingTable.innerHTML = "";
  resultTable.innerHTML = "";

  const boats = race.boats || [];
  boats.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td class="entry-left">
        <div class="klass">${b.racer_class_number === 1 ? "A1" : b.racer_class_number === 2 ? "A2" : "B1"}</div>
        <div class="name">${b.racer_name}</div>
        <div class="st">ST:${b.racer_average_start_timing.toFixed(2)}</div>
      </td>
      <td>${b.racer_flying_count || 0}</td>
      <td>${b.racer_national_top_3_percent}%</td>
      <td>${b.racer_local_top_3_percent}%</td>
      <td>${b.racer_assigned_motor_top_2_percent.toFixed(1)}%</td>
    `;
    entryTable.appendChild(tr);
  });

  const preds = generateAIPredictions(race);
  preds.main.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.prob}%</td>`;
    aiMain.appendChild(tr);
  });
  preds.sub.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.prob}%</td>`;
    aiSub.appendChild(tr);
  });

  const comments = generateAIComments(race);
  comments.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTable.appendChild(tr);
  });

  const ranks = analyzeRace(race);
  ranks.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score}</td>`;
    rankingTable.appendChild(tr);
  });

  const result = allResults.find(
    res =>
      res.race_stadium_number === race.race_stadium_number &&
      res.race_number === race.race_number
  );
  if (result) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${result.race_number}R</td>
      <td>${result.winning_combo}</td>
      <td>${result.payout}円</td>
      <td>${result.winner}</td>
    `;
    resultTable.appendChild(tr);
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">結果未確定</td>`;
    resultTable.appendChild(tr);
  }

  showScreen("detail");
}

// ----------------------------
// 汎用
// ----------------------------
function showScreen(name) {
  Object.keys(SCREENS).forEach(k => {
    SCREENS[k].classList.toggle("active", k === name);
  });
}
function setupButtons() {
  backToVenues.addEventListener("click", () => showScreen("venues"));
  backToRaces.addEventListener("click", () => showScreen("races"));
  refreshBtn.addEventListener("click", () => loadData());
  if (resetBtn) resetBtn.addEventListener("click", () => {
    resetAIMemory();
    aiStatus.textContent = "AI記憶データを初期化しました 🧹";
  });
}

// ----------------------------
// ダミーデータ
// ----------------------------
function generateDummyData() {
  return [
    {
      race_stadium_number: 2,
      race_number: 1,
      race_title: "テストダミー杯",
      boats: Array.from({ length: 6 }, (_, j) => ({
        racer_boat_number: j + 1,
        racer_name: `テスト選手${j + 1}`,
        racer_class_number: j < 2 ? 1 : 3,
        racer_average_start_timing: 0.15 + Math.random() * 0.05,
        racer_flying_count: 0,
        racer_national_top_3_percent: (10 + Math.random() * 50).toFixed(1),
        racer_local_top_3_percent: (10 + Math.random() * 50).toFixed(1),
        racer_assigned_motor_top_2_percent: (30 + Math.random() * 40).toFixed(1)
      }))
    }
  ];
}