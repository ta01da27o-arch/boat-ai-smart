// server/fetchAllAI.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { VENUES } from "./venues.js";
import { scrapeRaceListAndEntries } from "./scrape.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 正しいパス設定（server/data）
const dataDir = path.join(__dirname, "data");
const dataPath = path.join(dataDir, "data.json");
const historyPath = path.join(dataDir, "history.json");

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

async function main() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const allData = { updated: new Date().toISOString(), venues: {} };

  for (const v of VENUES) {
    console.log(`■ FETCH：${v.name}`);
    try {
      const list = await scrapeRaceListAndEntries(v.code, dateStr);
      console.log(`✅ 抽出：${v.name} → レース数 ${list.length}`);
      allData.venues[v.name] = list;
    } catch (e) {
      console.error(`❌ ${v.name} 取得失敗: ${e.message}`);
      allData.venues[v.name] = [];
    }
  }

  // 保存処理
  fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2));
  console.log(`✅ data.json saved: ${dataPath}`);

  let history = [];
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }
  }

  history.unshift({
    date: dateStr,
    summary: VENUES.map(v => v.name)
  });

  fs.writeFileSync(historyPath, JSON.stringify(history.slice(0, 30), null, 2));
  console.log(`✅ history.json updated: ${historyPath}`);
}

main().catch(err => {
  console.error("❌ Fetch failed:", err);
  process.exit(1);
});