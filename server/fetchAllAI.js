import fs from "fs";
import { VENUES } from "./venues.js";
import { scrapeVenue } from "./scrape.js";

const DATA_PATH = "./data/data.json";
const HISTORY_PATH = "./data/history.json";

async function fetchAll(){
  const data = {venues:{}};
  for(const venue of VENUES){
    console.log(`Fetching: ${venue}`);
    const races = await scrapeVenue(venue);
    data.venues[venue] = races;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

  // history.jsonは最新レースのダミーデータ
  const recent = [
    {rank:1,lane:1,name:"山田太郎",st:"0.12"},
    {rank:2,lane:2,name:"鈴木一郎",st:"0.14"},
    {rank:3,lane:3,name:"佐藤次郎",st:"0.15"},
  ];
  fs.writeFileSync(HISTORY_PATH, JSON.stringify({recent}, null, 2));
  console.log("✅ data.json & history.json saved");
}

fetchAll();
