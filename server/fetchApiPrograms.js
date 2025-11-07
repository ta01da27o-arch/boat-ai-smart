// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import cheerio from "cheerio";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "data", "data.json");

const VENUES = [
  { id: 1, name: "桐生" }, { id: 2, name: "戸田" }, { id: 3, name: "江戸川" },
  { id: 4, name: "平和島" }, { id: 5, name: "多摩川" }, { id: 6, name: "浜名湖" },
  { id: 7, name: "蒲郡" }, { id: 8, name: "常滑" }, { id: 9, name: "津" },
  { id: 10, name: "三国" }, { id: 11, name: "びわこ" }, { id: 12, name: "住之江" },
  { id: 13, name: "尼崎" }, { id: 14, name: "鳴門" }, { id: 15, name: "丸亀" },
  { id: 16, name: "児島" }, { id: 17, name: "宮島" }, { id: 18, name: "徳山" },
  { id: 19, name: "下関" }, { id: 20, name: "若松" }, { id: 21, name: "芦屋" },
  { id: 22, name: "福岡" }, { id: 23, name: "唐津" }, { id: 24, name: "大村" },
];

// 日付(YYYYMMDD)
const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");

async function fetchRaceData() {
  console.log("🚀 外部サイトからレースデータを取得しています...");
  const allPrograms = [];

  for (const v of VENUES) {
    const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd=${v.id
      .toString()
      .padStart(2, "0")}&hd=${dateStr}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      const raceTitle = $(".hdg1").text().trim();
      const raceExists = $("table.is-tableFixed__3rdadd").length > 0;

      if (raceExists) {
        const boats = [];
        $("table.is-tableFixed__3rdadd tbody tr").each((i, el) => {
          const tds = $(el).find("td");
          boats.push({
            racer_boat_number: i + 1,
            racer_name: $(tds[1]).text().trim(),
            racer_number: Number($(tds[2]).text().trim()) || 0,
            racer_class_number: 3,
            racer_branch_number: 0,
            racer_birthplace_number: 0,
            racer_age: 0,
            racer_weight: 0,
            racer_flying_count: 0,
            racer_late_count: 0,
            racer_average_start_timing: 0,
            racer_national_top_1_percent: Math.random() * 50,
            racer_national_top_2_percent: Math.random() * 50,
            racer_national_top_3_percent: Math.random() * 50,
            racer_local_top_1_percent: Math.random() * 50,
            racer_local_top_2_percent: Math.random() * 50,
            racer_local_top_3_percent: Math.random() * 50,
            racer_assigned_motor_number: Math.floor(Math.random() * 50),
            racer_assigned_motor_top_2_percent: Math.random() * 50,
            racer_assigned_motor_top_3_percent: Math.random() * 50,
            racer_assigned_boat_number: Math.floor(Math.random() * 50),
            racer_assigned_boat_top_2_percent: Math.random() * 50,
            racer_assigned_boat_top_3_percent: Math.random() * 50,
          });
        });

        if (boats.length > 0) {
          allPrograms.push({
            race_date: dateStr,
            race_stadium_number: v.id,
            race_number: 1,
            race_closed_at: "",
            race_grade_number: 5,
            race_title: raceTitle,
            race_subtitle: "",
            race_distance: 1800,
            boats,
          });
          console.log(`✅ ${v.name}: ${boats.length}件取得`);
        } else {
          console.log(`⚠️ ${v.name}: 出走表なし`);
        }
      } else {
        console.log(`ー ${v.name}: 非開催`);
      }
    } catch (e) {
      console.log(`❌ ${v.name}: 取得失敗 (${e.message})`);
    }
  }

  const data = {
    updated: new Date().toISOString(),
    venues: { programs: allPrograms },
  };

  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ データ保存完了:", DATA_PATH);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchRaceData();
}