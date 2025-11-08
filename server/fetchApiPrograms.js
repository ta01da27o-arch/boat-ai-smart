import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import iconv from "iconv-lite";
import { execSync } from "child_process";
import { parseLzhTextToJson } from "./parseLzhData.js";

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DATE_STR = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // 例: 20251108
const LZH_URL = `https://www.boatrace.jp/owpc/pc/extra/data/kaisyuu/${DATE_STR}.lzh`;
const LZH_FILE = path.join(DATA_DIR, `${DATE_STR}.lzh`);
const TXT_FILE = path.join(DATA_DIR, `${DATE_STR}.TXT`);
const OUTPUT_JSON = path.join(DATA_DIR, "data.json");

async function main() {
  console.log("🚀 公式LZHデータダウンロードを開始します...");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  try {
    const res = await fetch(LZH_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(LZH_FILE, Buffer.from(buffer));
    console.log(`✅ LZHファイル保存完了: ${LZH_FILE}`);
  } catch (e) {
    console.error("❌ LZHダウンロード失敗:", e.message);
    process.exit(1);
  }

  try {
    console.log("📦 LZHファイルを解凍します...");
    execSync(`7z e "${LZH_FILE}" -o"${DATA_DIR}" -y`);
    console.log(`✅ TXTファイル展開完了: ${TXT_FILE}`);
  } catch (e) {
    console.error("❌ LZH展開失敗:", e.message);
    process.exit(1);
  }

  try {
    console.log("🔍 データ解析中...");
    const sjisBuffer = fs.readFileSync(TXT_FILE);
    const utf8Text = iconv.decode(sjisBuffer, "Shift_JIS");
    const jsonData = parseLzhTextToJson(utf8Text);

    jsonData.updated = new Date().toISOString();
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON保存完了: ${OUTPUT_JSON}`);
  } catch (e) {
    console.error("❌ データ解析失敗:", e.message);
    process.exit(1);
  }
}

main();