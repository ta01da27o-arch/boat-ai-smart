// =====================================================
// 🚤 競艇AI予想アプリ v2025.10.30
// =====================================================

// グローバル変数
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.querySelector("#entryTable tbody");
const aiMain = document.querySelector("#aiMain tbody");
const aiSub = document.querySelector("#aiSub tbody");
const commentTable = document.querySelector("#commentTable tbody");
const rankingTable = document.querySelector("#rankingTable tbody");
const resultTable = document.querySelector("#resultTable tbody");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// パス設定（index.html側で上書き可能）
const DATA_PATH = window.DATA_PATH || "data.json";
const HISTORY_PATH = window.HISTORY_PATH || "history.json";

// 現在選択状態
let allData = null;
let historyData = null;
let currentVenue = null;
let currentRace = null;
let selectedDate = "today"; // "today" or "yesterday"

// =====================================================
// 🕒 日付ラベル更新
// =====================================================
function updateDateLabel() {
  const now = new Date();
  const ymd = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  dateLabel.textContent = `${ymd} ${selectedDate === "today" ? "(本日)" : "(前日)"}`;
}

// =====================================================
// 📦 データ読み込み
// =====================================================
async function loadData() {
  aiStatus.textContent = "AI学習中...";
  aiStatus.style.color = "#555";

  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch(DATA_PATH + `?t=${Date.now()}`),
      fetch(HISTORY_PATH + `?t=${Date.now()}`)
    ]);

    if (!dataRes.ok) throw new Error("data.json読み込み失敗");
    if (!historyRes.ok) throw new Error("history.json読み込み失敗");

    allData = await dataRes.json();
    historyData = await historyRes.json();

    aiStatus.textContent = "AI予測完了";
    aiStatus.style.color = "limegreen";

    renderVenues();

  } catch (err) {
    console.error(err);
    aiStatus.textContent = "データ読込エラー";
    aiStatus.style.color = "red";
  }
}

// =====================================================
// 🏟️ 24場リスト表示
// =====================================================
function renderVenues() {
  venuesGrid.innerHTML = "";
  if (!allData || !allData.venues) {
    venuesGrid.innerHTML = "<p>data.jsonを読み込めません。</p>";
    return;
  }

  allData.venues.forEach((venue) => {
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.innerHTML = `
      <div class="v-name">${venue.name}</div>
      <div class="v-status ${venue.statusClass || ''}">
        ${venue.status || "-"}
      </div>
      <div class="v-accuracy">${venue.aiAccuracy ? `精度 ${venue.aiAccuracy}%` : ""}</div>
    `;
    div.addEventListener("click", () => {
      currentVenue = venue;
      renderRaces(venue);
      switchScreen(screenRaces);
    });
    venuesGrid.appendChild(div);
  });
}

// =====================================================
// 🏁 レース番号一覧表示
// =====================================================
function renderRaces(venue) {
  racesGrid.innerHTML = "";
  venueTitle.textContent = venue.name;
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => {
      currentRace = i;
      renderRaceDetail(venue, i);
      switchScreen(screenDetail);
    });
    racesGrid.appendChild(btn);
  }
}

// =====================================================
// 📋 出走表 + AIデータ + 結果
// =====================================================
function renderRaceDetail(venue, raceNo) {
  raceTitle.textContent = `${venue.name} ${raceNo}R`;

  const raceData = allData?.races?.[venue.id]?.[raceNo];
  entryTable.innerHTML = "";
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  commentTable.innerHTML = "";
  rankingTable.innerHTML = "";
  resultTable.innerHTML = "";

  if (!raceData) {
    entryTable.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  // 出走表
  raceData.entries?.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.className = `row-${idx + 1}`;
    tr.innerHTML = `
      <td>${r.boat || idx + 1}</td>
      <td><div class="entry-left">
        <span class="klass">${r.class || "-"}</span>
        <span class="name">${r.name || "-"}</span>
        <span class="st">${r.st || "-"}</span>
      </div></td>
      <td>${r.f || "-"}</td>
      <td>${r.national || "-"}</td>
      <td>${r.local || "-"}</td>
      <td>${r.mt || "-"}</td>
      <td>${r.course || "-"}</td>
      <td class="eval-mark">${r.eval || "-"}</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI本命
  raceData.aiMain?.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
    aiMain.appendChild(tr);
  });

  // AI穴
  raceData.aiSub?.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
    aiSub.appendChild(tr);
  });

  // コメント
  raceData.comments?.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.course}</td><td>${c.text}</td>`;
    commentTable.appendChild(tr);
  });

  // AI順位予測
  raceData.ranking?.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score}</td>`;
    rankingTable.appendChild(tr);
  });

  // レース結果
  const result = historyData?.[venue.id]?.[raceNo];
  if (result) {
    result.forEach((r, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${idx + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.st}</td>`;
      resultTable.appendChild(tr);
    });
  } else {
    resultTable.innerHTML = `<tr><td colspan="4">結果データなし</td></tr>`;
  }
}

// =====================================================
// 🔁 画面遷移
// =====================================================
function switchScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach((el) => el.classList.remove("active"));
  target.classList.add("active");
}

// =====================================================
// ⏮️ 戻る
// =====================================================
backToVenues.addEventListener("click", () => switchScreen(screenVenues));
backToRaces.addEventListener("click", () => switchScreen(screenRaces));

// =====================================================
// 🔄 更新ボタン
// =====================================================
refreshBtn.addEventListener("click", () => {
  aiStatus.textContent = "再読込中...";
  loadData();
});

// =====================================================
// 📅 日付切替
// =====================================================
todayBtn.addEventListener("click", () => {
  selectedDate = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel();
  loadData();
});

yesterdayBtn.addEventListener("click", () => {
  selectedDate = "yesterday";
  todayBtn.classList.remove("active");
  yesterdayBtn.classList.add("active");
  updateDateLabel();
  loadData();
});

// =====================================================
// 🚀 初期化
// =====================================================
updateDateLabel();
loadData();