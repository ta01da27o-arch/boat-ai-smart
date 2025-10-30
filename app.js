// ==============================
//  BOAT AI 予想アプリ
//  GitHub Pages対応版（2025/10/30）
// ==============================

// ✅ GitHub Pages上の絶対パスで指定
const DATA_PATH = "https://ta01da27o-arch.github.io/boat-ai-smart/data/data.json";
const HISTORY_PATH = "https://ta01da27o-arch.github.io/boat-ai-smart/data/history.json";

// DOM要素取得
const todayLabel = document.getElementById("todayLabel");
const globalHit = document.getElementById("globalHit");
const refreshBtn = document.getElementById("refreshBtn");
const view = document.getElementById("view");

// 日付表示
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
todayLabel.textContent = `${yyyy}/${mm}/${dd}`;

// ==============================
// データ取得
// ==============================
async function fetchData() {
  view.innerHTML = "<p>🔄 データ読み込み中...</p>";

  try {
    const res = await fetch(DATA_PATH, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTPエラー");
    const data = await res.json();

    renderVenues(data.venues);
  } catch (err) {
    console.error("⚠️ data.json読み込み失敗:", err);
    view.innerHTML = `
      <p style="color:red;">⚠️ data.jsonの読み込みに失敗しました</p>
      <p>ネット接続 or GitHub Pages反映を確認して下さい。</p>
    `;
  }
}

// ==============================
// レース場リストを表示
// ==============================
function renderVenues(venues) {
  if (!venues || venues.length === 0) {
    view.innerHTML = "<p>⚠️ データがありません</p>";
    return;
  }

  let html = "";
  venues.forEach((v) => {
    html += `
      <div class="venue-card">
        <h2>${v.name} <span class="status ${v.status}">${v.status_label}</span></h2>
        <p>精度: ${v.accuracy}%</p>
        <div class="races">
          ${renderRaces(v.races)}
        </div>
      </div>
    `;
  });

  view.innerHTML = html;
}

// ==============================
// 各レースを表示
// ==============================
function renderRaces(races) {
  let html = "";
  for (const key in races) {
    const race = races[key];
    html += `
      <div class="race-card">
        <h3>第${key}R 予想</h3>
        <p>📊 本命：${race.prediction.main.map((m) => `${m.buy} (${m.rate}%)`).join(", ")}</p>
        <p>💡 コメント：${race.comments.join(" / ")}</p>
        <table class="entries">
          <tr><th>艇</th><th>選手</th><th>ST</th><th>評価</th></tr>
          ${race.entries
            .map(
              (e) =>
                `<tr>
                   <td>${e.no}</td>
                   <td>${e.name}</td>
                   <td>${e.st}</td>
                   <td>${e.eval}</td>
                 </tr>`
            )
            .join("")}
        </table>
      </div>
    `;
  }
  return html;
}

// ==============================
// 更新ボタンイベント
// ==============================
refreshBtn.addEventListener("click", () => {
  view.innerHTML = "<p>🔄 更新中...</p>";
  setTimeout(fetchData, 500);
});

// ==============================
// 初期表示
// ==============================
fetchData();