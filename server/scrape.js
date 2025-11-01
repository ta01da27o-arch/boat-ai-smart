// server/scrape.js
import puppeteer from "puppeteer";

export async function scrapeRaceListAndEntries(jcd, dateStr) {
  const listUrl = `https://www.boatrace.jp/owpc/pc/race/racelist?hd=${dateStr}&jcd=${jcd}`;
  console.log(`▶︎ URL: ${listUrl}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto(listUrl, { waitUntil: "networkidle2", timeout: 60000 });

  // レース一覧取得
  const raceLinks = await page.$$eval(".race_num a", as =>
    as.map(a => ({
      race: a.textContent.trim().replace("R", ""),
      link: a.href
    }))
  );

  const raceData = [];

  for (const r of raceLinks) {
    try {
      console.log(`  ├─📄 ${r.race}R 取得中...`);
      await page.goto(r.link, { waitUntil: "networkidle2", timeout: 60000 });

      const raceInfo = await page.evaluate(() => {
        const title = document.querySelector(".title1")?.textContent.trim() || "";
        const entries = [];
        document.querySelectorAll(".table1 tbody tr").forEach(tr => {
          const tds = tr.querySelectorAll("td");
          if (tds.length >= 8) {
            entries.push({
              艇: tds[0]?.textContent.trim(),
              級: tds[1]?.textContent.trim().split("\n")[0].trim(),
              選手名: tds[1]?.textContent.trim().split("\n").slice(-1)[0].trim(),
              F: tds[2]?.textContent.trim(),
              全国: tds[3]?.textContent.trim(),
              当地: tds[4]?.textContent.trim(),
              MT: tds[5]?.textContent.trim(),
              コース: tds[6]?.textContent.trim(),
              評価: tds[7]?.textContent.trim()
            });
          }
        });
        return { title, entries };
      });

      raceData.push({
        race: r.race,
        title: raceInfo.title,
        entries: raceInfo.entries
      });

    } catch (err) {
      console.log(`  ❌ ${r.race}R 失敗: ${err.message}`);
    }
  }

  await browser.close();
  return raceData;
}