const API_URL = "/server/data/data.json";

let raceData = null;
let currentVenue = null;
let currentRace = null;

/**
 * JSONデータを取得
 */
async function loadRaceData() {
  try {
    const response = await fetch(API_URL + `?t=${Date.now()}`);
    raceData = await response.json();
    console.log("✅ data.json 読み込み成功");
    renderVenues();
  } catch (error) {
    console.error("❌ data.json 読み込み失敗:", error);
  }
}

/**
 * 24場画面を描画
 */
function renderVenues() {
  const container = document.getElementById("app");
  container.innerHTML = `
    <h2>全国24場レース一覧</h2>
    <button id="refreshButton">🔄 更新</button>
    <div id="venueGrid" class="venue-grid"></div>
  `;

  const grid = document.getElementById("venueGrid");
  const venues = getVenueList();

  venues.forEach((venue) => {
    const program = raceData?.venues?.programs?.find(
      (p) => p.race_stadium_number === venue.id
    );
    const isActive = !!program;
    const aiRate = program ? getRandomAccuracy() : null;

    const venueCard = document.createElement("div");
    venueCard.className = `venue-card ${!isActive ? "inactive" : ""}`;
    venueCard.innerHTML = `
      <h3>${venue.name}</h3>
      <p>${isActive ? "開催中" : "ー"}</p>
      ${
        aiRate
          ? `<p class="ai-rate">AI的中率 ${aiRate.toFixed(1)}%</p>`
          : `<p class="ai-rate">AI的中率 ー</p>`
      }
    `;
    if (isActive) {
      venueCard.onclick = () => renderRaces(venue.id);
    }
    grid.appendChild(venueCard);
  });

  document.getElementById("refreshButton").onclick = () => {
    console.log("🔄 更新ボタン押下 → データ再読込");
    loadRaceData();
  };
}

/**
 * レース番号画面
 */
function renderRaces(venueId) {
  currentVenue = venueId;
  const container = document.getElementById("app");

  const venueName = getVenueList().find((v) => v.id === venueId)?.name || "";

  container.innerHTML = `
    <h2>${venueName}（レース番号選択）</h2>
    <button id="backButton">⬅ 戻る</button>
    <div id="raceButtons" class="race-grid"></div>
  `;

  const raceGrid = document.getElementById("raceButtons");
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.onclick = () => renderRaceDetail(venueId, i);
    raceGrid.appendChild(btn);
  }

  document.getElementById("backButton").onclick = renderVenues;
}

/**
 * 出走表画面
 */
function renderRaceDetail(venueId, raceNo) {
  currentRace = raceNo;
  const container = document.getElementById("app");

  const venueName = getVenueList().find((v) => v.id === venueId)?.name || "";

  const program =
    raceData?.venues?.programs?.find(
      (p) =>
        p.race_stadium_number === venueId && p.race_number === Number(raceNo)
    ) || {};

  const boats = program.boats || generateDummyBoats();

  container.innerHTML = `
    <h2>${venueName} ${raceNo}R 出走表</h2>
    <button id="backButton">⬅ 戻る</button>
    <div id="raceTable" class="race-table"></div>
    <div id="aiPredictions" class="ai-box"></div>
  `;

  const table = document.getElementById("raceTable");
  boats.forEach((boat, i) => {
    const row = document.createElement("div");
    row.className = `boat-row color-${boat.racer_boat_number}`;
    row.innerHTML = `
      <span>${boat.racer_boat_number}号艇</span>
      <span>${boat.racer_name}</span>
      <span>勝率: ${boat.course_win_rate?.toFixed(2) || (Math.random() * 6 + 3).toFixed(2)}</span>
      <span class="eval">${getEvaluationSymbol(i)}</span>
    `;
    table.appendChild(row);
  });

  const aiBox = document.getElementById("aiPredictions");
  aiBox.innerHTML = `
    <h3>AI予想買い目（上位5点）</h3>
    ${generateAiPredictions()
      .map(
        (pred) =>
          `<p>${pred.combo}<span class="percent">${pred.rate}%</span></p>`
      )
      .join("")}
  `;

  document.getElementById("backButton").onclick = () =>
    renderRaces(currentVenue);
}

/**
 * AI的中率ダミー（0〜70%）
 */
function getRandomAccuracy() {
  return Math.random() * 70;
}

/**
 * 評価記号
 */
function getEvaluationSymbol(index) {
  const symbols = ["◎", "◯", "▲", "△", "☆", "×"];
  return symbols[index % symbols.length];
}

/**
 * AI買い目5点生成
 */
function generateAiPredictions() {
  const baseCombos = ["1-3-2", "1-3-4", "3-1-2", "3-1-4", "3-4-1"];
  return baseCombos.map((combo, i) => ({
    combo,
    rate: (56 - i * 7).toFixed(1),
  }));
}

/**
 * ダミー選手データ
 */
function generateDummyBoats() {
  return Array.from({ length: 6 }, (_, i) => ({
    racer_boat_number: i + 1,
    racer_name: `選手${i + 1}`,
    course_win_rate: Math.random() * 6 + 3,
  }));
}

/**
 * 全国24場一覧
 */
function getVenueList() {
  return [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村",
  ].map((name, i) => ({ id: i + 1, name }));
}

/**
 * 初期化
 */
window.addEventListener("load", loadRaceData);