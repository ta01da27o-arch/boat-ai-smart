// ====================================================
// 🚤 競艇AI予想アプリ（日付切替 + 結果自動更新対応）
// ====================================================

// DOM要素取得
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenEntries = document.getElementById("screen-entries");
const racesList = document.getElementById("racesList");
const entriesList = document.getElementById("entriesList");
const backBtn1 = document.getElementById("backVenues");
const backBtn2 = document.getElementById("backRaces");

let selectedVenue = null;
let selectedDate = new Date();

// ====================================================
// 🌏 全国24場リスト（固定）
// ====================================================
const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川",
  "浜名湖", "蒲郡", "常滑", "津", "三国",
  "琵琶湖", "住之江", "尼崎", "鳴門", "丸亀",
  "児島", "宮島", "徳山", "下関", "若松",
  "芦屋", "福岡", "唐津", "大村"
];

// ====================================================
// 🧱 24場固定雛型生成
// ====================================================
function renderVenueGrid() {
  venuesGrid.innerHTML = "";
  VENUES.forEach(name => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.dataset.name = name;
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-accuracy"></div>
    `;
    venuesGrid.appendChild(card);
  });
}

// ====================================================
// 📅 日付処理
// ====================================================
function formatDate(date) {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function getDateFileName(date) {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const d = ("0" + date.getDate()).slice(-2);
  return `${y}${m}${d}`;
}

function updateDateLabel() {
  dateLabel.textContent = formatDate(selectedDate);
}

document.getElementById("prevBtn").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1);
  updateDateLabel();
  loadData();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  selectedDate = new Date();
  updateDateLabel();
  loadData();
});

// ====================================================
// 📦 JSONデータ取得処理（日付別）
// ====================================================
async function loadData() {
  aiStatus.textContent = "AI学習中...";
  try {
    const fileName = `data_${getDateFileName(selectedDate)}.json`;
    const path = window.DATA_PATH || `./data/${fileName}`;
    const res = await fetch(`${path}?nocache=${Date.now()}`);
    if (!res.ok) throw new Error("HTTPエラー");
    const data = await res.json();
    updateVenueStatus(data);
    aiStatus.textContent = "データ取得完了 ✅";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// ====================================================
// 🧩 反映処理（開催中・的中率など）
// ====================================================
function updateVenueStatus(data) {
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues.find(v => v.name === name);
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");

    if (venue) {
      statusEl.textContent = venue.status_label || "ー";
      accEl.textContent = venue.accuracy ? `当地的中率 ${venue.accuracy}%` : "";
      card.classList.remove("active");
      if (venue.status === "open") {
        statusEl.classList.add("active");
        card.addEventListener("click", () => openRaceScreen(venue));
      }
    } else {
      statusEl.textContent = "ー";
      accEl.textContent = "";
    }
  });
}

// ====================================================
// 🏁 開催中 → レース番号画面へ遷移
// ====================================================
function openRaceScreen(venue) {
  selectedVenue = venue;
  screenVenues.style.display = "none";
  screenRaces.style.display = "block";
  racesList.innerHTML = "";

  for (const raceNo in venue.races) {
    const raceBtn = document.createElement("div");
    raceBtn.className = "race-item";
    raceBtn.textContent = `${raceNo}R`;
    raceBtn.addEventListener("click", () => openEntriesScreen(venue.races[raceNo], raceNo));
    racesList.appendChild(raceBtn);
  }
}

// ====================================================
// 🧾 出走表画面へ遷移
// ====================================================
function openEntriesScreen(raceData, raceNo) {
  screenRaces.style.display = "none";
  screenEntries.style.display = "block";
  entriesList.innerHTML = `
    <h3>${selectedVenue.name} ${raceNo}R 出走表</h3>
  `;

  raceData.entries.forEach(e => {
    const row = document.createElement("div");
    row.className = "entry-row";
    row.innerHTML = `
      <div class="no">${e.no}</div>
      <div class="name">${e.name}</div>
      <div class="st">${e.st}</div>
      <div class="eval">${e.eval}</div>
    `;
    entriesList.appendChild(row);
  });
}

// ====================================================
// 🔙 戻る機能
// ====================================================
backBtn1.addEventListener("click", () => {
  screenRaces.style.display = "none";
  screenVenues.style.display = "block";
});

backBtn2.addEventListener("click", () => {
  screenEntries.style.display = "none";
  screenRaces.style.display = "block";
});

// ====================================================
// 🚀 初期化
// ====================================================
renderVenueGrid();
updateDateLabel();
loadData();