// ===============================
// 競艇AI予想アプリ メインスクリプト
// ===============================

// データパス設定（index.htmlのwindow設定を優先）
const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

// DOM取得
const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const refreshBtn = document.getElementById("refreshBtn");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

// 画面切替
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

// レース・出走データDOM
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

// 日付管理
let viewMode = "today"; // "today" or "yesterday"
let allData = null;
let historyData = null;
let currentVenue = null;
let currentRace = null;

// ===============================
// 初期化
// ===============================
init();
function init() {
  setToday();
  attachEvents();
  fetchAllData();
}

// ===============================
// イベント設定
// ===============================
function attachEvents() {
  todayBtn.addEventListener("click", () => {
    viewMode = "today";
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    setToday();
    renderVenues();
  });

  yesterdayBtn.addEventListener("click", () => {
    viewMode = "yesterday";
    todayBtn.classList.remove("active");
    yesterdayBtn.classList.add("active");
    setYesterday();
    renderVenues();
  });

  refreshBtn.addEventListener("click", () => {
    aiStatus.textContent = "更新中...";
    fetchAllData();
  });

  document.getElementById("backToVenues").addEventListener("click", () => {
    showScreen("venues");
  });
  document.getElementById("backToRaces").addEventListener("click", () => {
    showScreen("races");
  });
}

// ===============================
// 日付切替
// ===============================
function setToday() {
  const d = new Date();
  dateLabel.textContent = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
function setYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  dateLabel.textContent = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

// ===============================
// データ取得
// ===============================
async function fetchAllData() {
  try {
    const [dataRes, histRes] = await Promise.all([
      fetch(DATA_PATH + "?t=" + Date.now()),
      fetch(HISTORY_PATH + "?t=" + Date.now())
    ]);
    if (!dataRes.ok) throw new Error("data.json取得失敗");
    if (!histRes.ok) throw new Error("history.json取得失敗");

    allData = await dataRes.json();
    historyData = await histRes.json();

    aiStatus.textContent = "AI最新データ取得済";
    renderVenues();
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "データ取得エラー";
  }
}

// ===============================
// 画面描画：24場一覧
// ===============================
function renderVenues() {
  if (!allData || !allData.venues) return;
  venuesGrid.innerHTML = "";

  allData.venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status ${v.status || "closed"}">${v.statusText || "ー"}</div>
      <div class="v-accuracy">${v.hit_rate ? v.hit_rate + "%" : "--%"}</div>
    `;
    card.addEventListener("click", () => openVenue(v));
    venuesGrid.appendChild(card);
  });
}

// ===============================
// レース番号画面
// ===============================
function openVenue(venue) {
  currentVenue = venue;
  venueTitle.textContent = venue.name;
  racesGrid.innerHTML = "";

  const raceCount = 12;
  for (let i = 1; i <= raceCount; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(i));
    racesGrid.appendChild(btn);
  }

  showScreen("races");
}

// ===============================
// 出走表画面
// ===============================
function openRace(raceNo) {
  currentRace = raceNo;
  raceTitle.textContent = `${currentVenue.name} ${raceNo}R`;

  const raceData = allData?.races?.[currentVenue.name]?.[raceNo];
  const hist = historyData?.[currentVenue.name]?.[raceNo];

  entryTable.innerHTML = "";
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  commentTable.innerHTML = "";
  rankingTable.innerHTML = "";
  resultTable.innerHTML = "";

  // 出走表
  if (raceData?.entries) {
    raceData.entries.forEach((e, i) => {
      const tr = document.createElement("tr");
      tr.className = `row-${i + 1}`;
      tr.innerHTML = `
        <td>${e.lane}</td>
        <td>
          <div class="entry-left">
            <div class="klass">${e.class || "-"}</div>
            <div class="name">${e.name || "-"}</div>
            <div class="st">ST:${e.st || "-"}</div>
          </div>
        </td>
        <td>${e.f || "-"}</td>
        <td>${e.national || "-"}</td>
        <td>${e.local || "-"}</td>
        <td>${e.mt || "-"}</td>
        <td>${e.course || "-"}</td>
        <td>${e.eval || "-"}</td>
      `;
      entryTable.appendChild(tr);
    });
  }

  // AI本命・穴
  if (raceData?.ai_main) {
    raceData.ai_main.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.bet}</td><td>${p.prob}%</td>`;
      aiMain.appendChild(tr);
    });
  }
  if (raceData?.ai_sub) {
    raceData.ai_sub.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.bet}</td><td>${p.prob}%</td>`;
      aiSub.appendChild(tr);
    });
  }

  // コメント
  if (raceData?.comments) {
    raceData.comments.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
      commentTable.appendChild(tr);
    });
  }

  // 順位予測
  if (raceData?.ranking) {
    raceData.ranking.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td>`;
      rankingTable.appendChild(tr);
    });
  }

  // 結果
  if (hist?.result) {
    hist.result.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.st}</td>`;
      resultTable.appendChild(tr);
    });
  }

  showScreen("detail");
}

// ===============================
// 画面遷移制御
// ===============================
function showScreen(name) {
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");

  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}