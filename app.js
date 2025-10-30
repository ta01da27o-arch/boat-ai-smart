// ====================================================
// 🚤 競艇AI予想アプリ（2025/10/31修正版）
// ====================================================

// ---- 要素取得 ----
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");

// ---- 日付表示（YYYY/MM/DD）----
const today = new Date();
const formatted = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;
dateLabel.textContent = formatted;

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
// 📦 JSONデータ取得処理
// ====================================================
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    // JSONパス自動判定
    const pathOptions = [
      "./data/data.json",
      "../data/data.json",
      "/data/data.json"
    ];

    let data = null;
    for (const path of pathOptions) {
      try {
        const res = await fetch(`${path}?nocache=${Date.now()}`);
        if (res.ok) {
          data = await res.json();
          break;
        }
      } catch (_) { /* 試行を続ける */ }
    }

    if (!data) throw new Error("data.json が読み込めませんでした");

    updateVenueStatus(data);
    aiStatus.textContent = "データ取得完了 ✅";

  } catch (e) {
    console.error(e);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// ====================================================
// 🧩 データ反映処理
// ====================================================
function updateVenueStatus(data) {
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues?.find(v => v.name === name);
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");

    if (venue) {
      statusEl.textContent = venue.status_label || "-";
      accEl.textContent = venue.accuracy ? `精度 ${venue.accuracy}%` : "";
      statusEl.classList.remove("active", "closed", "finished");
      if (venue.status === "open") statusEl.classList.add("active");
      else if (venue.status === "closed") statusEl.classList.add("closed");
      else if (venue.status === "finished") statusEl.classList.add("finished");
    } else {
      statusEl.textContent = "ー";
      accEl.textContent = "";
      statusEl.classList.remove("active", "closed", "finished");
    }
  });
}

// ====================================================
// 🔄 イベント設定
// ====================================================
document.getElementById("refreshBtn").addEventListener("click", loadData);

// ====================================================
// 🚀 初期化
// ====================================================
renderVenueGrid();
loadData();
