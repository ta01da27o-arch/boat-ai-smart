// ====================================================
// 🚤 競艇AI予想アプリ（fetch動作安定版）
// ====================================================

// 要素取得
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

// ====================================================
// 📅 日付設定
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
let currentDate = today;

function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}
todayBtn.addEventListener("click", () => {
  currentDate = today;
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel();
  loadData();
});
yesterdayBtn.addEventListener("click", () => {
  currentDate = yesterday;
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  updateDateLabel();
  loadData();
});
updateDateLabel();

// ====================================================
// 🌏 全国24場リスト
const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川",
  "浜名湖", "蒲郡", "常滑", "津", "三国",
  "琵琶湖", "住之江", "尼崎", "鳴門", "丸亀",
  "児島", "宮島", "徳山", "下関", "若松",
  "芦屋", "福岡", "唐津", "大村"
];

// ====================================================
// 🧱 24場カード生成
function renderVenueGrid() {
  venuesGrid.innerHTML = "";
  VENUES.forEach(name => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.dataset.name = name;
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-accuracy">的中率 --%</div>
    `;
    venuesGrid.appendChild(card);
  });
}
renderVenueGrid();

// ====================================================
// 📦 JSONデータ取得（fetch安定化）
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  const dataUrl = "./data/data.json";

  try {
    const res = await fetch(`${dataUrl}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // JSON構造補正
    const data = json.venues ? json : { venues: json };

    updateVenueStatus(data);
    aiStatus.textContent = "データ取得完了 ✅";
  } catch (err) {
    console.error("❌ data.json読み込みエラー:", err);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// ====================================================
// 🧩 24場の状態反映
function updateVenueStatus(data) {
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues?.find(v => v.name === name);
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");

    if (venue) {
      statusEl.textContent = venue.status_label || "ー";
      accEl.textContent = venue.hit_rate ? `的中率 ${venue.hit_rate}%` : "的中率 --%";
      statusEl.classList.remove("active", "closed", "finished");
      if (venue.status === "open") statusEl.classList.add("active");
      else if (venue.status === "closed") statusEl.classList.add("closed");
      else if (venue.status === "finished") statusEl.classList.add("finished");
    } else {
      statusEl.textContent = "データなし";
      accEl.textContent = "的中率 --%";
    }
  });
}

// ====================================================
// 🔁 イベント
refreshBtn.addEventListener("click", loadData);

// ====================================================
// 🚀 初期化
loadData();