// ==========================
// ai_engine.js
// ==========================

// 擬似乱数ヘルパー
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * AI本命・穴の予想生成
 * @param {Object} race 出走データ
 * @returns {Object} { main:[], sub:[] }
 */
export function generateAIPredictions(race) {
  if (!race?.boats) return { main: [], sub: [] };

  // 出走ボート番号一覧
  const boats = race.boats.map(b => b.racer_boat_number);
  const combos = [];

  // 3連単の買い目をダミー生成
  for (let i = 0; i < 6; i++) {
    const c = shuffle([...boats]).slice(0, 3).join("-");
    combos.push(c);
  }

  // 本命3・穴3
  const main = combos.slice(0, 3).map(c => ({
    combo: c,
    prob: rand(40, 80)
  }));
  const sub = combos.slice(3).map(c => ({
    combo: c,
    prob: rand(10, 40)
  }));

  return { main, sub };
}

/**
 * コース別AIコメント生成
 * @param {Object} race
 * @returns {string[]} 6件
 */
export function generateAIComments(race) {
  const phrases = [
    "スタート速く展開作る可能性あり",
    "ターン安定感あり、連対圏内",
    "差し主体で展開待ち",
    "進入で鍵を握る存在",
    "スタート不安も一撃あり",
    "展開次第で浮上可能"
  ];

  return race.boats.map((b, i) => {
    const base = phrases[i % phrases.length];
    return `${b.racer_boat_number}号艇 ${b.racer_name}：${base}`;
  });
}

/**
 * AI順位予測
 * @param {Object} race
 * @returns {Object[]} [{boat,name,score}]
 */
export function analyzeRace(race) {
  if (!race?.boats) return [];

  // ダミー評価値（ランダム＋艇番補正）
  const results = race.boats.map(b => ({
    boat: b.racer_boat_number,
    name: b.racer_name,
    score: (100 - b.racer_boat_number * 5 + rand(-10, 10))
  }));

  // 高スコア順で並べ替え
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 結果ファイル(history.json)からAIが学習するダミー関数
 * @param {Object} history
 * @returns {Object} 学習結果
 */
export function learnFromResults(history) {
  if (!history?.results) return { message: "履歴データなし" };

  const count = history.results.length;
  const latest = history.results[0];
  return {
    message: `AIは過去${count}件のレース結果から学習しました。最新: ${latest?.venue_name || "-"} 第${latest?.race_number || "-"}R`
  };
}

/* ---- ユーティリティ ---- */
function shuffle(arr) {
  return arr
    .map(v => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}