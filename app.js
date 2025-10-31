// ===============================
// 競艇AI予想アプリ main script
// ===============================

// --- 要素取得 ---
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const venuesGrid = document.getElementById("venuesGrid");

// 画面
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const racesGrid = document.getElementById("racesGrid");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentBody = document.querySelector("#commentTable tbody");
const rankingBody = document.querySelector("#rankingTable tbody");
const resultBody = document.querySelector("#resultTable tbody");

// --- 定数 ---
const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

let currentDate = new Date();
let currentVenue = null;
let currentRace = null;

// --- 日付ラベル更新 ---
function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });
}

// --- 画面切り替え ---
function showScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  target.classList.add("active");
}

// --- 日付切り替え ---
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  currentDate = new Date();
  updateDateLabel();
  loadVenues();
});

yesterdayBtn.addEventListener("click", () => {
  todayBtn.classList.remove("active");
  yesterdayBtn.classList.add("active");
  const y = new Date();
  y.setDate(y.getDate() - 1);
  currentDate = y;
  updateDateLabel();
  loadVenues();
});

// --- 戻るボタン ---
backToVenues.addEventListener("click", () => showScreen(screenVenues));
backToRaces.addEventListener("click", () => showScreen(screenRaces));

// --- JSON取得 ---
async function fetchData(path) {
  const url = path + "?t=" + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error("データ取得エラー");
  return await res.json();
}

// --- 24場一覧ロード ---
async function loadVenues() {
  aiStatus.textContent = "データ取得中...";
  venuesGrid.innerHTML = "";

  try {
    const data = await fetchData(window.DATA_PATH);

    VENUES.forEach(name => {
      const venue = data.venues.find(v => v.name === name);
      const div = document.createElement("div");
      div.className = "venue-card";

      const vName = document.createElement("div");
      vName.className = "v-name";
      vName.textContent = name;

      const vStatus = document.createElement("div");
      vStatus.className = "v-status";

      const vAcc = document.createElement("div");
      vAcc.className = "v-accuracy";

      if (venue && venue.status === "active") {
        vStatus.textContent = "開催中";
        vStatus.classList.add("active");
        vAcc.textContent = `当地的中率 ${venue.accuracy ?? 0}%`;
        div.classList.add("clickable");
        div.addEventListener("click", () => openVenue(name));
      } else {
        vStatus.textContent = "ー";
        vStatus.classList.add("closed");
        vAcc.textContent = "";
        div.classList.add("disabled");
      }

      div.appendChild(vName);
      div.appendChild(vStatus);
      div.appendChild(vAcc);
      venuesGrid.appendChild(div);
    });

    aiStatus.textContent = "データ取得完了 ✅";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// --- レース番号画面を開く ---
function openVenue(name) {
  currentVenue = name;
  venueTitle.textContent = `${name}（${dateLabel.textContent}）`;
  showScreen(screenRaces);

  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(i));
    racesGrid.appendChild(btn);
  }
}

// --- 出走表画面を開く ---
async function openRace(raceNo) {
  currentRace = raceNo;
  raceTitle.textContent = `${currentVenue} ${raceNo}R`;

  showScreen(screenDetail);
  aiStatus.textContent = "詳細データ取得中...";

  try {
    const data = await fetchData(window.DATA_PATH);
    const venue = data.venues.find(v => v.name === currentVenue);
    if (!venue || !venue.races) throw new Error("レースデータなし");
    const race = venue.races.find(r => r.no === raceNo);
    if (!race) throw new Error("指定レースなし");

    // 出走表
    entryTableBody.innerHTML = "";
    race.entries.forEach((e, i) => {
      const tr = document.createElement("tr");
      tr.classList.add(`row-${i + 1}`);
      tr.innerHTML = `
        <td>${e.boat}</td>
        <td class="entry-left">
          <span class="klass">${e.class}</span>
          <span class="name">${e.name}</span>
          <span class="st">ST:${e.st}</span>
        </td>
        <td>${e.f}</td>
        <td>${e.national}</td>
        <td>${e.local}</td>
        <td>${e.mt}</td>
        <td>${e.course}</td>
        <td>${e.eval}</td>
      `;
      entryTableBody.appendChild(tr);
    });

    // AI本命
    aiMainBody.innerHTML = "";
    race.ai_main.forEach(a => {
      aiMainBody.innerHTML += `<tr><td>${a.buy}</td><td>${a.prob}%</td></tr>`;
    });

    // AI穴
    aiSubBody.innerHTML = "";
    race.ai_sub.forEach(a => {
      aiSubBody.innerHTML += `<tr><td>${a.buy}</td><td>${a.prob}%</td></tr>`;
    });

    // コメント
    commentBody.innerHTML = "";
    race.comments.forEach(c => {
      commentBody.innerHTML += `<tr><td>${c.course}</td><td>${c.text}</td></tr>`;
    });

    // AI順位
    rankingBody.innerHTML = "";
    race.ranking.forEach(r => {
      rankingBody.innerHTML += `<tr><td>${r.rank}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score}</td></tr>`;
    });

    // 結果（history.jsonから）
    await loadResult(currentVenue, raceNo);

    aiStatus.textContent = "✅ データ更新完了";
  } catch (err) {
    console.error(err);
    aiStatus.textContent = "❌ データ取得失敗";
  }
}

// --- レース結果読み込み ---
async function loadResult(venue, raceNo) {
  try {
    const data = await fetchData(window.HISTORY_PATH);
    const v = data.results.find(r => r.venue === venue && r.no === raceNo);
    resultBody.innerHTML = "";
    if (v) {
      v.entries.forEach(r => {
        resultBody.innerHTML += `<tr><td>${r.rank}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.st}</td></tr>`;
      });
    } else {
      resultBody.innerHTML = `<tr><td colspan="4">結果データなし</td></tr>`;
    }
  } catch {
    resultBody.innerHTML = `<tr><td colspan="4">結果読み込みエラー</td></tr>`;
  }
}

// --- 更新ボタン ---
refreshBtn.addEventListener("click", () => {
  loadVenues();
});

// --- 初期表示 ---
updateDateLabel();
loadVenues();