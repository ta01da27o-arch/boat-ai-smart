// =====================
// AI学習・予測ロジック
// =====================

// 擬似AI予測（将来ここをモデル化）
export function generateAIPredictions(stadiumName, raceNumber) {
  const baseProb = 50 + Math.random() * 10;
  const buys = [
    { buy: "1-3-2", probability: roundProb(baseProb) },
    { buy: "1-3-4", probability: roundProb(baseProb - 5) },
    { buy: "3-1-2", probability: roundProb(baseProb - 15) },
    { buy: "3-1-4", probability: roundProb(baseProb - 20) },
    { buy: "3-4-1", probability: roundProb(baseProb - 25) },
  ];
  return buys;
}

export function generateAIComments(stadiumName, raceNumber) {
  return [
    `${stadiumName} 第${raceNumber}R：AIはイン有利展開を予測。`,
    `追い風が強い場合はセンター勢にもチャンスあり。`,
  ];
}

// 将来的な結果学習処理（履歴ベース）
export function learnFromResults(resultHistory) {
  console.log("🧠 過去データから学習中...", resultHistory.length, "件");
  return true;
}

// レース分析（拡張用）
export function analyzeRace(raceData) {
  if (!raceData) return {};
  return { speed: "normal", wind: "mild" };
}

// 数値の丸め
function roundProb(p) {
  return Math.max(5, Math.min(95, Math.round(p * 10) / 10)); // 小数1位まで
}