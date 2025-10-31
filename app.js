// ====================================================
// 🚤 競艇AI予想アプリ（出走表＋AI予想＋最新結果対応）
// ====================================================

// 要素取得
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// 出走表・AI・順位・結果テーブル
const entryTable = document.querySelector("#entryTable tbody");
const aiMainTable = document.querySelector("#aiMain tbody");
const aiSubTable = document.querySelector("#aiSub tbody");
const rankingTable = document.querySelector("#rankingTable tbody");
const resultTable = document.querySelector("#resultTable tbody");

// ====================================================
// 📅 日付設定
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
let currentDate = today;

// 日付表示 YYYY/MM/DD
function updateDateLabel() {
  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
  const dd = String(currentDate.getDate()).padStart(2, "0");
  dateLabel.textContent = `${yyyy}/${mm}/${dd}`;
}
todayBtn.addEventListener("click", () => { currentDate=today; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); updateDateLabel(); loadData(); });
yesterdayBtn.addEventListener("click", () => { currentDate=yesterday; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); updateDateLabel(); loadData(); });
updateDateLabel();

// ====================================================
// 🌏 全国24場
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津","三国",
  "琵琶湖","住之江","尼崎","鳴門","丸亀",
  "児島","宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];

// ====================================================
// 🧱 24場カード生成
function renderVenueGrid() {
  venuesGrid.innerHTML = "";
  VENUES.forEach(name=>{
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.dataset.name = name;
    card.innerHTML = `<div class="v-name">${name}</div><div class="v-status">ー</div><div class="v-accuracy">--%</div>`;
    card.addEventListener("click", () => openRaces(name));
    venuesGrid.appendChild(card);
  });
}
renderVenueGrid();

// ====================================================
// 📦 JSONデータ取得
let venueData = {};
let historyData = {};
async function loadData(){
  aiStatus.textContent = ""; // 更新文字なし
  try {
    // data.json
    const dataRes = await fetch(`${window.DATA_PATH}?t=${Date.now()}`);
    if(!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
    const data = await dataRes.json();
    venueData = data.venues || {};

    // history.json
    const historyRes = await fetch(`${window.HISTORY_PATH}?t=${Date.now()}`);
    if(!historyRes.ok) throw new Error(`HTTP ${historyRes.status}`);
    historyData = await historyRes.json();

    updateVenueStatus();
  } catch(err){
    console.error("❌ データ取得エラー:", err);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// ====================================================
// 🧩 24場状態反映
function updateVenueStatus(){
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card=>{
    const name = card.dataset.name;
    const venue = venueData[name];
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");
    if(venue){
      statusEl.textContent = venue.length>0 ? "開催中" : "ー";
      accEl.textContent = "0%"; // 的中率は%のみ
      statusEl.classList.remove("active","closed","finished");
      venue.length>0 ? statusEl.classList.add("active") : statusEl.classList.add("closed");
    } else {
      statusEl.textContent="データなし";
      accEl.textContent="--%";
    }
  });
}

// ====================================================
// 🔁 レース番号画面表示
function openRaces(venue){
  venueTitle.textContent = venue;
  racesGrid.innerHTML = "";
  const races = venueData[venue] || [];
  for(let i=0;i<races.length;i++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = races[i].raceTitle || `${i+1}R`;
    btn.addEventListener("click",()=>openDetail(venue,i));
    racesGrid.appendChild(btn);
  }
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
}

// 戻る
backToVenues.addEventListener("click",()=>{
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});

// ====================================================
// 🔁 出走表画面表示
function openDetail(venue,raceIndex){
  const race = venueData[venue][raceIndex] || {};
  raceTitle.textContent = `${venue} ${race.raceTitle || `${raceIndex+1}R`}`;

  // 出走表
  entryTable.innerHTML = "";
  (race.entries||[]).forEach(entry=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.lane||""}</td>
      <td>${entry.name||""}</td>
      <td>${entry.st||""}</td>
      <td>--</td><td>--</td><td>--</td><td>--</td><td>--</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI予想（本命・穴）
  aiMainTable.innerHTML = "";
  (race.aiMain||[]).forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.bet||""}</td><td>${item.prob||""}%</td>`;
    aiMainTable.appendChild(tr);
  });
  aiSubTable.innerHTML = "";
  (race.aiSub||[]).forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.bet||""}</td><td>${item.prob||""}%</td>`;
    aiSubTable.appendChild(tr);
  });

  // 最新レース結果（history.json）
  resultTable.innerHTML = "";
  const recent = historyData.recent || [];
  recent.forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.rank}</td><td>${item.lane}</td><td>${item.name}</td><td>${item.st}</td>`;
    resultTable.appendChild(tr);
  });

  // 表示切替
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");
}

// 戻る
backToRaces.addEventListener("click",()=>{
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

// ====================================================
// 🔁 更新ボタン
document.getElementById("refreshBtn").addEventListener("click", loadData);

// ====================================================
// 🚀 初期化
loadData();