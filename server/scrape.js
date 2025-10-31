import puppeteer from "puppeteer";
import cheerio from "cheerio";

/**
 * 指定された会場の出走表を取得
 * @param {string} venue
 * @returns {Promise<Array>} races
 */
export async function fetchVenueRaces(venue) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"], headless: true });
  const page = await browser.newPage();

  // 公式サイトURL（日付はYYYYMMDD形式）
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=&jcd=${venue}&hd=${dateStr}`;
  
  await page.goto(url, { waitUntil: "networkidle2" });
  const html = await page.content();
  const $ = cheerio.load(html);

  const races = [];

  $(".is-future").each((i, el) => {
    const entries = [];
    $(el).find("tr").each((j, row) => {
      const tds = $(row).find("td");
      if(tds.length > 0){
        entries.push({
          lane: $(tds[0]).text().trim(),
          name: $(tds[1]).text().trim(),
          st: $(tds[2]).text().trim()
        });
      }
    });
    races.push({ raceTitle: `${i+1}R`, entries });
  });

  await browser.close();
  return races;
}
