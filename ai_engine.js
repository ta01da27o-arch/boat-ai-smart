// server/ai_engine.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "data", "data.json");
const AI_PATH = path.join(__dirname, "data", "ai_results.json");
const LEARN_PATH = path.join(__dirname, "data", "ai_memory.json");

function safeReadJSON(pathname) {
  if (!fs.existsSync(pathname)) return {};
  return JSON.parse(fs.readFileSync(pathname, "utf-8"));
}

function analyzeRace(boats) {
  if (!boats?.length) return [];

  const scores = boats.map(b => {
    const score =
      b.racer_national_top_3_percent * 0.4 +
      b.racer_assigned_motor_top_3_percent * 0.4 +
      b.racer_assigned_boat_top_3_percent * 0.2;
    return { num: b.racer_boat_number, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const combos = [];
  for (let i = 0; i < scores.length; i++) {
    for (let j = 0; j < scores.length; j++) {
      for (let k = 0; k < scores.length; k++) {
        if (i !== j && j !== k && combos.length < 5) {
          const p =
            (scores[i].score + scores[j].score * 0.7 + scores[k].score * 0.5) / 3;
          combos.push({
            formation: `${scores[i].num}-${scores[j].num}-${scores[k].num}`,
            percent: Math.round(p * 10) / 10,
          });
        }
      }
    }
  }
  return combos;
}

function calcAccuracy(venue) {
  const races = venue?.programs || [];
  if (!races.length) return 0;

  const avg = races.reduce((sum, r) => {
    const m =
      r.boats.reduce((s, b) => s + b.racer_assigned_motor_top_3_percent, 0) /
      r.boats.length;
    return sum + m;
  }, 0);

  const rate = avg / races.length / 100;
  return Math.round(rate * 1000) / 10;
}

export function generateAIResults() {
  const data = safeReadJSON(DATA_PATH);
  const memory = safeReadJSON(LEARN_PATH);

  const programs = data.venues?.programs || [];
  const venues = {};

  for (const p of programs) {
    const key = p.race_stadium_number;
    if (!venues[key]) venues[key] = { programs: [] };
    venues[key].programs.push(p);
  }

  const aiResults = {};
  for (const [venueNum, venueData] of Object.entries(venues)) {
    aiResults[venueNum] = {
      accuracy: calcAccuracy(venueData),
      predictions: venueData.programs.map(p => ({
        race_number: p.race_number,
        ai_predictions: analyzeRace(p.boats),
      })),
    };
  }

  fs.writeFileSync(AI_PATH, JSON.stringify(aiResults, null, 2), "utf-8");
  fs.writeFileSync(LEARN_PATH, JSON.stringify(memory, null, 2), "utf-8");

  console.log("🤖 AI解析完了:", AI_PATH);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAIResults();
}