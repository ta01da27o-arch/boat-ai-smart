import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const __dirname = process.cwd();
const OUTPUT_PATH = path.join(__dirname, "data/data.json");
const VENUE_CODES = [
  "01","02","03","04","05","06","07","08",
  "09","10","11","12","13","14","15","16",
  "17","18","19","20","21","22","23","24"
];

console.log("🚀 外部APIからレースデータを取得しています...");

async function fetchRaceData() {
  const today = getToday();
  const programs = [];

  for (const code of VENUE_CODES) {
    const url = `https://www.boatrace.jp/owpc/pc/race/index?jcd=${code}&hd=${today}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      // ✅ 開催タイトル取得
      const title = $(".heading2_title, .heading1_title").first().text().trim();

      // 開催なし判定
      if (!title || title.includes("開催なし")) {
        console.log(`ー ${code}番場：開催なし`);
        continue;
      }

      const races = [];

      // ✅ テーブルからレース情報を抽出
      $("table.is-fs12 td").each((i, el) => {
        const txt = $(el).text().trim();
        if (txt.match(/R/)) {
          races.push({
            race_number: i + 1,
            race_title: txt,
          });
        }
      });

      if (races.length > 0) {
        programs.push({
          stadium_code: code,
          stadium_name: $("title").text().replace("｜BOAT RACE オフィシャルウェブサイト", "").trim(),
          race_date: today,
          race_title: title,
          races,
        });
        console.log(`✅ ${code}番場：${races.length}R取得 (${title})`);
      } else {
        console.log(`⚠️ ${code}番場：レース情報なし`);
      }
    } catch (err) {
      console.log(`⚠️ ${code}番場 取得エラー: ${err.message}`);
    }
  }

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