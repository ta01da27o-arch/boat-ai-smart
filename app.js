// app.js
import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from "./ai_engine.js";

const DATA_URL = "../data/data.json";
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOM取得
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const entryTableBody = document.querySelector("#entryTable tbody");

let raceData = null;
let selectedVenue = null;
let selectedRace = null;

// 日付表示
function setTodayLabel() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  dateLabel.textContent = `${yyyy}/${mm}/${dd}`;
}

// 画面切り替え
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(sc => sc.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// データ読み込み
async function loadData() {
  try {
    const res = await fetch(DATA_URL + "?t=" + Date.now());
    raceData = await res.json();
    console.log("✅ data.json読み込み成功", raceData);
    renderVenues();
  } catch (err) {
    console.error("❌ data.json読み込みエラー:", err);
  }
}

// ====== 24場画面 ======
function renderVenues() {
  venuesGrid.innerHTML = "";
  const allPrograms = raceData?.venues?.programs || [];

  VENUE_NAMES.forEach((name, idx) => {
    const venueId = idx + 1;
    const venueRaces = allPrograms.filter(r => r.race_stadium_number === venueId);
    const isActive = venueRaces.length > 0;
    const accuracy = isActive ? (Math.random() * 70 + 20).toFixed(1) : null;

    const div = document.createElement("div");
    div.className = `venue-card ${isActive ? "clickable" : "disabled"}`;
    div.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status ${isActive ? "active" : "closed"}">${isActive ? "開催中" : "ー"}</div>
      ${isActive ? `<div class="v-accuracy">${accuracy}%</div>` : ""}
    `;
    if (isActive) div.addEventListener("click", () => showRaces(venueId, name));
    venuesGrid.appendChild(div);
  });
}

// ====== レース番号画面 ======
function showRaces(venueId, name) {
  selectedVenue = venueId;
  venueTitle.textContent = name;
  showScreen("screen-races");

  const allPrograms = raceData?.venues?.programs || [];
  const venueRaces = allPrograms.filter(r => r.race_stadium_number === venueId);

  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const exist = venueRaces.find(r => r.race_number === i);
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.className = exist ? "race-btn" : "race-btn disabled";
    if (exist) btn.addEventListener("click", () => showRaceDetail(i));
    racesGrid.appendChild(btn);
  }
}

// ====== 出走表画面 ======
function showRaceDetail(raceNumber) {
  selectedRace = raceNumber;
  showScreen("screen-detail");

  const allPrograms = raceData?.venues?.programs || [];
  const race = allPrograms.find(
    r => r.race_stadium_number === selectedVenue && r.race_number === raceNumber
  );

  if (!race) {
    raceTitle.textContent = "データなし";
    entryTableBody.innerHTML = `<tr><td colspan="8">出走データがありません</td></tr>`;
    return;
  }

  raceTitle.textContent = `${VENUE_NAMES[selectedVenue - 1]} ${race.race_number}R ${race.race_title}`;

  // 出走表内容
  entryTableBody.innerHTML = race.boats.map(b => {
    const courseWinRate = (Math.random() * 60 + 20).toFixed(1);
    const mark = ["◎","○","▲","△","×","注"][Math.floor(Math.random() * 6)];
    return `
      <tr class="row-${b.racer_boat_number}">
        <td>${b.racer_boat_number}</td>
        <td class="entry-left">
          <span class="klass">B${b.racer_class_number}</span>
          <span class="name">${b.racer_name}</span>
          <span class="st">ST:${b.racer_average_start_timing.toFixed(2)}</span>
        </td>
        <td>${b.racer_flying_count}</td>
        <td>${b.racer_national_top_3_percent.toFixed(1)}%</td>
        <td>${b.racer_local_top_3_percent.toFixed(1)}%</td>
        <td>${b.racer_assigned_motor_top_3_percent.toFixed(1)}%</td>
        <td>${courseWinRate}%</td>
        <td class="eval-mark">${mark}</td>
      </tr>
    `;
  }).join("");

  // AI予想買い目5点
  renderAIPredictions();
}

// ====== AI予想買い目5点 ======
function renderAIPredictions() {
  const aiArea = document.getElementById("aiPredictions");
  if (!aiArea) return;

  const predictions = [
    { bet: "1-3-2", prob: 56 },
    { bet: "1-3-4", prob: 45 },
    { bet: "3-1-2", prob: 33 },
    { bet: "3-1-4", prob: 28 },
    { bet: "3-4-1", prob: 25 },
  ];

  aiArea.innerHTML = `
    <h3>AI予想買い目</h3>
    <ul class="ai-list">
      ${predictions.map(p => `<li>${p.bet}　<span>${p.prob}%</span></li>`).join("")}
    </ul>
  `;
}

// ====== 更新ボタン ======
refreshBtn.addEventListener("click", () => {
  console.log("🔄 更新ボタン押下");
  renderVenues();
});

// ====== 戻る ======
backToVenues.addEventListener("click", () => showScreen("screen-venues"));
backToRaces.addEventListener("click", () => showScreen("screen-races"));

// ====== 初期化 ======
setTodayLabel();
loadData();