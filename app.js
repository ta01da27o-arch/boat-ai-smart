// 競艇AI予想（GitHub Pages対応・data.json読み込み修正版）

const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");

const today = new Date();
dateLabel.textContent = today.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    // ✅ GitHub Pagesでの正しいパス
    const res = await fetch("./data/data.json?nocache=" + Date.now());
    if (!res.ok) throw new Error("HTTPエラー");

    const data = await res.json();

    const cards = venuesGrid.querySelectorAll(".venue-card");
    cards.forEach(card => {
      const name = card.dataset.name;
      const venue = data.venues.find(v => v.name === name);
      if (venue) {
        card.querySelector(".status").textContent = venue.status_label;
        card.querySelector(".accuracy").textContent = `精度: ${venue.accuracy}%`;
        card.classList.remove("open", "closed", "none");
        card.classList.add(venue.status);
      } else {
        card.querySelector(".status").textContent = "データなし";
        card.querySelector(".accuracy").textContent = "";
        card.classList.remove("open", "closed");
      }
    });

    aiStatus.textContent = "データ取得完了 ✅";
  } catch (e) {
    aiStatus.textContent = "データ取得失敗 ❌";
    console.error(e);
    alert("⚠️ data.jsonの読み込みに失敗しました");
  }
}

document.getElementById("refreshBtn").addEventListener("click", loadData);
loadData();