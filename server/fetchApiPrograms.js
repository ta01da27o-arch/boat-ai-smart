import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import iconv from "iconv-lite";
import { execSync } from "child_process";
import { parseLzhTextToJson } from "./parseLzhData.js";

const DATA_DIR = path.join(process.cwd(), "server", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const formatDate = (d) =>
  d.toISOString().slice(0, 10).replace(/-/g, "");

const todayStr = formatDate(today);
const yesterdayStr = formatDate(yesterday);

const OUTPUT_JSON = path.join(DATA_DIR, "data.json");

async function tryDownload(dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/extra/data/kaisyuu/${dateStr}.lzh`;
  const lzhPath = path.join(DATA_DIR, `${dateStr}.lzh`);
  console.log(`📥 ダウンロード試行: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    console.log(`⚠️ ${dateStr} のLZHは存在しません (HTTP ${res.status})`);
    return null;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(lzhPath, Buffer.from(buffer));
  console.log(`✅ LZH保存完了: ${lzhPath}`);
  return lzhPath;
}

async function extractAndParse(lzhPath) {
  try {
    console.log("📦 LZHを展開中...");
    execSync(`7z e "${lzhPath}" -o"${DATA_DIR}" -y`);
    const txtFile = fs
      .readdirSync(DATA_DIR)
      .find((f) => f.toLowerCase().endsWith(".txt"));

    if (!txtFile) throw new Error("TXTファイルが見つかりません");
    const txtPath = path.join(DATA_DIR, txtFile);
    console.log(`✅ 展開完了: ${txtPath}`);

    const sjisBuffer = fs.readFileSync(txtPath);
    const utf8Text = iconv.decode(sjisBuffer, "Shift_JIS");
    const jsonData = parseLzhTextToJson(utf8Text);
    jsonData.updated = new Date().toISOString();

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2));
    console.log(`✅ JSON保存完了: ${OUTPUT_JSON}`);
    return true;
  } catch (err) {
    console.error("❌ LZH解析失敗:", err.message);
    return false;
  }
}

async function main() {
  console.log("🚀 公式LZHデータ取得を開始します...");
  let lzhFile = await tryDownload(todayStr);

  if (!lzhFile || fs.statSync(lzhFile).size < 500) {
    console.log("⚠️ 当日データなし → 前日分に切替");
    lzhFile = await tryDownload(yesterdayStr);
  }

  if (!lzhFile) {
    console.error("❌ ダウンロード可能なLZHが見つかりません");
    process.exit(1);
  }

  const success = await extractAndParse(lzhFile);
  if (!success) {
    console.error("❌ データ取得に失敗しました");
    process.exit(1);
  }
}

main();