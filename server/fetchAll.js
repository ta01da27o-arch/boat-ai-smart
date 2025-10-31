// server/fetchAll.js
import { scrapeAllVenues } from "./scrape.js";

(async () => {
  console.log("🚀 出走表自動取得開始...");
  await scrapeAllVenues();
  console.log("✅ 全場データ更新完了。");
})();
