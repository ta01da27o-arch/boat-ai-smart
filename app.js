import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data/data.json";
const HISTORY_URL = "./data/history.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM参照 */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const entryTable = document.getElementById("entryTable").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const aiStatus = document.getElementById("aiStatus");

let allData = null;
let currentVenue = null;
let currentRaces = [];
let currentRace = null;

/* ---- 日付表示 ---- */
const today = new Date();
const yesterday = new Date(today.getTime() - 86400000);

let currentDate = today;
updateDateLabel();

function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP");
}

/* ---- 画面切替 ---- */
function showScreen(name) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}

/* ---- 固定24場雛型を描画 ---- */
function renderVenueSkeleton() {
  venuesGrid.innerHTML = "";
  VENUE_NAMES.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "venue";
    div.innerHTML = `
      <button class="venue-btn" data-id="${i + 1}">
        <div class="venue-name">${name}</div>
        <div class="venue-info">データ取得中...</div>
      </button>
    `;
    venuesGrid.appendChild(div);
  });
}

/* ---- データ取得 ---- */
async function loadRaceData() {
  renderVenueSkeleton();

  try {
    const res = await fetch(DATA_URL);
    allData = await res.json();
    console.log("✅ data.json 取得成功", allData);

    updateVenueGrid();

  } catch (err) {
    console.error("❌ data.json取得エラー:", err);
    document.querySelectorAll(".venue-info").forEach(el => el.textContent = "データ取得失敗");
  }
}

/* ---- 24場にデータ反映 ---- */
function updateVenueGrid() {
  const programs = allData?.venues?.programs || [];

  document.querySelectorAll(".venue-btn").forEach(btn => {
    const id = Number(btn.dataset.id);
    const venueName = VENUE_NAMES[id - 1];
    const match = programs.find(p => p.race_stadium_number === id);

    if (match) {
      btn.querySelector(".venue-info").textContent =
        `${match.race_date} 第${match.race_number}R ${match.race_title}`;
    } else {
      btn.querySelector(".venue-info").textContent = "本日の開催なし";
    }

    btn.onclick = () => {
      currentVenue = id;
      venueTitle.textContent = venueName;
      showRaces(id);
      showScreen("races");
    };
  });
}

/* ---- レース番号画面 ---- */
function showRaces(venueId) {
  racesGrid.innerHTML = "";
  const programs = allData?.venues?.programs?.filter(p => p.race_stadium_number === venueId) || [];

  for (let i = 1; i <= 12; i++) {
    const race = programs.find(p => p.race_number === i);
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `第${i}R`;
    btn.disabled = !race;
    if (race) btn.onclick = () => showRaceDetail(race);
    racesGrid.appendChild(btn);
  }
}

/* ---- 出走表画面 ---- */
function showRaceDetail(race) {
  currentRace = race;
  raceTitle.textContent = `${VENUE_NAMES[race.race_stadium_number - 1]} 第${race.race_number}R`;
  entryTable.innerHTML = "";
  commentTable.innerHTML = "";
  rankingTable.innerHTML = "";
  aiMainTable.innerHTML = "";
  aiSubTable.innerHTML = "";
  resultTable.innerHTML = "";

  // 出走表
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_rank || '-'} / ${b.racer_name} / ${b.racer_st}</td>
      <td>${b.racer_f}</td>
      <td>${b.racer_nation || '-'}</td>
      <td>${b.racer_local || '-'}</td>
      <td>${b.racer_mt || '-'}</td>
      <td>${b.racer_course || '-'}</td>
      <td>-</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI関連
  aiStatus.textContent = "AI解析中...";
  setTimeout(async () => {
    const aiPred = generateAIPredictions(race);
    const aiCom = generateAIComments(race);
    const aiRank = analyzeRace(race);

    // AI本命/穴
    aiPred.main.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.combo}</td><td>${p.prob}%</td>`;
      aiMainTable.appendChild(tr);
    });
    aiPred.sub.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.combo}</td><td>${p.prob}%</td>`;
      aiSubTable.appendChild(tr);
    });

    // コメント
    aiCom.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
      commentTable.appendChild(tr);
    });

    // 順位予測
    aiRank.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score}</td>`;
      rankingTable.appendChild(tr);
    });

    aiStatus.textContent = "AI学習完了";
  }, 500);

  showScreen("detail");
}

/* ---- ボタンイベント ---- */
todayBtn.onclick = () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  currentDate = today;
  updateDateLabel();
  loadRaceData();
};

yesterdayBtn.onclick = () => {
  todayBtn.classList.remove("active");
  yesterdayBtn.classList.add("active");
  currentDate = yesterday;
  updateDateLabel();
  loadRaceData();
};

refreshBtn.onclick = () => {
  aiStatus.textContent = "更新中...";
  loadRaceData();
};

/* 戻る */
document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick = () => showScreen("races");

/* ---- 初期読み込み ---- */
loadRaceData();