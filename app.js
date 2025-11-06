import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data/data.json";
const HISTORY_URL = "./data/history.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM要素 */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const venuesGrid = document.getElementById("venuesGrid");
const venueTitle = document.getElementById("venueTitle");
const racesGrid = document.getElementById("racesGrid");
const raceTitle = document.getElementById("raceTitle");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

/* 画面制御 */
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick = () => showScreen("races");

let raceData = null;
let historyData = null;
let selectedVenue = null;
let selectedRace = null;

/* 的中率（学習データ） */
let accuracyData = JSON.parse(localStorage.getItem("ai_accuracy") || "{}");

/* ----------- データ取得 ----------- */
async function loadData() {
  try {
    const [dataRes, histRes] = await Promise.all([fetch(DATA_URL), fetch(HISTORY_URL)]);
    raceData = await dataRes.json();
    historyData = await histRes.json();

    calculateAICorrectRate(); // ← 的中率更新
    renderVenues();
  } catch (e) {
    console.error("データ読み込み失敗:", e);
  }
}

/* ----------- AI的中率の自動更新 ----------- */
function calculateAICorrectRate() {
  if (!historyData?.results?.length) return;

  const venueStats = {};

  historyData.results.forEach(result => {
    const venueName = result.venue_name || VENUE_NAMES[result.race_stadium_number - 1];
    if (!venueStats[venueName]) venueStats[venueName] = { total: 0, hit: 0 };

    const aiPredictions = result.ai_predictions || [];
    const actual = result.result?.map(r => r.boat).join("-");

    venueStats[venueName].total += 1;
    if (aiPredictions.some(p => p.combo === actual)) {
      venueStats[venueName].hit += 1;
    }
  });

  Object.keys(venueStats).forEach(v => {
    const stat = venueStats[v];
    const rate = (stat.hit / stat.total) * 100;
    accuracyData[v] = rate;
  });

  localStorage.setItem("ai_accuracy", JSON.stringify(accuracyData));
}

/* ----------- 24場画面 ----------- */
function renderVenues() {
  venuesGrid.innerHTML = "";

  VENUE_NAMES.forEach((name, idx) => {
    const venueId = idx + 1;
    const div = document.createElement("div");
    div.className = "venue-card";

    const programExists = raceData?.venues?.programs?.some(p => p.race_stadium_number === venueId);
    const accuracy = accuracyData[name] ? `${accuracyData[name].toFixed(1)}%` : "ー";

    const status = programExists ? "開催中" : "ー";
    div.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status ${programExists ? "active" : "closed"}">${status}</div>
      <div class="v-accuracy">${accuracy}</div>
    `;

    if (!programExists) {
      div.classList.add("disabled"); // グレーアウト
    } else {
      div.classList.add("clickable");
      div.onclick = () => showVenueRaces(venueId, name);
    }

    venuesGrid.appendChild(div);
  });
}

/* ----------- レース番号画面 ----------- */
function showVenueRaces(venueId, venueName) {
  selectedVenue = venueId;
  venueTitle.textContent = venueName;
  racesGrid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.onclick = () => showRaceDetail(i);

    const exists = raceData.venues.programs.some(
      r => r.race_stadium_number === venueId && r.race_number === i
    );
    if (!exists) btn.classList.add("disabled");

    racesGrid.appendChild(btn);
  }

  showScreen("races");
}

/* ----------- 出走表画面 ----------- */
function showRaceDetail(raceNumber) {
  selectedRace = raceNumber;
  const race = raceData.venues.programs.find(
    r => r.race_stadium_number === selectedVenue && r.race_number === raceNumber
  );
  if (!race) return;

  raceTitle.textContent = `${VENUE_NAMES[selectedVenue - 1]} ${raceNumber}R`;
  entryTable.innerHTML = "";

  race.boats.forEach((b, idx) => {
    const tr = document.createElement("tr");
    tr.className = `row-${idx + 1}`;
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td class="entry-left">
        <span class="klass">B${b.racer_class_number}</span>
        <span class="name">${b.racer_name}</span>
        <span class="st">ST:${b.racer_average_start_timing}</span>
      </td>
      <td>${b.racer_flying_count}</td>
      <td>${b.racer_national_top_3_percent.toFixed(1)}%</td>
      <td>${b.racer_local_top_3_percent.toFixed(1)}%</td>
      <td>${b.racer_assigned_motor_top_3_percent.toFixed(1)}%</td>
      <td>${b.racer_boat_number}</td>
      <td><span class="metric-symbol">${getEvalMark(b)}</span></td>
    `;
    entryTable.appendChild(tr);
  });

  renderAIPredictions(race);
  renderAIComments(race);
  renderRanking(race);
  renderResults();

  showScreen("detail");
}

/* 評価記号 */
function getEvalMark(b) {
  const score = (b.racer_national_top_3_percent + b.racer_assigned_motor_top_3_percent) / 2;
  if (score >= 65) return "◎";
  if (score >= 55) return "○";
  if (score >= 45) return "▲";
  if (score >= 35) return "△";
  return "×";
}

/* ----------- AI予想表示 ----------- */
function renderAIPredictions(race) {
  const preds = generateAIPredictions(race, 5);
  aiMain.innerHTML = preds.main
    .map(p => `<tr><td>${p.combo}</td><td>${p.prob.toFixed(1)}%</td></tr>`)
    .join("");
  aiSub.innerHTML = preds.sub
    .map(p => `<tr><td>${p.combo}</td><td>${p.prob.toFixed(1)}%</td></tr>`)
    .join("");
}

/* ----------- コメント ----------- */
function renderAIComments(race) {
  const comments = generateAIComments(race);
  commentTable.innerHTML = comments
    .map((c, i) => `<tr><td>${i + 1}</td><td>${c}</td></tr>`)
    .join("");
}

/* ----------- 順位予測 ----------- */
function renderRanking(race) {
  const ranks = analyzeRace(race);
  rankingTable.innerHTML = ranks
    .map((r, i) => `<tr><td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score.toFixed(1)}</td></tr>`)
    .join("");
}

/* ----------- レース結果 ----------- */
function renderResults() {
  if (!historyData?.results?.length) return;
  const latest = historyData.results[0];
  resultTable.innerHTML = latest.result
    .map((r, i) => `<tr><td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.st}</td></tr>`)
    .join("");
}

/* ----------- 日付・切替 ----------- */
function updateDateLabel(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  dateLabel.textContent = date.toLocaleDateString("ja-JP");
}

todayBtn.onclick = () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel(0);
};
yesterdayBtn.onclick = () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  updateDateLabel(-1);
};

/* ----------- 更新ボタン ----------- */
refreshBtn.onclick = () => {
  loadData();
  renderVenues(); // レイアウト固定
};

/* ----------- 画面切替 ----------- */
function showScreen(name) {
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");
  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}

/* ----------- 初期化 ----------- */
updateDateLabel();
loadData();