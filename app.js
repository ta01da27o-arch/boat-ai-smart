// boat/app.js
// 競艇AI予想（スマホ完結版・GitHub Pages対応）

const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");

const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

// ✅ GitHub Pages対応：dataフォルダへの相対パス
const DATA_PATH = "../data/data.json";
const HISTORY_PATH = "../data/history.json";

let allData = null;
let currentVenue = null;
let currentDateType = "today"; // "today" or "yesterday"

// 日付ラベル更新
function setDateLabel() {
  const d = new Date();
  if (currentDateType === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

// 画面切り替え
function switchScreen(screen) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// ✅ データ読み込み
async function loadData() {
  aiStatus.textContent = "データ読込中...";
  try {
    const response = await fetch(DATA_PATH + "?t=" + Date.now());
    if (!response.ok) throw new Error("HTTPエラー " + response.status);
    allData = await response.json();
    renderVenues();
    aiStatus.textContent = "AIデータ取得完了 ✅";
  } catch (e) {
    aiStatus.textContent = "データ取得失敗 ❌";
    console.error(e);
    const msg = document.createElement("div");
    msg.style.color = "red";
    msg.style.margin = "10px";
    msg.textContent = "⚠️ data.jsonの読み込みに失敗しました";
    document.body.appendChild(msg);
  }
}

// 開催場一覧
function renderVenues() {
  if (!allData || !allData.venues) {
    aiStatus.textContent = "データなし ❌";
    return;
  }

  venuesGrid.innerHTML = "";
  allData.venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status ${v.status}">${v.status_label || "ー"}</div>
      <div class="v-accuracy">${v.accuracy ? v.accuracy + "%" : "AI未解析"}</div>
    `;
    card.addEventListener("click", () => showRaces(v));
    venuesGrid.appendChild(card);
  });

  // 表示確認メッセージ
  const msg = document.createElement("div");
  msg.textContent = `✅ ${allData.venues.length}場データを読み込みました`;
  msg.style.fontSize = "14px";
  msg.style.margin = "5px";
  msg.style.color = "green";
  document.body.appendChild(msg);
}

// レース一覧
function showRaces(venue) {
  currentVenue = venue;
  venueTitle.textContent = venue.name;
  racesGrid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => showDetail(i));
    racesGrid.appendChild(btn);
  }

  switchScreen(screenRaces);
}

// 詳細
function showDetail(raceNo) {
  raceTitle.textContent = `${currentVenue.name} ${raceNo}R`;
  const raceData = currentVenue.races?.[raceNo] || {};

  renderTable(entryTable, raceData.entries);
  renderPrediction(aiMain, raceData.prediction?.main);
  renderPrediction(aiSub, raceData.prediction?.sub);
  renderComments(raceData.comments);
  renderRanking(raceData.ranking);
  renderResult(raceData.results);

  switchScreen(screenDetail);
}

// 表関係
function renderTable(tbody, data) {
  tbody.innerHTML = "";
  if (!data) return;
  data.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.className = `row-${idx + 1}`;
    tr.innerHTML = `
      <td>${r.no}</td>
      <td><div class="entry-left"><span class="klass">${r.class}</span>
      <span class="name">${r.name}</span>
      <span class="st">${r.st}</span></div></td>
      <td>${r.f}</td>
      <td>${r.z}</td>
      <td>${r.t}</td>
      <td>${r.mt}</td>
      <td>${r.course}</td>
      <td class="metric-symbol ${r.eval === '◎' ? 'top' : ''}">${r.eval}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPrediction(tbody, data) {
  tbody.innerHTML = "";
  if (!data) return;
  data.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.buy}</td><td>${p.rate}%</td>`;
    tbody.appendChild(tr);
  });
}

function renderComments(data) {
  commentTable.innerHTML = "";
  if (!data) return;
  data.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTable.appendChild(tr);
  });
}

function renderRanking(data) {
  rankingTable.innerHTML = "";
  if (!data) return;
  data.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${r.no}</td><td>${r.name}</td><td>${r.score}</td>`;
    rankingTable.appendChild(tr);
  });
}

function renderResult(data) {
  resultTable.innerHTML = "";
  if (!data) return;
  data.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.rank}</td><td>${r.no}</td><td>${r.name}</td><td>${r.st}</td>`;
    resultTable.appendChild(tr);
  });
}

// 戻るボタン制御
document.getElementById("backToVenues").addEventListener("click", () => switchScreen(screenVenues));
document.getElementById("backToRaces").addEventListener("click", () => switchScreen(screenRaces));

// タブ切り替え
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  currentDateType = "today";
  setDateLabel();
});
yesterdayBtn.addEventListener("click", () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  currentDateType = "yesterday";
  setDateLabel();
});

// 更新
refreshBtn.addEventListener("click", loadData);

// 初期化
setDateLabel();
loadData();