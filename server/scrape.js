// server/scrape.js
import puppeteer from "puppeteer";

export async function scrapeRaceListAndEntries(jcd, dateStr) {
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${dateStr}&jcd=${jcd}`;
  console.log(`▶︎ URL: ${url}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const races = await page.$$eval("div.table1 div.is-fs12 a", (links) =>
    links.map((a) => {
      const href = a.getAttribute("href");
      const text = a.textContent.trim();
      return { text, href };
    })
  );

  const results = [];
  for (const race of races) {
    try {
      const raceUrl = `https://www.boatrace.jp${race.href}`;
      await page.goto(raceUrl, { waitUntil: "networkidle2", timeout: 60000 });

      const title = await page.$eval("h2.heading1_titleName", el => el.textContent.trim());
      const table = await page.$$eval("table.is-w495 tr", rows =>
        rows.map(row =>
          Array.from(row.querySelectorAll("td")).map(td => td.textContent.trim())
        )
      );

      results.push({ race: race.text, title, table });
    } catch (e) {
      console.error(`❌ レース ${race.text} 読み込み失敗: ${e.message}`);
    }
  }

  await browser.close();
  return results;
}