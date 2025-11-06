// ==========================================
// ai_engine.js（永続保存・学習型AIモジュール）
// ==========================================

// 🔹 AIモデル（全体の記憶構造）
export let globalAIModel = {
  racerStats: {},     // 選手別の統計データ
  motorStats: {},     // モーター番号別成績
  boatStats: {},      // ボート番号別成績
  lastLearned: null   // 最終学習日時
};

// ------------------------------------------
// 🚀 AIコメント生成
// ------------------------------------------
export function generateAIComments(race) {
  const comments = [];
  race.boats.forEach((b, i) => {
    let comment = "";
    const st = b.racer_average_start_timing;
    const mot = b.racer_assigned_motor_top_2_percent;
    const nat = b.racer_national_top_3_percent;

    if (st < 0.14) comment += "スタート早い。";
    else if (st > 0.18) comment += "スタート遅め。";

    if (mot > 50) comment += "モーター好調。";
    else if (mot < 30) comment += "モーター不調。";

    if (nat > 40) comment += "実力上位。";
    else if (nat < 20) comment += "地力不足。";

    comments.push(comment || "特筆なし。");
  });
  return comments;
}

// ------------------------------------------
// 🔮 AI予測生成（本命／穴）
// ------------------------------------------
export function generateAIPredictions(race) {
  const scores = race.boats.map(b => ({
    boat: b.racer_boat_number,
    name: b.racer_name,
    score: calcAIPoint(b)
  }));

  scores.sort((a, b) => b.score - a.score);
  const main = scores.slice(0, 3).map(s => ({
    combo: `${s.boat}-1着`,
    prob: (60 - s.boat * 3).toFixed(1)
  }));
  const sub = scores.slice(-3).map(s => ({
    combo: `${s.boat}-穴`,
    prob: (10 + s.boat * 2).toFixed(1)
  }));

  return { main, sub };
}

// ------------------------------------------
// 📈 AI順位分析（点数算出）
// ------------------------------------------
export function analyzeRace(race) {
  const list = race.boats.map(b => ({
    boat: b.racer_boat_number,
    name: b.racer_name,
    score: calcAIPoint(b)
  }));
  return list.sort((a, b) => b.score - a.score);
}

// ------------------------------------------
// 🧠 学習処理（history.json → data.json対応）
// ------------------------------------------
export function learnFromResults(race, result) {
  if (!race || !result) return;
  const winner = result.winner_boat_number || result.winning_boat;

  race.boats.forEach(b => {
    const id = b.racer_number;
    if (!globalAIModel.racerStats[id]) {
      globalAIModel.racerStats[id] = { win: 0, lose: 0, total: 0 };
    }
    const stat = globalAIModel.racerStats[id];
    stat.total++;
    if (b.racer_boat_number === winner) stat.win++;
    else stat.lose++;
  });

  globalAIModel.lastLearned = new Date().toISOString();
  saveAIMemory();
}

// ------------------------------------------
// 📊 AIスコア算出ロジック
// ------------------------------------------
function calcAIPoint(b) {
  const base =
    (b.racer_national_top_3_percent || 0) * 0.4 +
    (b.racer_local_top_3_percent || 0) * 0.2 +
    (b.racer_assigned_motor_top_2_percent || 0) * 0.4;

  const st = b.racer_average_start_timing;
  const stBonus = st < 0.14 ? 5 : st > 0.18 ? -3 : 0;

  const racerMemory = globalAIModel.racerStats[b.racer_number];
  const learnBonus = racerMemory
    ? (racerMemory.win / (racerMemory.total || 1)) * 100 * 0.3
    : 0;

  return (base + stBonus + learnBonus).toFixed(1);
}

// ------------------------------------------
// 💾 localStorage 永続化
// ------------------------------------------
const AI_MEMORY_KEY = "boat-ai-memory";

export function saveAIMemory() {
  try {
    localStorage.setItem(AI_MEMORY_KEY, JSON.stringify(globalAIModel));
    console.log("💾 AIメモリ保存完了");
  } catch (e) {
    console.warn("AIメモリ保存失敗:", e);
  }
}

export function loadAIMemory() {
  try {
    const json = localStorage.getItem(AI_MEMORY_KEY);
    if (json) {
      globalAIModel = JSON.parse(json);
      console.log("🧠 AIメモリ復元完了");
      return true;
    }
  } catch (e) {
    console.warn("AIメモリ復元失敗:", e);
  }
  return false;
}

export function resetAIMemory() {
  localStorage.removeItem(AI_MEMORY_KEY);
  globalAIModel = { racerStats: {}, motorStats: {}, boatStats: {}, lastLearned: null };
  console.log("🧹 AIメモリリセット");
}

// ------------------------------------------
// 🧩 簡易AIテスト関数（開発用）
// ------------------------------------------
export function debugAI() {
  console.table(globalAIModel.racerStats);
}