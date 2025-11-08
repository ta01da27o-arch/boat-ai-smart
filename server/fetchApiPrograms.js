import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import cheerio from "cheerio";

const DATA_DIR = path.join(process.cwd(), "server", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const OUTPUT_JSON = path.join(DATA_DIR, "data.json");

async function scrapeRacePrograms() {
  const baseUrl = "https://www.boatrace.jp/owpc/pc/race/racelist";
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  console.log(`🚀 スクレイピング開始 (${dateStr})`);

  const venues = [];

  for (let jcd = 1; jcd <= 24; jcd++) {
    const url = `${baseUrl}?hd=${dateStr}&jcd=${String(jcd).padStart(2, "0")}`;
    console.log(`🌊 ${jcd.toString().padStart(2, "0")}番場：取得中...`);

    try {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      const title = $(".title04").first().text().trim();
      if (!title) {
        console.log(`⚠️ ${jcd.toString().padStart(2, "0")}番場：レース情報なし`);
        continue;
      }

      const races = [];
      $(".is-active .table1").each((i, el) => {
        const raceTitle = $(el).find(".table1_boatImage1Title").text().trim();
        races.push({
          race_number: i + 1,
          race_title: raceTitle || "番組未設定",
        });
      });

      venues.push({
        stadium_number: jcd,
        title,
        races,
      });

      console.log(`✅ ${jcd.toString().padStart(2, "0")}番場：${races.length}R 取得完了`);
    } catch (err) {
      console.log(`❌ ${jcd.toString().padStart(2, "0")}番場：取得失敗 (${err.message})`);
    }
  }

  const result = {
    updated: new Date().toISOString(),
    venues: { programs: venues },
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(result, null, 2));
  console.log(`✅ JSON保存完了: ${OUTPUT_JSON}`);
}

scrapeRacePrograms();