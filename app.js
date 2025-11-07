// app/app.js
const DATA_URL = "./data/data.json";
const AI_URL = "./data/ai_results.json";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

const venuesContainer = document.getElementById("venues");
const racesContainer = document.getElementById("races");
const detailsContainer = document.getElementById("details");
const refreshBtn = document.getElementById("refreshBtn");

let raceData = null;
let aiData = null;

// 初期化
async function init() {
  await loadData();
  renderVenues();
}

async function loadData() {
  raceData = await fetch(DATA_URL).then(r => r.json()).catch(() => null);
  aiData = await fetch(AI_URL).then(r => r.json()).catch(() => null);
}

// ===== 24場画面 =====
function renderVenues() {
  venuesContainer.innerHTML = "";
  VENUE_NAMES.forEach((name, i) => {
    const venueNum = i + 1;
    const venuePrograms =
      raceData?.venues?.programs?.filter(p => p.race_stadium_number === venueNum) ||
      [];
    const ai = aiData?.[venueNum];

    const isHeld = venuePrograms.length > 0;
    const accuracy = ai ? `${ai.accuracy.toFixed(1)}%` : "";

    const div = document.createElement("div");
    div.className = `venue ${isHeld ? "active" : "inactive"}`;
    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">${isHeld ? "開催中" : "ー"}</div>
      <div class="venue-accuracy">${isHeld ? accuracy : ""}</div>
    `;
    if (isHeld) {
      div.onclick = () => showRaces(venueNum, name);
    }
    venuesContainer.appendChild(div);
  });
}

// ===== レース番号画面 =====
function showRaces(venueNum, name) {
  venuesContainer.style.display = "none";
  racesContainer.style.display = "grid";
  detailsContainer.style.display = "none";

  racesContainer.innerHTML = `<h2>${name}</h2>`;
  const programs =
    raceData?.venues?.programs?.filter(p => p.race_stadium_number === venueNum) ||
    [];

  programs.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = `${p.race_number}R`;
    btn.onclick = () => showDetails(venueNum, p.race_number);
    racesContainer.appendChild(btn);
  });
}

// ===== 出走表画面 =====
function showDetails(venueNum, raceNumber) {
  venuesContainer.style.display = "none";
  racesContainer.style.display = "none";
  detailsContainer.style.display = "block";

  const race = raceData.venues.programs.find(
    p => p.race_stadium_number === venueNum && p.race_number === raceNumber
  );
  const ai = aiData?.[venueNum]?.predictions?.find(
    p => p.race_number === raceNumber
  );

  detailsContainer.innerHTML = `
    <h3>${race.race_title}</h3>
    <table class="boats">
      <tr><th>艇番</th><th>選手</th><th>コース勝率</th><th>評価</th></tr>
      ${race.boats
        .map(b => {
          const score = (b.racer_national_top_3_percent * 0.6 +
            b.racer_assigned_motor_top_3_percent * 0.4) / 100;
          const mark =
            score > 0.6 ? "◎" : score > 0.5 ? "◯" : score > 0.4 ? "△" : "－";
          return `
            <tr class="boat-row course-${b.racer_boat_number}">
              <td>${b.racer_boat_number}</td>
              <td>${b.racer_name}</td>
              <td>${(score * 100).toFixed(1)}%</td>
              <td>${mark}</td>
            </tr>
          `;
        })
        .join("")}
    </table>

    <div class="ai-predict">
      <h4>AI予想買い目（上位5点）</h4>
      ${ai
        ? ai.ai_predictions
            .map(p => `<div>${p.formation}　${p.percent.toFixed(1)}%</div>`)
            .join("")
        : "<p>解析データなし</p>"}
    </div>

    <button onclick="backToRaces()">戻る</button>
  `;
}

function backToRaces() {
  detailsContainer.style.display = "none";
  racesContainer.style.display = "grid";
}

refreshBtn.onclick = async () => {
  await loadData();
  renderVenues();
};

init();