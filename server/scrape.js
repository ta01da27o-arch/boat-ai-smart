import puppeteer from "puppeteer";
import {VENUES} from "./venues.js";

/**
 * venueName: 桐生, 戸田 など
 * return: {raceTitle: "1R", entries: [{lane,name,st}, ...], aiMain:[], aiSub:[]}
 */
export async function scrapeVenue(venueName){
  const browser = await puppeteer.launch({args:["--no-sandbox","--disable-setuid-sandbox"]});
  const page = await browser.newPage();
  
  const url = `https://www.boatrace.jp/owpc/pc/race/racelist?rno=&jcd=${venueName}&hd=${new Date().toISOString().slice(0,10).replace(/-/g,"")}`;
  await page.goto(url, {waitUntil:"domcontentloaded"});

  // cheerio風に取得
  const content = await page.content();
  await browser.close();

  // 仮に空の出走表（ダミー）を返す
  // 実際は cheerio や puppeteer evaluate で HTMLから entries抽出
  const races = [];
  for(let i=1;i<=12;i++){
    races.push({
      raceTitle: `${i}R`,
      entries:[
        {lane:1,name:"山田太郎",st:"0.12"},
        {lane:2,name:"鈴木一郎",st:"0.14"},
        {lane:3,name:"佐藤次郎",st:"0.15"},
      ],
      aiMain:[{bet:"1-2",prob:35},{bet:"1-3",prob:25}],
      aiSub:[{bet:"2-3",prob:15},{bet:"3-1",prob:10}]
    });
  }
  return races;
    }
