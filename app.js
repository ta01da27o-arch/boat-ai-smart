// app.js — 外部API版対応（2025/11/06 修正版）
// 以前の反映OK版をベースに、Boatrace OpenAPI構造に対応。
// AI部分は ai_engine.js に依存します。
import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data/data.json";
const HISTORY_URL = "./data/history.json";
const PREDICTIONS_URL = "./data/predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM */
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");
const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

/* state */
let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

/* utils */
function getIsoDate(d) { return d.toISOString().slice(0, 10); }
function formatToDisplay(dstr) {
  try { return new Date(dstr).toLocaleDateString("ja-JP", {year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"}); }
  catch { return dstr; }
}
function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
}
function safeNum(v) { return (v == null || v === "" || isNaN(Number(v))) ? null : Number(v); }
function logStatus(msg) { console.log("[APP]", msg); if (aiStatus) aiStatus.textContent = msg; }

/* 階級フォーマット */
function formatKlass(b) {
  if (b.racer_class) return String(b.racer_class);
  if (b.class) return String(b.class);
  if (b.grade) return String(b.grade);
  return "-";
}

/* 勝率フォーマット */
function formatRateRaw(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);
  if (n <= 10) return Math.round(n * 10);
  if (n <= 100) return Math.round(n);
  return Math.round(n);
}
function formatRateDisplay(v) {
  const pct = formatRateRaw(v);
  return pct == null ? "-" : `${pct}%`;
}

/* データ読み込み */
async function loadData(force = false) {
  try {
    logStatus("データ取得中...");
    const q = force ? `?t=${Date.now()}` : "";

    const fetchJsonSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) { logStatus(`fetch error: ${url} -> ${res.status}`); return null; }
        return await res.json();
      } catch (e) { logStatus(`network error: ${url} -> ${e.message}`); return null; }
    };

    const fetchTextSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) { logStatus(`fetch error: ${url} -> ${res.status}`); return null; }
        return await res.text();
      } catch (e) { logStatus(`network error: ${url} -> ${e.message}`); return null; }
    };

    const pData = await fetchJsonSafe(DATA_URL);
    const hData = await fetchJsonSafe(HISTORY_URL);
    const csvText = await fetchTextSafe(PREDICTIONS_URL);

    // BoatraceOpenAPI形式: { "桐生": [{...},...], "戸田": [...] }
    if (pData && typeof pData === "object" && !Array.isArray(pData)) {
      const merged = [];
      Object.entries(pData.venues || pData).forEach(([venueName, races]) => {
        if (Array.isArray(races)) {
          races.forEach(r => merged.push({
            venue_name: venueName,
            race_no: r.race || r.race_no,
            race_title: r.title || r.race_name,
            boats: r.entries || r.boats || r.participants || []
          }));
        }
      });
      ALL_PROGRAMS = merged;
    } else {
      ALL_PROGRAMS = [];
    }

    HISTORY = hData || {};
    PREDICTIONS = [];
    if (csvText && csvText.trim()) {
      try { PREDICTIONS = parseCSV(csvText); }
      catch (e) { logStatus("predictions.csv parse error: " + e.message); }
    }

    dateLabel.textContent = formatToDisplay(new Date());
    await learnFromResults(HISTORY);
    renderVenues();
    logStatus("準備完了");
  } catch (e) {
    console.error(e);
    logStatus("データ処理失敗");
  }
}

/* CSVパース */
function parseCSV(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
}

/* 会場一覧 */
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const available = new Set(ALL_PROGRAMS.map(p => p.venue_name));
  VENUE_NAMES.forEach((name, idx) => {
    const id = idx + 1;
    const has = available.has(name);
    const hitText = calcHitRateText(id);
    const card = document.createElement("div");
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "ー"}</div>
      <div class="v-rate">${hitText}</div>`;
    if (has) card.onclick = () => renderRaces(name, id);
    venuesGrid.appendChild(card);
  });
}

/* レース番号一覧 */
function renderRaces(venueName, venueId) {
  showScreen("races");
  venueTitle.textContent = venueName;
  racesGrid.innerHTML = "";

  const progs = ALL_PROGRAMS.filter(p => p.venue_name === venueName);
  const exists = new Set(progs.map(p => +p.race_no || 0));

  for (let no = 1; no <= 12; no++) {
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className = "race-btn";
    if (exists.has(no)) btn.onclick = () => renderRaceDetail(venueName, venueId, no);
    else { btn.disabled = true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* 出走表＋AI表示 */
async function renderRaceDetail(venueName, venueId, raceNo) {
  showScreen("race");
  const prog = ALL_PROGRAMS.find(p => p.venue_name === venueName && (+p.race_no === raceNo));

  if (!prog) {
    entryTableBody.innerHTML = `<tr><td colspan="8">出走データが見つかりません</td></tr>`;
    return;
  }

  raceTitle.textContent = `${venueName} ${raceNo}R ${prog.race_title || ""}`;
  const boats = prog.boats || [];
  entryTableBody.innerHTML = "";

  const players = boats.map(b => {
    const st = safeNum(b.st || b.start_timing);
    const national = formatRateRaw(b.national_rate || b.national || b.win_rate);
    const local = formatRateRaw(b.local_rate || b.local);
    const motor = formatRateRaw(b.motor_rate || b.motor);
    const course = formatRateRaw(b.boat_rate || b.course);
    const fCount = b.f || b.F || 0;

    const stForScore = st || 0.3;
    const rawScore = (1 / stForScore) * ((motor || 30) / 100) * ((local || 30) / 100) * ((course || 30) / 100);

    return {
      lane: +b.lane || +b.boat_no || 0,
      name: b.name || b.racer_name || "-",
      klass: formatKlass(b),
      st, fCount, national, local, motor, course, rawScore
    };
  }).sort((a, b) => a.lane - b.lane);

  const ranked = [...players].sort((a, b) => b.rawScore - a.rawScore);
  ranked.forEach((p, i) => p.mark = (i === 0 ? "◎" : i === 1 ? "○" : i === 2 ? "▲" : "✕"));

  players.forEach(p => {
    const tr = document.createElement("tr");
    const fDisplay = (p.fCount == null || p.fCount === 0) ? "ー" : `F${p.fCount}`;
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
          <div class="st">ST:${p.st != null ? p.st.toFixed(2) : "-"}</div>
        </div>
      </td>
      <td>${fDisplay}</td>
      <td>${formatRateDisplay(p.national)}</td>
      <td>${formatRateDisplay(p.local)}</td>
      <td>${formatRateDisplay(p.motor)}</td>
      <td>${formatRateDisplay(p.course)}</td>
      <td class="eval-mark">${p.mark}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  try {
    const ai = await analyzeRace(players);
    aiMainBody.innerHTML = "";
    aiSubBody.innerHTML = "";
    commentTableBody.innerHTML = "";
    rankingTableBody.innerHTML = "";

    (ai.main || []).slice(0, 5).forEach(r => aiMainBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`);
    (ai.sub || []).slice(0, 5).forEach(r => aiSubBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`);
    (ai.comments || []).forEach(c => commentTableBody.innerHTML += `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`);
    (ai.ranks || []).forEach(r => rankingTableBody.innerHTML += `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score?.toFixed(2) ?? "-"}</td></tr>`);
  } catch (e) {
    logStatus("AI処理エラー: " + e.message);
  }
}

/* 的中率（仮） */
function calcHitRateText(venueId) {
  let total = 0, hit = 0;
  for (const d in HISTORY) {
    (HISTORY[d].results || []).forEach(r => {
      if (r.race_stadium_number === venueId) {
        total++;
        const trif = r.payouts?.trifecta?.[0]?.combination;
        const ai = (r.ai_predictions || []).map(x => x.combination);
        if (trif && ai.includes(trif)) hit++;
      }
    });
  }
  return total ? `${Math.round(hit / total * 100)}%` : "0%";
}

/* イベント設定 */
todayBtn.onclick = () => { CURRENT_MODE = "today"; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); renderVenues(); };
refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* 初期化 */
loadData();

/* グローバルエラー */
window.addEventListener("error", ev => {
  console.error("Unhandled error:", ev.error || ev.message);
  logStatus("ページエラー発生。コンソール確認");
});