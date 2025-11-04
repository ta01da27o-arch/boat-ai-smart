/**
 * app.js — index.htmlと連携してdata.json / history.jsonをロードし表示
 */

console.log("📦 app.js loaded");

const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

let allVenues = [];
let currentVenue = null;
let currentDay = "today";

async function loadJSON(path) {
  try {
    const res = await fetch(path + "?t=" + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("❌ JSON load error:", path, e);
    return [];
  }
}

// 初期化
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("todayBtn").addEventListener("click", () => switchDay("today"));
  document.getElementById("yesterdayBtn").addEventListener("click", () => switchDay("yesterday"));
  document.getElementById("refreshBtn").addEventListener("click", init);

  await init();
});

async function init() {
  document.getElementById("aiStatus").textContent = "データ更新中...";
  allVenues = await loadJSON(DATA_PATH);
  renderVenues();
  document.getElementById("aiStatus").textContent = "AI学習中...";
}

// 日付切替
function switchDay(day) {
  currentDay = day;
  document.getElementById("todayBtn").classList.toggle("active", day === "today");
  document.getElementById("yesterdayBtn").classList.toggle("active", day === "yesterday");
  init();
}

// 競艇場一覧を表示
function renderVenues() {
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";
  allVenues.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "venue-btn";
    btn.textContent = v.stadium;
    btn.onclick = () => showRaces(v);
    grid.appendChild(btn);
  });
}

// レース一覧
function showRaces(venue) {
  currentVenue = venue;
  document.getElementById("venueTitle").textContent = venue.stadium;
  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";
  venue.races.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r.race_no}R`;
    btn.onclick = () => showDetail(r);
    grid.appendChild(btn);
  });
  switchScreen("races");
}

// 出走表詳細
function showDetail(race) {
  document.getElementById("raceTitle").textContent = `${currentVenue.stadium} ${race.race_no}R`;

  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";
  race.entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.no}</td>
      <td>${e.class || ""} / ${e.name || ""} / ${e.st || ""}</td>
      <td>${e.rank || ""}</td>
      <td>${e.motor || ""}</td>
      <td>${e.course || ""}</td>
      <td>${e.evaluation || ""}</td>
      <td>-</td><td>-</td>
    `;
    tbody.appendChild(tr);
  });

  switchScreen("detail");
}

// 画面切替
function switchScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
}