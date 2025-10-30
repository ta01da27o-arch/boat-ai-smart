// 競艇AI予想：3画面遷移対応版（トップ→レース→出走表）

// ---- 要素取得 ----
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueTitle = document.getElementById("venueTitle");
const racesGrid = document.getElementById("racesGrid");
const raceTitle = document.getElementById("raceTitle");

// 出走表関連
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

// ---- 定数 ----
const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

// ---- 状態管理 ----
let data = null;
let currentVenue = null;
let currentRace = null;
let currentDate = new Date(); // デフォルト＝本日

// ---- 日付ラベル ----
function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });
}
updateDateLabel();

// ---- 24場カード生成 ----
function createVenueGrid() {
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

// ---- データ取得 ----
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    const res = await fetch("../data/data.json?nocache=" + Date.now());
    if (!res.ok) throw new Error("HTTPエラー");
    data = await res.json();

    // トップ画面反映
    const cards = venuesGrid.querySelectorAll(".venue-card");
    cards.forEach(card => {
      const name = card.dataset.name;
      const venue = data.venues.find(v => v.name === name);
      const vStatus = card.querySelector(".v-status");
      const vAcc = card.querySelector(".v-accuracy");

      if (venue) {
        if (venue.status === "open") {
          vStatus.textContent = "開催中";
          vStatus.className = "v-status active";
          card.classList.add("clickable");
          card.onclick = () => openVenue(name);
        } else {
          vStatus.textContent = "ー";
          vStatus.className = "v-status closed";
          card.classList.remove("clickable");
          card.onclick = null;
        }
        vAcc.textContent = `精度:${venue.accuracy ?? 0}%`;
      } else {
        vStatus.textContent = "ー";
        vStatus.className = "v-status closed";
        card.classList.remove("clickable");
        card.onclick = null;
        vAcc.textContent = "";
      }
    });

    aiStatus.textContent = "データ取得完了 ✅";
  } catch (e) {
    aiStatus.textContent = "データ取得失敗 ❌";
    console.error(e);
    alert("⚠️ data.jsonの読み込みに失敗しました");
  }
}

// ---- 開催場クリック → レース番号画面 ----
function openVenue(name) {
  currentVenue = data.venues.find(v => v.name === name);
  if (!currentVenue) return;

  venueTitle.textContent = `${name}（${currentVenue.status_label}）`;
  showScreen(screenRaces);

  // 12Rボタン生成
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    const race = currentVenue.races[i];
    if (!race) {
      btn.classList.add("disabled");
    } else {
      btn.onclick = () => openRace(i);
    }
    racesGrid.appendChild(btn);
  }
}

// ---- レース番号クリック → 出走表画面 ----
function openRace(raceNo) {
  const race = currentVenue.races[raceNo];
  if (!race) return;

  currentRace = race;
  raceTitle.textContent = `${currentVenue.name} ${raceNo}R 出走表`;

  // 出走表
  entryTable.innerHTML = "";
  race.entries.forEach((e, idx) => {
    const tr = document.createElement("tr");
    tr.className = `row-${idx + 1}`;
    tr.innerHTML = `
      <td>${e.no}</td>
      <td>${e.class} / ${e.name} / ${e.st}</td>
      <td>${e.f || "-"}</td>
      <td>${e.z}</td>
      <td>${e.t}</td>
      <td>${e.mt}</td>
      <td>${e.course}</td>
      <td>${e.eval}</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI予想
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  (race.prediction?.main || []).forEach(p => {
    aiMain.innerHTML += `<tr><td>${p.buy}</td><td>${p.rate}%</td></tr>`;
  });
  (race.prediction?.sub || []).forEach(p => {
    aiSub.innerHTML += `<tr><td>${p.buy}</td><td>${p.rate}%</td></tr>`;
  });

  // コメント
  commentTable.innerHTML = "";
  (race.comments || []).forEach((c, i) => {
    commentTable.innerHTML += `<tr><td>${i + 1}</td><td>${c}</td></tr>`;
  });

  // 順位予測
  rankingTable.innerHTML = "";
  (race.ranking || []).forEach(r => {
    rankingTable.innerHTML += `<tr><td>${r.rank || "-"}</td><td>${r.no}</td><td>${r.name}</td><td>${r.score}</td></tr>`;
  });

  // 結果
  resultTable.innerHTML = "";
  (race.results || []).forEach(r => {
    resultTable.innerHTML += `<tr><td>${r.rank}</td><td>${r.no}</td><td>${r.name}</td><td>${r.st}</td></tr>`;
  });

  showScreen(screenDetail);
}

// ---- 画面切替 ----
function showScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  target.classList.add("active");
}

// ---- 戻るボタン ----
document.getElementById("backToVenues").addEventListener("click", () => showScreen(screenVenues));
document.getElementById("backToRaces").addEventListener("click", () => showScreen(screenRaces));

// ---- 本日・前日切替 ----
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  currentDate = new Date();
  updateDateLabel();
  loadData();
});

yesterdayBtn.addEventListener("click", () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateLabel();
  loadData();
});

// ---- 更新 ----
refreshBtn.addEventListener("click", loadData);

// ---- 初期処理 ----
createVenueGrid();
loadData();