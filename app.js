const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

// 日付設定
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
let currentDate = today;

// 日付表示 YYYY/MM/DD
function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  });
}
todayBtn.addEventListener("click", () => { currentDate = today; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); updateDateLabel(); loadData(); });
yesterdayBtn.addEventListener("click", () => { currentDate = yesterday; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); updateDateLabel(); loadData(); });
updateDateLabel();

// 24場カード生成
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津","三国",
  "琵琶湖","住之江","尼崎","鳴門","丸亀",
  "児島","宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];

function renderVenueGrid() {
  venuesGrid.innerHTML = "";
  VENUES.forEach(name => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.dataset.name = name;
    card.innerHTML = `<div class="v-name">${name}</div><div class="v-status">ー</div><div class="v-accuracy">--%</div>`;
    venuesGrid.appendChild(card);
  });
}
renderVenueGrid();

// データ取得
async function loadData() {
  aiStatus.textContent = ""; // 文字なし
  const dataUrl = window.DATA_PATH || "./data/data.json";
  try {
    const res = await fetch(`${dataUrl}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    updateVenueStatus(data);
  } catch (err) {
    console.error("❌ data.json読み込みエラー:", err);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

function updateVenueStatus(data) {
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues?.[name];
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");
    if (venue) {
      statusEl.textContent = venue.length > 0 ? "開催中" : "ー";
      accEl.textContent = "0%"; // 的中率文字なし、％のみ
      statusEl.classList.remove("active","closed","finished");
      if(venue.length>0) statusEl.classList.add("active"); else statusEl.classList.add("closed");
    } else {
      statusEl.textContent = "データなし";
      accEl.textContent = "--%";
    }
  });
}

document.getElementById("refreshBtn").addEventListener("click", loadData);
loadData();
