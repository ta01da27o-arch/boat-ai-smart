// app.js
console.log("✅ app.js loaded");

// データパス（index.htmlのグローバル変数を利用）
const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

// UI要素
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const dateLabel = document.getElementById("dateLabel");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

// 画面
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

// 各要素
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody = document.querySelector("#resultTable tbody");
const resultNote = document.getElementById("resultNote");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// 状態変数
let allData = null;
let historyData = null;
let currentVenue = null;
let currentRace = null;
let currentDateType = "today";

// ========== 初期処理 ==========
init();

function init() {
  loadData();
  todayBtn.onclick = () => switchDate("today");
  yesterdayBtn.onclick = () => switchDate("yesterday");
  refreshBtn.onclick = () => loadData(true);
  backToVenues.onclick = () => showScreen("venues");
  backToRaces.onclick = () => showScreen("races");
}

// ========== データ読込 ==========
async function loadData(force = false) {
  aiStatus.textContent = "データ読込中...";
  try {
    const res = await fetch(DATA_PATH + (force ? "?t=" + Date.now() : ""));
    if (!res.ok) throw new Error("data.json取得失敗");
    allData = await res.json();

    const res2 = await fetch(HISTORY_PATH + (force ? "?t=" + Date.now() : ""));
    historyData = res2.ok ? await res2.json() : [];

    renderVenues();
    aiStatus.textContent = "最新データ読込完了";
  } catch (err) {
    console.error(err);
    aiStatus.textContent = "❌ データ取得失敗";
  }
}

// ========== 日付切替 ==========
function switchDate(type) {
  currentDateType = type;
  todayBtn.classList.toggle("active", type === "today");
  yesterdayBtn.classList.toggle("active", type === "yesterday");

  const date = new Date();
  if (type === "yesterday") date.setDate(date.getDate() - 1);
  dateLabel.textContent = date.toLocaleDateString("ja-JP");
  renderVenues();
}

// ========== 画面制御 ==========
function showScreen(name) {
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");
  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}

// ========== 24場一覧表示 ==========
function renderVenues() {
  if (!allData || !allData.venues) return;

  venuesGrid.innerHTML = "";
  const venues = allData.venues;
  Object.keys(venues).forEach((vName) => {
    const races = venues[vName] || [];

    const card = document.createElement("div");
    card.className = "venue-card clickable";

    const nameEl = document.createElement("div");
    nameEl.className = "v-name";
    nameEl.textContent = vName;

    const statusEl = document.createElement("div");
    statusEl.className = "v-status";
    statusEl.textContent = races.length ? `${races.length}R` : "ー";
    statusEl.classList.add(races.length ? "active" : "closed");

    card.appendChild(nameEl);
    card.appendChild(statusEl);
    card.onclick = () => openVenue(vName);
    venuesGrid.appendChild(card);
  });
}

// ========== レース番号画面 ==========
function openVenue(vName) {
  currentVenue = vName;
  const races = allData.venues[vName] || [];

  venueTitle.textContent = vName;
  racesGrid.innerHTML = "";

  const totalRaces = 12;
  for (let i = 1; i <= totalRaces; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;

    if (races.includes(i)) {
      btn.onclick = () => openRace(vName, i);
    } else {
      btn.classList.add("disabled");
    }

    racesGrid.appendChild(btn);
  }

  showScreen("races");
}

// ========== 出走表＋AIデータ ==========
function openRace(vName, raceNo) {
  currentRace = raceNo;
  raceTitle.textContent = `${vName} ${raceNo}R`;

  const raceData = allData.entries?.[vName]?.[raceNo];
  if (!raceData) {
    entryTableBody.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  renderEntries(raceData.entries || []);
  renderAI(raceData.ai || {});
  renderComments(raceData.comments || []);
  renderRanking(raceData.ranking || []);
  renderResult(vName, raceNo);

  showScreen("detail");
}

// ========== 出走表表示 ==========
function renderEntries(entries) {
  entryTableBody.innerHTML = "";
  entries.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.className = `row-${i + 1}`;
    tr.innerHTML = `
      <td>${e.number || i + 1}</td>
      <td class="entry-left">
        <div class="klass">${e.class || "-"}</div>
        <div class="name">${e.name || "-"}</div>
        <div class="st">ST:${e.st || "-"}</div>
      </td>
      <td>${e.f || "-"}</td>
      <td>${e.all || "-"}</td>
      <td>${e.local || "-"}</td>
      <td>${e.mt || "-"}</td>
      <td>${e.course || "-"}</td>
      <td class="eval-mark">${e.eval || "-"}</td>
    `;
    entryTableBody.appendChild(tr);
  });
}

// ========== AI予想（本命／穴） ==========
function renderAI(aiData) {
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";

  const main = aiData.main || [];
  const sub = aiData.sub || [];

  if (main.length === 0) aiMainBody.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  else
    main.forEach((m) => {
      aiMainBody.innerHTML += `<tr><td>${m.buy}</td><td>${m.prob}%</td></tr>`;
    });

  if (sub.length === 0) aiSubBody.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  else
    sub.forEach((s) => {
      aiSubBody.innerHTML += `<tr><td>${s.buy}</td><td>${s.prob}%</td></tr>`;
    });
}

// ========== 展開コメント ==========
function renderComments(comments) {
  commentTableBody.innerHTML = "";
  comments.forEach((c, i) => {
    commentTableBody.innerHTML += `<tr><td>${i + 1}</td><td>${c}</td></tr>`;
  });
}

// ========== AI順位予測 ==========
function renderRanking(ranking) {
  rankingTableBody.innerHTML = "";
  ranking.forEach((r, i) => {
    rankingTableBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.number}</td>
        <td>${r.name}</td>
        <td>${r.score}</td>
      </tr>`;
  });
}

// ========== レース結果（history.json） ==========
function renderResult(vName, raceNo) {
  resultTableBody.innerHTML = "";

  if (!historyData || !historyData[vName]) {
    resultNote.textContent = "※ 結果データなし";
    return;
  }

  const result = historyData[vName]?.[raceNo];
  if (!result) {
    resultNote.textContent = "※ 当該レース結果なし";
    return;
  }

  result.forEach((r, i) => {
    resultTableBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${r.number}</td>
        <td>${r.name}</td>
        <td>${r.st}</td>
      </tr>`;
  });
  resultNote.textContent = "📊 最新レース結果を表示中";
}