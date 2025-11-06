// app.js
import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data/data.json";
const HISTORY_URL = "./data/history.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody = document.querySelector("#resultTable tbody");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

let currentDate = "today";
let raceData = null;
let historyData = null;

/* 🧠 学習データ保持（localStorage） */
let aiStats = JSON.parse(localStorage.getItem("aiStats") || "{}");

function saveAIStats() {
  localStorage.setItem("aiStats", JSON.stringify(aiStats));
}

/* 📅 日付切り替え */
function updateDateLabel() {
  const d = new Date();
  if (currentDate === "yesterday") d.setDate(d.getDate() - 1);
  const str = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  dateLabel.textContent = str;
}

/* 💾 データ取得 */
async function loadData() {
  try {
    const res = await fetch(DATA_URL + `?t=${Date.now()}`);
    raceData = await res.json();
  } catch {
    console.error("データ取得失敗");
  }

  try {
    const res2 = await fetch(HISTORY_URL + `?t=${Date.now()}`);
    historyData = await res2.json();
  } catch {
    console.warn("履歴データ取得失敗");
  }

  renderVenues();
}

/* 🏟️ 24場一覧表示 */
function renderVenues() {
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, idx) => {
    const venueEl = document.createElement("div");
    venueEl.className = "venue-card clickable";

    const program = raceData?.venues?.programs?.find(p => p.race_stadium_number === idx + 1);
    const status = program ? "開催中" : "ー";

    // AI的中率を localStorage から取得（初期値は "--%"）
    const accuracy = aiStats[name]?.accuracy ?? "--";

    venueEl.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status ${program ? "active" : "closed"}">${status}</div>
      <div class="v-accuracy">${accuracy}%</div>
    `;

    if (program) {
      venueEl.addEventListener("click", () => openVenue(idx + 1, name));
    }

    venuesGrid.appendChild(venueEl);
  });
}

/* 🎫 レース番号画面 */
function openVenue(stadiumNo, name) {
  venueTitle.textContent = `${name} (${stadiumNo})`;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");

  const races = raceData?.venues?.programs?.filter(p => p.race_stadium_number === stadiumNo) || [];
  renderRaces(races, stadiumNo, name);
}

function renderRaces(races, stadiumNo, name) {
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    const race = races.find(r => r.race_number === i);
    if (race) {
      btn.addEventListener("click", () => openRaceDetail(race, name));
    } else {
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }
}

/* 🏁 出走表画面 */
function openRaceDetail(race, venueName) {
  raceTitle.textContent = `${venueName} ${race.race_number}R ${race.race_title}`;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");

  renderEntryTable(race);
  renderAISections(race, venueName);
  renderHistory(race);
}

/* 出走表 */
function renderEntryTable(race) {
  entryTableBody.innerHTML = "";
  race.boats.forEach((b, i) => {
    const row = document.createElement("tr");
    row.classList.add(`row-${b.racer_boat_number}`);
    row.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td class="entry-left">
        <div class="klass">A${b.racer_class_number}</div>
        <div class="name">${b.racer_name}</div>
        <div class="st">ST:${b.racer_average_start_timing}</div>
      </td>
      <td>${b.racer_flying_count}</td>
      <td>${b.racer_national_top_3_percent}%</td>
      <td>${b.racer_local_top_3_percent}%</td>
      <td>${b.racer_assigned_motor_top_3_percent}%</td>
      <td>${b.racer_boat_number}</td>
      <td class="eval-mark">-</td>
    `;
    entryTableBody.appendChild(row);
  });
}

/* 🤖 AIセクション */
function renderAISections(race, venueName) {
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";

  const { main, sub } = generateAIPredictions(race);
  const comments = generateAIComments(race);
  const analysis = analyzeRace(race);

  main.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.buy}</td><td>${m.prob}%</td>`;
    aiMainBody.appendChild(tr);
  });

  sub.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.buy}</td><td>${m.prob}%</td>`;
    aiSubBody.appendChild(tr);
  });

  comments.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTableBody.appendChild(tr);
  });

  analysis.forEach((a, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${a.boat}</td><td>${a.name}</td><td>${a.score}</td>`;
    rankingTableBody.appendChild(tr);
  });

  // AI学習精度を更新
  if (!aiStats[venueName]) aiStats[venueName] = { accuracy: 50 };
  aiStats[venueName].accuracy = Math.min(100, aiStats[venueName].accuracy + Math.random() * 2 - 1);
  saveAIStats();
}

/* 📊 レース結果 */
function renderHistory(race) {
  resultTableBody.innerHTML = "";
  if (!historyData?.results) return;

  const result = historyData.results.find(r => r.race_number === race.race_number);
  if (!result) return;

  result.results.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.rank}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.st}</td>`;
    resultTableBody.appendChild(tr);
  });
}

/* 🔙 戻る */
backToVenues.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});
backToRaces.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

/* 🔄 更新 */
refreshBtn.addEventListener("click", loadData);
todayBtn.addEventListener("click", () => {
  currentDate = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel();
});
yesterdayBtn.addEventListener("click", () => {
  currentDate = "yesterday";
  todayBtn.classList.remove("active");
  yesterdayBtn.classList.add("active");
  updateDateLabel();
});

/* 🚀 初期化 */
updateDateLabel();
loadData();