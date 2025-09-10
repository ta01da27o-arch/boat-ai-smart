/* app.js
 - data.json を fetch して表と 2 つの Canvas (start / mark) を描画します
 - 要点:
   * ボート形は「船首が右向き」SVG を各セルと Canvas 上に描画
   * 色は固定 (1:white,2:black,3:red,4:blue,5:yellow,6:green)
   * 上から 1..6 の順で表示
   * スタート後図はスタートラインを左側に描き、ST の速い順（小さい値）を右方向に配置（速いほど右）
   * 1マーク図はターンマークを左寄り（画面幅の約33%）に配置し、速い順で内側から旋回配置
*/

const ID = {
  avgTableBody: '#avgTable tbody',
  recentTableBody: '#recentTable tbody',
  postStartCanvas: '#postStartCanvas',
  markCanvas: '#markCanvas',
  windButtons: '.wind-btn',
  windDir: '#windDir',
  windSpeed: '#windSpeed',
  windSpeedVal: '#windSpeedVal',
  waveHeight: '#waveHeight',
  waveHeightVal: '#waveHeightVal',
  reloadBtn: '#reloadBtn',
  resetBtn: '#resetBtn'
};

const BOAT_COLORS = {1:'#ffffff',2:'#000000',3:'#ff3333',4:'#1e73be',5:'#f7d843',6:'#2ea44f'};
let dataModel = { avg: [], recent: [] };

/* helper formatting */
const fmt = v => (v==null ? '--' : Number(v).toFixed(3));

/* fetch data.json */
async function loadData(){
  try{
    const res = await fetch('data.json', {cache: 'no-store'});
    if(!res.ok) throw new Error('data.json fetch failed');
    const j = await res.json();
    // Expect structure: { avg: [{lane:1,playerId:"",avgST:0.12},...], recent:[{lane:1,recentST:0.11,tilt:2.5},...] }
    dataModel.avg = (j.avg || []).slice(0,6);
    dataModel.recent = (j.recent || []).slice(0,6);
    // Normalize ensure lanes 1..6 exist
    for(let i=1;i<=6;i++){
      if(!dataModel.avg.find(x=>x.lane===i)) dataModel.avg[i-1] = {lane:i, playerId:'', avgST:null};
      if(!dataModel.recent.find(x=>x.lane===i)) dataModel.recent[i-1] = {lane:i, recentST:null, tilt:null};
    }
  }catch(e){
    console.warn(e);
    // fallback sample
    dataModel.avg = [
      {lane:1, playerId:'4649', avgST:0.150},
      {lane:2, playerId:'1234', avgST:0.112},
      {lane:3, playerId:'2222', avgST:0.095},
      {lane:4, playerId:'3333', avgST:0.121},
      {lane:5, playerId:'4444', avgST:0.138},
      {lane:6, playerId:'5555', avgST:0.098}
    ];
    dataModel.recent = [
      {lane:1, recentST:0.148, tilt:2.5},
      {lane:2, recentST:0.110, tilt:2.0},
      {lane:3, recentST:0.094, tilt:2.5},
      {lane:4, recentST:0.123, tilt:2.0},
      {lane:5, recentST:0.136, tilt:2.5},
      {lane:6, recentST:0.097, tilt:2.0}
    ];
  }
}

/* create inline boat SVG (right-facing) for table cells */
function boatCellSVG(lane, st){
  const color = BOAT_COLORS[lane] || '#999';
  const width = 140, height = 36;
  // map ST to offset: st smaller -> closer to startline (right). We'll draw startline at x = width - 50, and boat offset from it to left by ratio
  const startX = width - 50;
  const maxST = 0.35;
  const safe = (st==null ? 0.13 : Number(st));
  const offset = Math.max(0, Math.min(80, Math.round((safe / maxST) * 80)));
  const bx = startX - offset - 10; // boat left
  // boat shape: triangular bow + rectangular body
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${startX}" y1="0" x2="${startX}" y2="${height}" stroke="#222" stroke-width="2" stroke-dasharray="6 4"/>
      <g transform="translate(${bx},${(height-18)/2})">
        <polygon points="0,9 10,0 10,18" fill="${color}" stroke="#000"/>
        <rect x="10" y="1" width="50" height="16" rx="3" fill="${color}" stroke="#000"/>
      </g>
    </svg>`;
}

/* render tables */
function renderTables(){
  const avgBody = document.querySelector(ID.avgTableBody);
  const recentBody = document.querySelector(ID.recentTableBody);
  avgBody.innerHTML = '';
  recentBody.innerHTML = '';
  for(let i=1;i<=6;i++){
    const avg = dataModel.avg.find(x=>x.lane===i) || {lane:i,playerId:'',avgST:null};
    const rec = dataModel.recent.find(x=>x.lane===i) || {lane:i,recentST:null,tilt:null};
    // avg row
    const trA = document.createElement('tr');
    trA.innerHTML = `
      <td>${i}</td>
      <td><input class="player-input" data-lane="${i}" value="${avg.playerId || ''}" /></td>
      <td><input class="avg-input" data-lane="${i}" value="${avg.avgST == null ? '' : Number(avg.avgST).toFixed(3)}" /></td>
      <td class="boat-cell">${boatCellSVG(i, avg.avgST)}</td>
    `;
    avgBody.appendChild(trA);
    // recent row
    const trR = document.createElement('tr');
    trR.innerHTML = `
      <td>${i}</td>
      <td><input class="tilt-input" data-lane="${i}" value="${rec.tilt == null ? '' : rec.tilt}" /></td>
      <td>${fmt(rec.recentST)}</td>
      <td class="boat-cell">${boatCellSVG(i, rec.recentST)}</td>
    `;
    recentBody.appendChild(trR);
  }

  // attach handlers for editable inputs
  document.querySelectorAll('.player-input').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const lane = Number(inp.dataset.lane);
      const p = dataModel.avg.find(x=>x.lane===lane);
      if(p) p.playerId = inp.value;
    });
  });
  document.querySelectorAll('.avg-input').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const lane = Number(inp.dataset.lane);
      const v = parseFloat(inp.value);
      const p = dataModel.avg.find(x=>x.lane===lane);
      if(p) p.avgST = isNaN(v) ? null : v;
      renderTables(); // re-render to update cell svg mapping
      drawPostStart(); drawMark();
    });
  });
  document.querySelectorAll('.tilt-input').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const lane = Number(inp.dataset.lane);
      const v = parseFloat(inp.value);
      const r = dataModel.recent.find(x=>x.lane===lane);
      if(r) r.tilt = isNaN(v) ? null : v;
      drawPostStart(); drawMark();
    });
  });
}

/* Canvas helpers: devicePixelRatio scaling */
function scaleCanvasToDisplaySize(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }
  return false;
}

/* Draw boat on canvas at (x,y) with given height (boatHeight), color, orientation right */
function drawBoat(ctx, x, y, boatHeight, lane){
  const color = BOAT_COLORS[lane] || '#999';
  // calculate dims
  const h = boatHeight;
  const bowW = Math.round(h * 0.6); // triangle width
  const bodyW = Math.round(h * 2.2); // rect width
  const totalW = bowW + bodyW;
  const top = y - h/2;
  // triangle bow
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(1, h*0.06);
  ctx.beginPath();
  ctx.moveTo(x, top + h/2);
  ctx.lineTo(x + bowW, top);
  ctx.lineTo(x + bowW, top + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // rect body
  ctx.fillRect(x + bowW, top + h*0.06, bodyW, h*0.88);
  ctx.strokeRect(x + bowW, top + h*0.06, bodyW, h*0.88);
  return totalW;
}

/* Draw Start-after diagram:
   - start line at x = 10% of width
   - use ST (recent if available else avg) to determine order: faster (smaller ST) => placed more right
   - vertical placement fixed by lane order (1..6 top->bottom)
   - boat size proportion: use 60% of cell height (as requested) where cellHeight = canvasHeight / 6
*/
function drawPostStart(){
  const canvas = document.querySelector(ID.postStartCanvas);
  scaleCanvasToDisplaySize(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth, H = canvas.clientHeight;
  ctx.clearRect(0,0,W,H);
  // start line
  const startX = Math.round(W * 0.12);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(startX, 4); ctx.lineTo(startX, H-4); ctx.stroke();

  // collect STs
  const arr = [];
  for(let i=1;i<=6;i++){
    const rec = dataModel.recent.find(x=>x.lane===i);
    const avg = dataModel.avg.find(x=>x.lane===i);
    const st = (rec && rec.recentST != null) ? rec.recentST : (avg && avg.avgST != null ? avg.avgST : 0.15);
    arr.push({lane:i, st});
  }
  // compute min/max for mapping
  const sts = arr.map(a=>a.st);
  const minST = Math.min(...sts), maxST = Math.max(...sts);
  const span = Math.max(0.03, maxST - minST);

  // compute vertical slot
  const slotH = H / 6;
  const boatH = slotH * 0.6; // 60% of slot height
  arr.forEach(item=>{
    // position: map st to rel (0..1) where smaller st -> larger rel
    const rel = (maxST - item.st) / span; // faster -> closer to 1
    const x = startX + 30 + rel * (W - startX - 60);
    const y = slotH * (item.lane - 0.5);
    drawBoat(ctx, x, y, boatH, item.lane);
  });
}

/* Draw 1-mark rotation diagram:
   - place turn mark at x = ~33% of width (leftish but not edge) so rotating boats end near center
   - order boats by ST ascending (faster first), assign them to arcs: fastest inner radius
   - orient boats generally to the right (we keep shape right-oriented)
*/
function drawMark(){
  const canvas = document.querySelector(ID.markCanvas);
  scaleCanvasToDisplaySize(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth, H = canvas.clientHeight;
  ctx.clearRect(0,0,W,H);

  // turn mark at left-ish (approx 33% of width), vertically center
  const markX = Math.round(W * 0.33);
  const markY = Math.round(H * 0.5);
  // draw triangular mark (pointing up)
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath();
  ctx.moveTo(markX, markY - 28);
  ctx.lineTo(markX - 28, markY + 28);
  ctx.lineTo(markX + 28, markY + 28);
  ctx.closePath();
  ctx.fill();

  // collect STs and sort by st ascending (fastest first)
  const arr = [];
  for(let i=1;i<=6;i++){
    const rec = dataModel.recent.find(x=>x.lane===i);
    const avg = dataModel.avg.find(x=>x.lane===i);
    const st = (rec && rec.recentST != null) ? rec.recentST : (avg && avg.avgST != null ? avg.avgST : 0.15);
    arr.push({lane:i, st});
  }
  arr.sort((a,b)=>a.st - b.st);

  // place boats on arcs around mark; assign angles so boats are around center area
  // angles spread from -60deg to +60deg
  const angleStart = -60 * Math.PI/180;
  const angleEnd = 60 * Math.PI/180;
  const arcCount = arr.length;
  const boatBaseH = (H / 6) * 0.6; // similar size to other diagram
  arr.forEach((item, idx) => {
    const t = idx / (arcCount - 1 || 1);
    const angle = angleStart + t * (angleEnd - angleStart);
    // radius: inner for faster (smaller idx), increase with index
    const radius = 40 + idx * 28;
    const bx = markX + Math.cos(angle) * radius - 10;
    const by = markY + Math.sin(angle) * radius - (boatBaseH/2);
    drawBoat(ctx, bx, by + (boatBaseH/2), boatBaseH, item.lane);
  });
}

/* UI bindings */
function initUI(){
  // wind buttons
  document.querySelectorAll(ID.windButtons).forEach(btn=>{
    btn.addEventListener('click', e=>{
      document.querySelectorAll(ID.windButtons).forEach(b=>b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const d = e.currentTarget.dataset.dir;
      document.querySelector(ID.windDir).textContent = d;
    });
  });
  // wind speed / wave
  const windSpeedEl = document.querySelector(ID.windSpeed);
  const windSpeedVal = document.querySelector(ID.windSpeedVal);
  windSpeedEl.addEventListener('input', ()=> windSpeedVal.textContent = (windSpeedEl.value ? windSpeedEl.value + ' m' : '-'));
  const waveEl = document.querySelector(ID.waveHeight);
  const waveVal = document.querySelector(ID.waveHeightVal);
  waveEl.addEventListener('input', ()=> waveVal.textContent = (waveEl.value ? waveEl.value + ' cm' : '-'));

  // reload & reset
  document.querySelector(ID.reloadBtn).addEventListener('click', async ()=>{
    await loadData();
    renderTables();
    drawPostStart();
    drawMark();
  });
  document.querySelector(ID.resetBtn).addEventListener('click', ()=>{
    // reload original
    window.location.reload();
  });

  // initial active wind button
  const firstWind = document.querySelector(ID.windButtons);
  if(firstWind) firstWind.classList.add('active');
}

/* main render entry */
async function renderAll(){
  await loadData();
  renderTables();
  // draw diagrams after small timeout to let CSS compute sizes
  setTimeout(()=>{
    drawPostStart();
    drawMark();
  }, 50);
}

/* draw wrappers */
function drawPostStart(){ drawPostStart = drawPostStartImpl(); } // placeholder (we'll define real function later)
function drawMark(){ drawMark = drawMarkImpl(); }

/* Immediately redefine draw functions (workaround to keep hoisting simple) */
function drawPostStartImpl(){
  return function(){ /* replaced above; call actual function below */ };
}
function drawMarkImpl(){
  return function(){};
}

/* But we'll set them to actual implementations (assign real functions) */
drawPostStart = drawPostStart.bind(null);
drawMark = drawMark.bind(null);

/* Start up */
initUI();
renderAll();