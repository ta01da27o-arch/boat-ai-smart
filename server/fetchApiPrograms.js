import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const __dirname = process.cwd();
const OUTPUT_PATH = path.join(__dirname, "server/data/data.json");
const VENUE_CODES = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

console.log("🚀 外部APIからレースデータを取得しています...");

async function fetchRaceData() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const today = getToday();
  const programs = [];

  for (const code of VENUE_CODES) {
    const url = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${code}&hd=${today}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

      // JSレンダリング完了を待つ
      await page.waitForTimeout(1500);

      const title = await page.textContent(".heading2_title, .heading1_title").catch(() => null);
      if (!title || title.includes("開催なし")) {
        console.log(`ー ${code}番場：開催なし`);
        continue;
      }

      const stadiumName = await page.title().then(t =>
        t.replace("｜BOAT RACE オフィシャルウェブサイト", "").trim()
      );

      // レース番号を抽出（例：1R～12R）
      const races = await page.$$eval("table.is-fs12 td", els =>
        els
          .map(e => e.textContent.trim())
          .filter(t => /^[0-9]{1,2}R$/.test(t))
          .map(t => ({ race_number: parseInt(t.replace("R", "")), race_title: t }))
      );

      if (races.length > 0) {
        programs.push({
          stadium_code: code,
          stadium_name: stadiumName,
          race_date: today,
          race_title: title.trim(),
          races,
        });
        console.log(`✅ ${code}番場：${races.length}R取得 (${title.trim()})`);
      } else {
        console.log(`⚠️ ${code}番場：レース情報なし`);
      }
    } catch (err) {
      console.log(`⚠️ ${code}番場エラー: ${err.message}`);
    }
  }

  await browser.close();
  return programs;
}

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

(async () => {
  const data = await fetchRaceData();

  if (!data || data.length === 0) {
    console.error("❌ データ取得失敗：レース情報が空です");
    process.exit(1);
  }

  const output = {
    updated: new Date().toISOString(),
    venues: { programs: data },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ データ保存完了: ${OUTPUT_PATH}`);
})();