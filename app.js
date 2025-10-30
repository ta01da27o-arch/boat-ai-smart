// ✅ 競艇AI予想 トップ画面〜遷移対応版
// data.json 読み込み・開催状況・日付切替・遷移実装

const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

let currentDate = new Date();

// 📅 日付ラベル更新
function updateDateLabel() {
  dateLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 📦 データ読み込み
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    // ✅ フォルダ名が「データ」なのでここを修正
    const res = await fetch("./データ/data.json?nocache=" + Date.now());
    if (!res.ok) throw new Error("HTTPエラー");
    const data = await res.json();

    // 24場のカードを生成
    venuesGrid.innerHTML = "";
    const allVenues = [
      "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
      "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
      "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
      "下関", "若松", "芦屋", "福岡", "唐津", "大村"
    ];

    allVenues.forEach(name => {
      const venue = data.venues.find(v => v.name === name);
      const status = venue ? venue.status : "closed";
      const accuracy = venue ? venue.accuracy : null;

      // 開催中 or ー
      const label = (venue && venue.status === "open") ? "開催中" : "ー";

      // HTML構築
      const div = document.createElement("div");
      div.className = `venue-card ${status === "open" ? "clickable" : "disabled"}`;
      div.dataset.name = name;
      div.innerHTML = `
        <div class="v-name">${name}</div>
        <div class="v-status ${status === "open" ? "active" : "closed"}">${label}</div>
        <div class="v-accuracy">${accuracy ? `精度: ${accuracy}%` : ""}</div>
      `;

      // 開催中ならクリックでレース画面へ遷移
      if (status === "open") {
        div.addEventListener("click", () => {
          showRaces(name);
        });
      }

      venuesGrid.appendChild(div);
    });

    aiStatus.textContent = "データ取得完了 ✅";
  } catch (e) {
    aiStatus.textContent = "データ取得失敗 ❌";
    console.error(e);
    alert("⚠️ data.jsonの読み込みに失敗しました");
  }
}

// 🕹 日付切替（本日・前日）
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
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateLabel();
  loadData();
});

// 🧭 レース画面遷移
function showRaces(venueName) {
  document.getElementById("screen-venues").classList.remove("active");
  document.getElementById("screen-races").classList.add("active");
  document.getElementById("venueTitle").textContent = venueName;

  const racesGrid = document.getElementById("racesGrid");
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.onclick = () => showRaceDetail(venueName, i);
    racesGrid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => {
    document.getElementById("screen-races").classList.remove("active");
    document.getElementById("screen-venues").classList.add("active");
  };
}

// 📋 出走表表示（暫定）
function showRaceDetail(venueName, raceNo) {
  alert(`${venueName} ${raceNo}R の出走表画面を表示予定`);
}

// ▶ 初期表示
updateDateLabel();
loadData();