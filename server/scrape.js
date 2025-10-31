import puppeteer from "puppeteer";
import { VENUE_CODES } from "./venues.js";

/**
 * venueName: 桐生, 戸田 など
 * return: [{raceTitle, entries:[{lane,name,st}], aiMain, aiSub}, ...]
 */
export async function scrapeVenue(venueName){
  const code = VENUE_CODES[venueName];
  if(!code) return [];

  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=&jcd=${code}&hd=${new Date().toISOString().slice(0,10).replace(/-/g,"")}`;
  const browser = await puppeteer.launch({args:["--no-sandbox","--disable-setuid-sandbox"]});
  const page = await browser.newPage();
  await page.goto(url, {waitUntil:"domcontentloaded"});

  const races = await page.evaluate(()=>{
    const raceEls = Array.from(document.querySelectorAll(".is-float-race")); // クラス名は公式サイトに合わせて変更
    return raceEls.map((el, i)=>{
      const entries = Array.from(el.querySelectorAll(".is-float-entry")).map(tr=>{
        return {
          lane: tr.querySelector(".lane")?.textContent.trim(),
          name: tr.querySelector(".name")?.textContent.trim(),
          st: tr.querySelector(".st")?.textContent.trim()
        };
      });
      return {
        raceTitle: `${i+1}R`,
        entries,
        aiMain: [], // 後でAI計算可能
        aiSub: []
      };
    });
  });

  await browser.close();
  return races;
}
