// ====================================================
// 🚤 競艇AI予想アプリ（フル統合版）
// ====================================================

// 要素取得
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

// 画面切替
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

// レース画面要素
const venueTitle = document.getElementById("venueTitle");
const racesGrid = document.getElementById("racesGrid");
const backToVenues = document.getElementById("backToVenues");

// 出走表要素
const raceTitle = document.getElementById("raceTitle");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");
const resultNote = document.getElementById("resultNote");
const backToRaces = document.getElementById("backToRaces");

// 日付設定
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

let currentDate = today;

// ====================================================
// 📅 日付切替
function formatDate(d) {
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

function updateDateLabel() {
  dateLabel.textContent = formatDate(currentDate);
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
  VENUES.forEach(name => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.dataset.name = name;
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">ー</div>
      <div class="v-accuracy">--%</div>
    `;
    venuesGrid.appendChild(card);
    card.addEventListener("click", () => openVenue(name));
  });
}
renderVenueGrid();

// ====================================================
// 📦 JSONデータ取得
async function loadData() {
  aiStatus.textContent = ""; // 更新右側文字は非表示
  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch(`${window.DATA_PATH}?t=${Date.now()}`),
      fetch(`${window.HISTORY_PATH}?t=${Date.now()}`)
    ]);
    if (!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
    if (!historyRes.ok) throw new Error(`HTTP ${historyRes.status}`);
    const data = await dataRes.json();
    const history = await historyRes.json();
    updateVenueStatus(data);
    updateResultTable(history);
  } catch (err) {
    console.error("❌ データ読み込みエラー:", err);
    aiStatus.textContent = "データ取得失敗 ❌";
  }
}

// ====================================================
// 🧩 24場の状態反映
function updateVenueStatus(data) {
  const cards = venuesGrid.querySelectorAll(".venue-card");
  cards.forEach(card => {
    const name = card.dataset.name;
    const venue = data.venues?.[name];
    const statusEl = card.querySelector(".v-status");
    const accEl = card.querySelector(".v-accuracy");

    if (venue && venue.length) {
      const firstRace = venue[0];
      statusEl.textContent = firstRace && firstRace.entries.length ? "開催中" : "ー";
      accEl.textContent = "--%"; // 的中率は % のみ
    } else {
      statusEl.textContent = "ー";
      accEl.textContent = "--%";
    }
  });
}

// ====================================================
// 🧾 最新レース結果（history.json）
function updateResultTable(history) {
  resultTable.innerHTML = "";
  for (const rec of history.recent || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${rec.rank}</td><td>${rec.lane}</td><td>${rec.name}</td><td>${rec.st}</td>`;
    resultTable.appendChild(tr);
  }
}

// ====================================================
// 🔁 更新ボタン
document.getElementById("refreshBtn").addEventListener("click", loadData);

// ====================================================
// 🏁 画面遷移：場→レース→出走表
function openVenue(venueName) {
  venueTitle.textContent = venueName;
  racesGrid.innerHTML = "";
  fetch(window.DATA_PATH)
    .then(res => res.json())
    .then(data => {
      const races = data.venues?.[venueName] || [];
      races.forEach((race, i) => {
        const btn = document.createElement("button");
        btn.className = "race-btn";
        btn.textContent = race.raceTitle || `第${i+1}R`;
        btn.addEventListener("click", () => openRace(venueName, i));
        racesGrid.appendChild(btn);
      });
      switchScreen(screenRaces);
    });
}

backToVenues.addEventListener("click", () => switchScreen(screenVenues));

function openRace(venueName, raceIndex) {
  fetch(window.DATA_PATH)
    .then(res => res.json())
    .then(data => {
      const race = data.venues?.[venueName]?.[raceIndex];
      if (!race) return;

      raceTitle.textContent = race.raceTitle || `第${raceIndex+1}R`;

      // 出走表
      entryTable.innerHTML = "";
      race.entries.forEach(e => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${e.lane}</td>
          <td>${e.klass} / ${e.name} / ${e.st}</td>
          <td>${e.f}</td>
          <td>${e.national}</td>
          <td>${e.local}</td>
          <td>${e.mt}</td>
          <td>${e.course}</td>
          <td>${e.eval}</td>
        `;
        entryTable.appendChild(tr);
      });

      // AI本命
      aiMainTable.innerHTML = "";
      race.aiMain?.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${a.pick}</td><td>${a.rate}%</td>`;
        aiMainTable.appendChild(tr);
      });

      // AI穴
      aiSubTable.innerHTML = "";
      race.aiSub?.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${a.pick}</td><td>${a.rate}%</td>`;
        aiSubTable.appendChild(tr);
      });

      // 展開コメント
      commentTable.innerHTML = "";
      race.comments?.forEach((c, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${idx+1}</td><td>${c}</td>`;
        commentTable.appendChild(tr);
      });

      // 順位予測
      rankingTable.innerHTML = "";
      race.ranking?.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.value}</td>`;
        rankingTable.appendChild(tr);
      });

      switchScreen(screenDetail);
    });
}

backToRaces.addEventListener("click", () => switchScreen(screenRaces));

function switchScreen(screen) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// ====================================================
// 🚀 初期化
loadData();