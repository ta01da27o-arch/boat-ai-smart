// app.js
console.log("📦 app.js loaded");

const DATA_PATH = window.DATA_PATH || "../data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "../data/history.json";

const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const venuesGrid = document.getElementById("venuesGrid");
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const venueTitle = document.getElementById("venueTitle");
const racesGrid = document.getElementById("racesGrid");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody = document.querySelector("#resultTable tbody");
const resultNote = document.getElementById("resultNote");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

let allData = null;
let currentVenue = null;
let currentDate = new Date();

function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });
}

todayBtn.addEventListener("click", () => {
  currentDate = new Date();
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  updateDateLabel();
  loadData();
});
yesterdayBtn.addEventListener("click", () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  currentDate = d;
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  updateDateLabel();
  loadData();
});

backToVenues.addEventListener("click", () => showScreen("venues"));
backToRaces.addEventListener("click", () => showScreen("races"));
refreshBtn.addEventListener("click", () => loadData(true));

updateDateLabel();

async function loadData(force = false) {
  aiStatus.textContent = "データ取得中…";

  try {
    const url = DATA_PATH + (force ? `?t=${Date.now()}` : "");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    allData = json.venues;
    aiStatus.textContent = "データ取得完了 ✅";

    renderVenueGrid();
    showScreen("venues");
  } catch (err) {
    console.error("❌ loadData error:", err);
    aiStatus.textContent = "データ取得失敗 ❌";
    venuesGrid.innerHTML = "";
  }
}

function renderVenueGrid() {
  venuesGrid.innerHTML = "";
  for (const vName in allData) {
    const venue = allData[vName];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.dataset.name = vName;

    const nameEl = document.createElement("div");
    nameEl.className = "v-name";
    nameEl.textContent = vName;

    const statusEl = document.createElement("div");
    statusEl.className = "v-status";

    if (Array.isArray(venue) && venue.length > 0) {
      statusEl.textContent = `${venue.length}R`;
      statusEl.classList.add("active");
      card.onclick = () => openVenue(vName);
    } else {
      statusEl.textContent = "ー";
      statusEl.classList.add("closed");
      card.classList.add("disabled");
    }

    card.append(nameEl, statusEl);
    venuesGrid.appendChild(card);
  }
}

function openVenue(vName) {
  currentVenue = vName;
  venueTitle.textContent = vName;

  // レース配列
  const races = allData[vName] || [];
  racesGrid.innerHTML = "";

  races.forEach((rObj, idx) => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${rObj.race || rObj.race_no}R`;
    btn.onclick = () => openRace(rObj);
    racesGrid.appendChild(btn);
  });

  showScreen("races");
}

function openRace(rObj) {
  raceTitle.textContent = `${currentVenue} ${rObj.race || rObj.race_no}R`;

  // 出走表表示（簡易）
  entryTableBody.innerHTML = "";
  (rObj.entries || []).forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.no || ""}</td>
      <td>${((e.class || "") + " / " + (e.name || "") + " / " + (e.st || ""))}</td>
      <td>${e.F || ""}</td>
      <td>${e.全国 || e.national || ""}</td>
      <td>${e.当地 || e.local || ""}</td>
      <td>${e.MT || e.mt || ""}</td>
      <td>${e.course || ""}</td>
      <td>${e.eval || e.evaluation || ""}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI・コメント・順位はこのAPIに含まれてない可能性があるため空白対応
  aiMainBody.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  aiSubBody.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  commentTableBody.innerHTML = `<tr><td colspan="2">コメントなし</td></tr>`;
  rankingTableBody.innerHTML = `<tr><td colspan="4">予測なし</td></tr>`;

  // 結果表示（history.json 読込）
  resultTableBody.innerHTML = `<tr><td colspan="4">結果データなし</td></tr>`;
  resultNote.textContent = "※ 出走表取得のみ対応";

  showScreen("detail");
}

function showScreen(screen) {
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");
  document.getElementById(`screen-${screen}`).classList.add("active");
}

loadData();