// ====================================================
// 🚤 競艇AI予想アプリ（GitHub Pages対応・24場固定＋日付切替対応）
// ====================================================

const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const btnToday = document.getElementById("btnToday");
const btnPrev = document.getElementById("btnPrev");
const refreshBtn = document.getElementById("refreshBtn");

let currentDate = new Date();

// ====================================================
// 📅 日付処理
// ====================================================
function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

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
// 🧱 24場固定雛型生成（常時表示）
// ====================================================
function renderVenueGrid() {
  if (!venuesGrid) return;
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
// 📦 JSONデータ取得処理
// ====================================================
async function loadData() {
  aiStatus.textContent = "AI学習中...";

  try {
    const path = "./data/data.json"; // ✅ GitHub Pages用相対パス
    const res = await fetch(`${path}?nocache=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);

    const data = await res.json();
    updateVenueStatus(data);
    aiStatus.textContent = "データ取得完了 ✅";

  } catch (e) {
    aiStatus.textContent = "データ取得失敗 ❌";
    console.error("data.json 読み込みエラー:", e);
    alert("⚠️ data.jsonの読み込みに失敗しました。");
  }
}

// ====================================================
// 🧩 反映処理（開催中・精度など）
// ====================================================
function updateVenueStatus(data) {
  if (!data || !data.venues) return;

  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues.find(v => v.name === name);
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");

    if (venue) {
      statusEl.textContent = venue.status === "open" ? "開催中" : "ー";
      accEl.textContent = venue.accuracy ? `精度 ${venue.accuracy}%` : "";
      statusEl.classList.toggle("active", venue.status === "open");
    } else {
      statusEl.textContent = "ー";
      accEl.textContent = "";
      statusEl.classList.remove("active");
    }
  });
}

// ====================================================
// ⏰ 日付切替ボタン処理
// ====================================================
btnToday.addEventListener("click", () => {
  currentDate = new Date();
  updateDateLabel();
  loadData();
});

btnPrev.addEventListener("click", () => {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateLabel();
  loadData();
});

// ====================================================
// 🔄 更新ボタン
// ====================================================
refreshBtn.addEventListener("click", loadData);

// ====================================================
// 🚀 初期化処理（必ず最初に雛型を生成）
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  renderVenueGrid();  // ✅ ここで確実に表示
  updateDateLabel();
  loadData();
});
