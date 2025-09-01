async function fetchData() {
  try {
    const response = await fetch("data.json"); // 後で外部API接続に切り替え可能
    const data = await response.json();
    document.getElementById("dataArea").innerHTML = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById("dataArea").innerHTML = "データ取得に失敗しました";
  }
}

document.getElementById("updateBtn").addEventListener("click", fetchData);

// 初回読み込み
fetchData();

// PWA用Service Worker登録
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}