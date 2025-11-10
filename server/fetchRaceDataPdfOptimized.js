import fs from "fs";
import fetch from "node-fetch";
import pdf from "pdf-parse";
import { stadiumPdfUrls } from "./stadiumPdfUrls.js";

/**
 * PDFをダウンロードしてテキスト化
 */
async function fetchPdfText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download PDF: ${url}`);
  const buffer = await response.arrayBuffer();
  return pdf(Buffer.from(buffer));
}

/**
 * 各場のPDFテキストを解析してレースデータ取得
 */
async function parseRaceData(text) {
  const lines = text.split("\n");

  // 正規表現例: "1R 10:00 選手A 選手B ..."
  const raceRegex = /^(\d{1,2}R)\s+(\d{1,2}:\d{2})\s+(.+)/;

  const races = [];
  for (const line of lines) {
    const match = line.match(raceRegex);
    if (match) {
      const raceNumber = match[1];
      const time = match[2];
      const players = match[3].split(/\s+/); // 選手名を空白で分割
      races.push({ raceNumber, time, players });
    }
  }
  return races;
}

/**
 * メイン処理: 全場PDF取得→解析→JSON化
 */
async function fetchRaceData() {
  const allData = [];

  for (const stadium of stadiumPdfUrls) {
    console.log(`🌊 ${stadium.id}番場：${stadium.name} PDF取得中...`);
    try {
      const data = await fetchPdfText(stadium.url);
      const races = await parseRaceData(data.text);

      console.log(`✅ ${stadium.id}番場：${races.length}レース取得`);
      allData.push({ stadium: stadium.name, races });

    } catch (err) {
      console.log(`❌ ${stadium.id}番場 取得失敗`, err.message);
      allData.push({ stadium: stadium.name, races: [] });
    }
  }

  fs.writeFileSync("./data/raceDataPdfOptimized.json", JSON.stringify(allData, null, 2));
  console.log("🎉 取得完了：data/raceDataPdfOptimized.json に保存しました");
}

fetchRaceData();