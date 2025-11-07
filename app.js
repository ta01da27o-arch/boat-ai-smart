import { generateAIComments, analyzeRace } from "./ai_engine.js";

const DATA_URL = "./data/data.json";
const PREDICTIONS_URL = "./data/predictions.csv";

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
const venuesContainer = document.getElementById("venues");
const racesContainer = document.getElementById("races");
const raceDetailContainer = document.getElementById("raceDetail");

let raceData = null;
let predictions = {};
let currentVenue = null;
let currentRace = null;

/* ========== 初期化 ========== */
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  await loadPredictions();
  renderVenues();
});

/* ========== データ読み込み ========== */
async function loadData() {
  const res = await fetch(DATA_URL);
  raceData = await res.json();
}

async function loadPredictions() {
  const res = await fetch(PREDICTIONS_URL);
  const text = await res.text();
  predictions = parseCSV(text);
}

/* ========== CSV解析 ========== */
function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const data = {};
  lines.slice(1).forEach(line => {
    const [stadium, race_number, buy, probability] = line.split(",");
    if (!data[stadium]) data[stadium] = {};
    if (!data[stadium][race_number]) data[stadium][race_number] = [];
    data[stadium][race_number].push({ buy, probability: parseFloat(probability) });
  });
  return data;
}

/* ========== 24場表示 ========== */
function renderVenues() {
  venuesContainer.innerHTML = "";
  const programs = raceData?.venues?.programs || [];

  VENUE_NAMES.forEach(name => {
    const venueEl = document.createElement("div");
    venueEl.className = "venue-card";

    // 開催中判定
    const venueData = programs.find(p => p.stadium_name === name);
    const active = venueData && venueData.races && venueData.races.length > 0;
    const accuracy = Math.random() * 100; // 仮の的中率（将来AI履歴から反映）

    venueEl.innerHTML = `
      <div class="venue-title">${name}</div>
      <div class="venue-status ${active ? "active" : "inactive"}">
        ${active ? "開催中" : "ー"}
      </div>
      <div class="venue-accuracy">
        ${active ? `${accuracy.toFixed(1)}%` : ""}
      </div>
    `;

    if (active) {
      venueEl.addEventListener("click", () => renderRaces(venueData));
    } else {
      venueEl.classList.add("grayout");
    }

    venuesContainer.appendChild(venueEl);
  });
}

/* ========== レース一覧表示 ========== */
function renderRaces(venueData) {
  currentVenue = venueData;
  venuesContainer.style.display = "none";
  racesContainer.style.display = "block";
  raceDetailContainer.style.display = "none";

  racesContainer.innerHTML = `
    <h2>${venueData.stadium_name}（全${venueData.races.length}R）</h2>
    <div class="race-list">
      ${venueData.races.map(r => `
        <button class="race-btn" onclick="showRaceDetail(${r.race_number})">
          ${r.race_number}R
        </button>
      `).join("")}
    </div>
    <button class="back-btn" onclick="backToVenues()">戻る</button>
  `;
}

/* ========== 出走表表示 ========== */
window.showRaceDetail = function (raceNumber) {
  const race = currentVenue.races.find(r => r.race_number === raceNumber);
  currentRace = race;
  racesContainer.style.display = "none";
  raceDetailContainer.style.display = "block";

  const aiPreds = predictions[currentVenue.stadium_name]?.[raceNumber] || [];

  raceDetailContainer.innerHTML = `
    <h2>${currentVenue.stadium_name} 第${raceNumber}R</h2>
    <div class="boats">
      ${race.boats.map(b => `
        <div class="boat-card boat-${b.racer_boat_number}">
          <div class="boat-num">${b.racer_boat_number}</div>
          <div class="boat-name">${b.racer_name}</div>
          <div class="boat-winrate">勝率 ${b.racer_national_top_3_percent.toFixed(1)}%</div>
        </div>
      `).join("")}
    </div>
    <div class="ai-predictions">
      <h3>🎯 AI予想買い目</h3>
      ${aiPreds.slice(0, 5).map(p => `
        <div class="ai-buy">${p.buy}　${p.probability.toFixed(1)}%</div>
      `).join("")}
    </div>
    <button class="back-btn" onclick="backToRaces()">戻る</button>
  `;
};

/* ========== 戻る操作 ========== */
window.backToVenues = function () {
  racesContainer.style.display = "none";
  raceDetailContainer.style.display = "none";
  venuesContainer.style.display = "block";
};

window.backToRaces = function () {
  raceDetailContainer.style.display = "none";
  racesContainer.style.display = "block";
};