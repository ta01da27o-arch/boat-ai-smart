// server/scrape.js
import puppeteer from "puppeteer";

export async function scrapeRaceListAndEntries(jcd, dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${dateStr}&jcd=${jcd}`;
  console.log(`▶︎ URL: ${url}`);

  // Puppeteer設定（GitHub Actions対応）
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  // 動的レンダリング完了を待機
  await page.waitForSelector("div.table1", { timeout: 15000 }).catch(() => null);

  // レース一覧取得
  const races = await page.$$eval("div.table1 div.is-fs12 a", (links) =>
    links.map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute("href")
    }))
  );

  const results = [];
  for (const race of races) {
    try {
      const raceUrl = `https://www.boatrace.jp${race.href}`;
      await page.goto(raceUrl, { waitUntil: "networkidle2", timeout: 60000 });

      const title = await page.$eval("h2.heading1_titleName", el => el.textContent.trim());
      const rows = await page.$$eval("table.is-w495 tr", (trs) =>
        trs.map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim())
        )
      );

      results.push({ race: race.text, title, entries: rows });
    } catch (e) {
      console.error(`❌ レース ${race.text} 読み込み失敗: ${e.message}`);
    }
  }

  await browser.close();
  return results;
}