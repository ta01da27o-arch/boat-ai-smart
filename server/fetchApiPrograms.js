// server/fetchApiPrograms.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { execSync } from "child_process";
import * as cheerio from "cheerio"; // ✅ 修正版
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保存先ディレクトリ
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// 今日と前日の日付
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const dateStr = `${yyyy}${mm}${dd}`;
const yesterday = new Date(today.getTime() - 86400000);
const yyyyy = yesterday.getFullYear();
const ymm = String(yesterday.getMonth() + 1).padStart(2, "0");
const ydd = String(yesterday.getDate()).padStart(2, "0");
const prevStr = `${yyyyy}${ymm}${ydd}`;

// LZHファイルURL
const LZH_URL = (date) =>
  `https://www.boatrace.jp/owpc/pc/extra/data/kaisyuu/${date}.lzh`;

const LZH_PATH = (date) => path.join(dataDir, `${date}.lzh`);

const JSON_PATH = path.join(dataDir, "data.json");

console.log("🚀 公式LZHデータ取得を開始します...");

async function downloadFile(url, dest) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(dest, response.data);
    console.log(`✅ LZH保存完了: ${dest}`);
    return true;
  } catch {
    console.log(`⚠️ ダウンロード失敗: ${url}`);
    return false;
  }
}

async function fetchOfficialLZH() {
  const tryDates = [dateStr, prevStr];
  for (const date of tryDates) {
    const url = LZH_URL(date);
    const dest = LZH_PATH(date);
    console.log(`📥 ダウンロード試行: ${url}`);

    const ok = await downloadFile(url, dest);
    if (!ok) continue;

    // ダウンロードしたファイルがHTMLっぽくないか確認
    const head = fs.readFileSync(dest).subarray(0, 100).toString("utf-8");
    if (head.includes("<!DOCTYPE") || head.includes("<html")) {
      console.log(`⚠️ ${date}.lzh はLZH形式ではありません（HTMLの可能性）`);
      continue;
    }

    // LZH展開処理
    console.log("📦 LZHを展開中...");
    const extractDir = path.join(dataDir, "extracted");
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

    try {
      execSync(`7z e "${dest}" -o"${extractDir}" -y`);
      console.log("✅ LZH展開成功");

      // 展開されたファイル一覧取得
      const files = fs.readdirSync(extractDir).filter((f) => f.endsWith(".TXT"));
      if (files.length === 0) throw new Error("TXTファイルが見つかりません");

      const filePath = path.join(extractDir, files[0]);
      const raw = fs.readFileSync(filePath, "utf-8");

      // 解析（バイトデータ区切りなし → 固定長解析 or 簡易構文対応）
      const lines = raw
        .split(/\r?\n/)
        .filter((l) => l.trim() !== "")
        .map((l) => l.replace(/\s+/g, " "));

      const parsed = lines.map((line) => ({
        raw: line,
      }));

      const result = {
        updated: new Date().toISOString(),
        source: date,
        count: parsed.length,
        programs: parsed,
      };

      fs.writeFileSync(JSON_PATH, JSON.stringify(result, null, 2), "utf-8");
      console.log(`✅ JSON保存完了: ${JSON_PATH}`);
      return;
    } catch (err) {
      console.log(`❌ LZH解析失敗: ${err.message}`);
    }
  }

  console.log("❌ ダウンロード可能なLZHが見つかりません");
  process.exit(1);
}

// 実行
fetchOfficialLZH();