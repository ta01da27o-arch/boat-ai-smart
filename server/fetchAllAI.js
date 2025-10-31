import fs from "fs";
import { VENUES } from "./venues.js";
import { scrapeVenue } from "./scrape.js";

const DATA_PATH = "./data/data.json";
const HISTORY_PATH = "./data/history.json";

async function fetchAll(){
  const data = {venues:{}};

  for(const venue of VENUES){
    console.log(`Fetching: ${venue}`);
    try {
      const races = await scrapeVenue(venue);
      data.venues[venue] = races;
    } catch(e){
      console.error(`❌ Error fetching ${venue}:`, e);
      data.venues[venue] = [];
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

  // 最新レース結果（各場1Rの1-3位のみダミー）
  const recent = [];
  VENUES.forEach(v=>{
    const race = data.venues[v]?.[0];
    if(race && race.entries){
      recent.push(...race.entries.slice(0,3).map((e,i)=>({
        rank: i+1,
        lane: e.lane,
        name: e.name,
        st: e.st
      })));
    }
  }));
  fs.writeFileSync(HISTORY_PATH, JSON.stringify({recent}, null, 2));
  console.log("✅ data.json & history.json saved");
}

fetchAll();
