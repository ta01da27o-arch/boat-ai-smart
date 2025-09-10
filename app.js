// app.js
// フロントエンドのみ。data/*.json をサンプル外部データとして読み込みます。

// ----- 設定（色・艇順） -----
const BOAT_COLORS = {
  1: "#ffffff",
  2: "#000000",
  3: "#ff3333",
  4: "#1e73be",
  5: "#f7d843",
  6: "#2ea44f"
};
// 表示順は上から 1..6
const LANES = [1,2,3,4,5,6];

// ----- DOM -----
const windDirDisplay = document.getElementById("windDirDisplay");
const windButtons = document.querySelectorAll(".wind-buttons button");
const windSpeedInput = document.getElementById("windSpeed");
const windSpeedDisplay = document.getElementById("windSpeedDisplay");
const waveInput = document.getElementById("wave");
const waveDisplay = document.getElementById("waveDisplay");
const avgTableBody = document.querySelector("#avgTable tbody");
const recentTableBody = document.querySelector("#recentTable tbody");
const postStartSVG = document.getElementById("postStartSVG");
const markSVG = document.getElementById("markSVG");
const refreshBtn = document.getElementById("refreshBtn");
const resetBtn = document.getElementById("resetBtn");

// データ（初期表示のためのサンプル。外部JSONで上書き可能）
let avgPlayers = [
  {lane:1, playerId:"", avgST:0.18},
  {lane:2, playerId:"", avgST:0.11},
  {lane:3, playerId:"", avgST:0.09},
  {lane:4, playerId:"", avgST:0.12},
  {lane:5, playerId:"", avgST:0.14},
  {lane:6, playerId:"", avgST:0.10}
];
let recentData = [
  {lane:1, recentST:0.175},
  {lane:2, recentST:0.112},
  {lane:3, recentST:0.092},
  {lane:4, recentST:0.125},
  {lane:5, recentST:0.139},
  {lane:6, recentST:0.098}
];
let tilts = {1:0,2:0,3:0,4:0,5:0,6:0};

// ----- ユーティリティ -----
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function toFixedOrDash(v){ return (v==null||v==="") ? "--" : (Number(v).toFixed(3)); }

// ----- UI 初期化 -----
function initEnvUI(){
  windButtons.forEach(btn=>{
    btn.addEventListener("click", ()=> {
      windButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      windDirDisplay.innerText = btn.dataset.dir;
      renderAll();
    });
  });
  // default active
  windButtons[0].classList.add("active");

  windSpeedInput.addEventListener("input", ()=> {
    windSpeedDisplay.innerText = windSpeedInput.value + " m";
    renderAll();
  });
  waveInput.addEventListener("input", ()=> {
    waveDisplay.innerText = waveInput.value + " cm";
    renderAll();
  });
}

// ----- テーブルを作る（表の中に "画像(SVG)セル" を組み込む） -----
function renderTables(){
  // 平均ST表
  avgTableBody.innerHTML = "";
  avgPlayers.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td><input class='player-input' data-lane="${p.lane}" placeholder='選手番号' value="${p.playerId||''}"></td>
      <td><input class='player-input' data-avg="${p.lane}" value="${p.avgST}"></td>
      <td class='boat-cell'>${createBoatSVGForCell(p.avgST)}</td>
    `;
    avgTableBody.appendChild(tr);
  });

  // recentST表
  recentTableBody.innerHTML = "";
  recentData.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.lane}</td>
      <td><input class='input-tilt' data-tilt="${r.lane}" value="${tilts[r.lane]||''}" placeholder="チルト"></td>
      <td>${toFixedOrDash(r.recentST)}</td>
      <td class='boat-cell'>${createBoatSVGForCell(r.recentST)}</td>
    `;
    recentTableBody.appendChild(tr);
  });

  // 入力イベント
  document.querySelectorAll("[data-lane]").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const lane = Number(inp.dataset.lane);
      avgPlayers = avgPlayers.map(p=> p.lane===lane ? {...p, playerId: inp.value} : p);
    });
  });
  document.querySelectorAll("[data-avg]").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const lane = Number(inp.dataset.avg);
      const val = parseFloat(inp.value);
      avgPlayers = avgPlayers.map(p=> p.lane===lane ? {...p, avgST: isNaN(val)?null:val} : p);
      renderAll();
    });
  });
  document.querySelectorAll("[data-tilt]").forEach(inp=>{
    inp.addEventListener("input", e=>{
      const lane = Number(inp.dataset.tilt);
      const v = parseFloat(inp.value);
      tilts[lane] = isNaN(v)?0:v;
      renderAll();
    });
  });
}

// ----- セル内SVG（表中の画像）を作る -----
// ST（秒）を与えると、スタートラインを基準に艇の位置を左にずらして表示。
// スタートラインはセル内で右端に近い位置として表現。
function createBoatSVGForCell(st){
  const width = 160, height = 40;
  // マッピング：ST 0.05..0.30 -> offset px (0..80)
  const safe = (st==null || st==="") ? 0.13 : Number(st);
  const maxST = 0.35;
  const offsetPx = clamp((safe / maxST) * 80, 0, 80);
  // boats are top-down in cell, just one boat (no number)
  // create an inline SVG
  const svg = `
    <svg class="small-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <!-- start line -->
      <line x1="${width-60}" y1="0" x2="${width-60}" y2="${height}" stroke="#222" stroke-width="2" stroke-dasharray="6 4"/>
      <!-- boat (front triangular + body rect) -->
      <g transform="translate(${(width-60)-offsetPx-10}, ${height/2 - 10})">
        <polygon points="0,10 10,0 10,20" fill="#000" stroke="#000"/>
        <rect x="10" y="2" width="40" height="16" rx="3" ry="3" fill="#000" stroke="#000"/>
      </g>
    </svg>
  `;
  // color will be replaced later when rendering tables, so we keep generic and will tune based on lane by replacing fill afterwards
  return svg;
}

// Helper: create colored boat SVG string for given lane and x offset (for full diagrams)
function boatSVGString(lane, x, y, scale=1){
  const color = BOAT_COLORS[lane];
  // triangular bow + rectangular body, no number
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <polygon points="0,10 18,0 18,20" fill="${color}" stroke="#000"/>
      <rect x="18" y="2" width="60" height="16" rx="3" ry="3" fill="${color}" stroke="#000"/>
    </g>
  `;
}

// ----- スタートライン後の展開図を描く -----
// 仕様：スタートラインを左側に描き、各艇を右向きに配置。
// 配置は「速い順（STが小さい）」がより右。艇が重ならないよう縦方向に余裕を持たせる。
function renderPostStart(){
  const svgW = 1000, svgH = 420;
  const startX = 140; // スタートライン X
  // clear
  postStartSVG.innerHTML = '';
  // draw start line
  const ns = 'http://www.w3.org/2000/svg';
  let line = document.createElementNS(ns,"line");
  line.setAttribute("x1", startX);
  line.setAttribute("y1", 20);
  line.setAttribute("x2", startX);
  line.setAttribute("y2", svgH-20);
  line.setAttribute("stroke","#222");
  line.setAttribute("stroke-width","3");
  postStartSVG.appendChild(line);

  // compute ordering by recentST if available, else avgST
  const arr = LANES.map(l => {
    const recent = recentData.find(r=>r.lane===l)?.recentST;
    const avg = avgPlayers.find(p=>p.lane===l)?.avgST;
    const st = (recent != null) ? recent : (avg != null ? avg : 0.2);
    return {lane:l, st};
  }).sort((a,b)=> a.st - b.st); // small ST = faster

  // map st to x offset to right of startX. faster (smaller st) -> more right
  const minST = Math.min(...arr.map(a=>a.st));
  const maxST = Math.max(...arr.map(a=>a.st));
  const span = Math.max(0.12, maxST - minST);
  // for each, compute x
  arr.forEach((item, idx)=>{
    const rel = (maxST - item.st) / span; // 0..1, faster -> closer to 1
    const x = startX + 80 + rel * 700; // position to the right
    // y: arrange with vertical spacing to avoid overlap. Use fixed lane order vertical positions (top->bottom 1..6)
    const laneIndex = item.lane - 1;
    const baseY = 40 + laneIndex * 54;
    const y = baseY;
    // place boat
    postStartSVG.insertAdjacentHTML('beforeend', boatSVGString(item.lane, x, y, 0.9));
  });

  // draw labels (option)
  postStartSVG.insertAdjacentHTML('beforeend', `<text x="${startX-10}" y="16" font-size="12" text-anchor="end">スタートライン</text>`);
}

// ----- 1マーク旋回図を描く -----
// ターンマークを配置（右側寄り）。艇は「速い順で旋回を開始」。艇が重ならないよう弧に沿って配置。
function renderMark(){
  const svgW = 1000, svgH = 420;
  markSVG.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  // draw turn mark (triangle)
  const markCX = svgW * 0.75, markCY = svgH/2, markR = 28;
  const tri = document.createElementNS(ns,"polygon");
  // triangle pointing up
  const triPoints = `${markCX},${markCY - markR} ${markCX - markR},${markCY + markR} ${markCX + markR},${markCY + markR}`;
  tri.setAttribute("points", triPoints);
  tri.setAttribute("fill","#d32f2f");
  markSVG.appendChild(tri);

  // ordering same as postStart: fastest start first
  const arr = LANES.map(l => {
    const recent = recentData.find(r=>r.lane===l)?.recentST;
    const avg = avgPlayers.find(p=>p.lane===l)?.avgST;
    const st = (recent != null) ? recent : (avg != null ? avg : 0.2);
    return {lane:l, st};
  }).sort((a,b)=> a.st - b.st);

  // arrange boats on concentric arcs around markCX,markCY so they don't overlap
  const baseRadius = 48;
  arr.forEach((item, idx)=>{
    // angle: spread from -80deg to 80deg depending on index
    const angleDeg = -80 + (idx * 32); // idx 0..5 -> -80..~80
    const rad = angleDeg * Math.PI / 180;
    const radius = baseRadius + Math.floor(idx/2)*36 + (idx%2)*12;
    const bx = markCX + Math.cos(rad) * radius - 10; // -10 to center the boat shape
    const by = markCY + Math.sin(rad) * radius - 8;
    markSVG.insertAdjacentHTML('beforeend', boatSVGString(item.lane, bx, by, 0.8));
  });

  // small annotation
  markSVG.insertAdjacentHTML('beforeend', `<text x="${markCX}" y="${markCY - markR - 10}" text-anchor="middle" font-size="12" fill="#fff">1マーク</text>`);
}

// ----- テーブルのセル内SVG の色調整（テーブル作成時に SVG内の色は黒になっているため laneごとに色を差し替える） -----
// We'll regenerate table cells to include lane-specific colors.
// Simpler: replace each boat-cell content with lane-specific SVG created here.
function renderTableBoatCells(){
  // avg
  const avgRows = [...avgTableBody.querySelectorAll("tr")];
  avgRows.forEach((tr, i)=>{
    const lane = i+1;
    const avg = avgPlayers.find(p=>p.lane===lane)?.avgST;
    const cell = tr.querySelector(".boat-cell");
    if(cell){
      // create a lane-specific small svg
      const svg = smallBoatSVGForCell(lane, avg);
      cell.innerHTML = svg;
    }
  });
  // recent
  const recRows = [...recentTableBody.querySelectorAll("tr")];
  recRows.forEach((tr, i)=>{
    const lane = i+1;
    const recent = recentData.find(r=>r.lane===lane)?.recentST;
    const cell = tr.querySelector(".boat-cell");
    if(cell){
      const svg = smallBoatSVGForCell(lane, recent);
      cell.innerHTML = svg;
    }
  });
}
function smallBoatSVGForCell(lane, st){
  const width = 160, height = 40;
  const safe = (st==null||st==="") ? 0.13 : Number(st);
  const maxST = 0.35;
  const offsetPx = clamp((safe / maxST) * 80, 0, 80);
  const color = BOAT_COLORS[lane];
  return `
    <svg class="small-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <line x1="${width-60}" y1="0" x2="${width-60}" y2="${height}" stroke="#222" stroke-width="2" stroke-dasharray="6 4"/>
      <g transform="translate(${(width-60)-offsetPx-10}, ${height/2 - 10})">
        <polygon points="0,10 10,0 10,20" fill="${color}" stroke="#000"/>
        <rect x="10" y="2" width="40" height="16" rx="3" ry="3" fill="${color}" stroke="#000"/>
      </g>
    </svg>
  `;
}

// ----- 外部データ読み込み（サンプル） -----
// fetch /data/avg_players.json and /data/recent_st.json if present
async function fetchSampleData(){
  try{
    const avgResp = await fetch('data/avg_players.json');
    if(avgResp.ok){
      const avgJson = await avgResp.json();
      // expect array [{lane:1,playerId:"4649",avgST:0.15},...]
      if(Array.isArray(avgJson) && avgJson.length>=6) avgPlayers = avgJson;
    }
  }catch(e){ console.warn("avg load fail", e); }

  try{
    const recResp = await fetch('data/recent_st.json');
    if(recResp.ok){
      const recJson = await recResp.json();
      // expect array [{lane:1,recentST:0.151},...]
      if(Array.isArray(recJson) && recJson.length>=6) recentData = recJson;
    }
  }catch(e){ console.warn("recent load fail", e); }
}

// ----- レンダーの総合 -----
function renderAll(){
  renderTables();
  renderTableBoatCells();
  renderPostStart();
  renderMark();
}

// ----- リセット -----
function resetAll(){
  avgPlayers = [
    {lane:1, playerId:"", avgST:0.18},
    {lane:2, playerId:"", avgST:0.11},
    {lane:3, playerId:"", avgST:0.09},
    {lane:4, playerId:"", avgST:0.12},
    {lane:5, playerId:"", avgST:0.14},
    {lane:6, playerId:"", avgST:0.10}
  ];
  recentData = [
    {lane:1, recentST:0.175},
    {lane:2, recentST:0.112},
    {lane:3, recentST:0.092},
    {lane:4, recentST:0.125},
    {lane:5, recentST:0.139},
    {lane:6, recentST:0.098}
  ];
  tilts = {1:0,2:0,3:0,4:0,5:0,6:0};
  document.querySelectorAll(".player-input").forEach(i=>i.value="");
  document.querySelectorAll(".input-tilt").forEach(i=>i.value="");
  renderAll();
}

// ----- 初期化 -----
async function init(){
  initEnvUI();
  await fetchSampleData();
  renderAll();

  refreshBtn.addEventListener("click", async ()=>{
    await fetchSampleData();
    renderAll();
  });
  resetBtn.addEventListener("click", ()=>{
    resetAll();
  });
}

// run
init();