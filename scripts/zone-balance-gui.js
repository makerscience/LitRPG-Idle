#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AREAS_PATH = path.join(ROOT, 'src', 'data', 'areas.js');
const BALANCE_PATH = path.join(ROOT, 'src', 'data', 'balance.js');
const SIM_PATH = path.join(ROOT, 'scripts', 'balance-sim.js');
const DUMP_PATH = path.join(__dirname, 'dump-zone-data.mjs');
const PORT = 3001;

const AREA_MAP = [
  { id: 1, name: 'The Harsh Threshold', zones: [1, 10] },
  { id: 2, name: 'The Overgrown Frontier', zones: [11, 15] },
  { id: 3, name: 'The Broken Road', zones: [16, 30] },
];
const TOTAL_ZONES = 30;

function parseZoneBalance(fileText) {
  const out = {};
  const m = fileText.match(/export const ZONE_BALANCE = \{([\s\S]*?)\n\};/);
  if (!m) return out;
  const re = /(\d+):\s*\{([^}]*)\}/g;
  let em;
  while ((em = re.exec(m[1])) !== null) {
    const zone = parseInt(em[1], 10);
    const stats = {};
    const kvRe = /(\w+):\s*([+-]?\d+(?:\.\d+)?)/g;
    let kv;
    while ((kv = kvRe.exec(em[2])) !== null) stats[kv[1]] = parseFloat(kv[2]);
    if (Object.keys(stats).length) out[zone] = stats;
  }
  return out;
}

function parseZoneScaling(fileText) {
  const out = {};
  const m = fileText.match(/export const ZONE_SCALING = \{([\s\S]*?)\};/);
  if (!m) return out;
  const kvRe = /(\w+):\s*([+-]?\d+(?:\.\d+)?)/g;
  let kv;
  while ((kv = kvRe.exec(m[1])) !== null) out[kv[1]] = parseFloat(kv[2]);
  return out;
}

function formatZoneBlock(balance) {
  const lines = Object.keys(balance).map(Number).sort((a, b) => a - b).map((z) => {
    const pairs = Object.entries(balance[z]).filter(([, v]) => Math.abs(v - 1) > 0.0001)
      .map(([k, v]) => `${k}: ${parseFloat(v.toFixed(2))}`).join(', ');
    return pairs ? `  ${z}: { ${pairs} },` : null;
  }).filter(Boolean);
  return lines.length ? `{\n${lines.join('\n')}\n}` : '{\n}';
}

function saveZoneBalance(balance) {
  const text = fs.readFileSync(AREAS_PATH, 'utf8');
  const updated = text.replace(
    /export const ZONE_BALANCE = \{[\s\S]*?\n\};/,
    `export const ZONE_BALANCE = ${formatZoneBlock(balance)};`,
  );
  fs.writeFileSync(AREAS_PATH, updated, 'utf8');
}

function parseEntityBalance(fileText, mapName) {
  const out = {};
  const m = fileText.match(new RegExp(`export const ${mapName} = \\{([\\s\\S]*?)\\n\\};`));
  if (!m) return out;
  const re = /['"]([^'"]+)['"]:\s*\{([^}]*)\}/g;
  let em;
  while ((em = re.exec(m[1])) !== null) {
    const stats = {};
    const kvRe = /(\w+):\s*([+-]?\d+(?:\.\d+)?)/g;
    let kv;
    while ((kv = kvRe.exec(em[2])) !== null) stats[kv[1]] = parseFloat(kv[2]);
    if (Object.keys(stats).length) out[em[1]] = stats;
  }
  return out;
}

function formatEntityBalance(map, mapName) {
  const lines = Object.keys(map).sort().map((id) => {
    const pairs = Object.entries(map[id]).filter(([, v]) => Math.abs(v - 1) > 0.0001)
      .map(([k, v]) => `${k}: ${parseFloat(v.toFixed(2)).toFixed(2)}`).join(', ');
    return pairs ? `  '${id}': { ${pairs} },` : null;
  }).filter(Boolean);
  return `export const ${mapName} = {\n${lines.join('\n')}\n};`;
}

function scaffoldBalanceFile() {
  return `// Per-entity stat multipliers applied on top of zone scaling.
// Sparse map format: { entityId: { stat: multiplier } }
// Missing entity/stat defaults to 1.0.

export const ENEMY_BALANCE = {
};

export const BOSS_BALANCE = {
};

export function getEnemyBias(enemyId, stat) {
  return ENEMY_BALANCE[enemyId]?.[stat] ?? 1.0;
}

export function getBossBias(bossId, stat) {
  return BOSS_BALANCE[bossId]?.[stat] ?? 1.0;
}
`;
}

function saveEntityBalance(enemyBalance, bossBalance) {
  let text = fs.existsSync(BALANCE_PATH) ? fs.readFileSync(BALANCE_PATH, 'utf8') : scaffoldBalanceFile();
  const replaceOrAppend = (src, mapName, block) => {
    const re = new RegExp(`export const ${mapName} = \\{[\\s\\S]*?\\n\\};`);
    return re.test(src) ? src.replace(re, block) : `${src}\n${block}\n`;
  };
  text = replaceOrAppend(text, 'ENEMY_BALANCE', formatEntityBalance(enemyBalance, 'ENEMY_BALANCE'));
  text = replaceOrAppend(text, 'BOSS_BALANCE', formatEntityBalance(bossBalance, 'BOSS_BALANCE'));
  fs.writeFileSync(BALANCE_PATH, text, 'utf8');
}

let entityCache = null;
function loadEntityData() {
  if (entityCache) return Promise.resolve(entityCache);
  return new Promise((resolve, reject) => {
    exec(`node "${DUMP_PATH}"`, { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      try {
        entityCache = JSON.parse(stdout);
        resolve(entityCache);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function handleApi(req, res) {
  if (req.method === 'GET' && req.url === '/api/data') {
    const text = fs.readFileSync(AREAS_PATH, 'utf8');
    sendJson(res, { balance: parseZoneBalance(text), scaling: parseZoneScaling(text), areas: AREA_MAP });
    return;
  }
  if (req.method === 'GET' && req.url === '/api/entity-data') {
    loadEntityData().then((d) => sendJson(res, d)).catch((e) => sendJson(res, { ok: false, error: e.message }, 500));
    return;
  }
  if (req.method === 'GET' && req.url === '/api/balance-data') {
    const text = fs.existsSync(BALANCE_PATH) ? fs.readFileSync(BALANCE_PATH, 'utf8') : '';
    sendJson(res, {
      enemyBalance: parseEntityBalance(text, 'ENEMY_BALANCE'),
      bossBalance: parseEntityBalance(text, 'BOSS_BALANCE'),
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/api/save') {
    readBody(req).then((b) => {
      saveZoneBalance(b.balance || {});
      sendJson(res, { ok: true });
    }).catch((e) => sendJson(res, { ok: false, error: e.message }, 400));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/save-balance') {
    readBody(req).then((b) => {
      saveEntityBalance(b.enemyBalance || {}, b.bossBalance || {});
      sendJson(res, { ok: true });
    }).catch((e) => sendJson(res, { ok: false, error: e.message }, 400));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/sim') {
    exec(`node "${SIM_PATH}"`, { cwd: ROOT }, (err, stdout, stderr) => {
      sendJson(res, { ok: !err, output: stdout || stderr || '' });
    });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end('Not found');
}

const AREAS_JSON = JSON.stringify(AREA_MAP);
const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>Balance GUI</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#1a1a2e;color:#ddd;font:12px monospace}
header{position:sticky;top:0;z-index:5;background:#16213e;border-bottom:2px solid #0f3460;padding:10px 12px;display:flex;gap:8px;flex-wrap:wrap}
h1{margin:0;font-size:14px;color:#e94560;flex:1}
button{background:#0f3460;color:#ddd;border:1px solid #e94560;border-radius:3px;padding:5px 10px;font:12px monospace;cursor:pointer}
button:hover{background:#e94560}.success{background:#2d6a4f!important;border-color:#52b788!important}
.rates{width:100%;color:#aaa}.tabs{display:flex;gap:4px;padding:8px 12px;background:#111;border-bottom:1px solid #2a2a2a}
.tab-btn{background:#1e1e1e;color:#888;border:none;padding:6px 14px}.tab-btn.active{background:#2a4a2a;color:#7abf7a}
.tab-panel{display:none}.tab-panel.active{display:block}
.sparks{display:flex;gap:8px;padding:8px 12px;background:#0f1a2e;border-bottom:1px solid #0f3460;flex-wrap:wrap}
.spark{display:flex;flex-direction:column;align-items:center;gap:2px}.spark span{font-size:10px;color:#888}
.wrap{overflow-x:auto;overflow-y:visible;padding:0 8px 12px}
table{border-collapse:collapse;width:100%;min-width:760px}
th{position:static;background:#16213e;color:#e94560;padding:4px 6px;border-bottom:1px solid #0f3460}
td{padding:2px 3px;border-bottom:1px solid #1e1e3a;text-align:center}
.stat{width:78px}.name{text-align:left;padding-left:8px;min-width:180px}.meta{font-size:10px;color:#888}
.areahead td{text-align:left;padding:5px 8px;background:#0f1a2e;color:#7a9cc5;border-top:2px solid #0f3460;border-bottom:1px solid #0f3460}
.zone{font-weight:bold;color:#aaa}
#zones thead th:nth-child(1){width:54px;min-width:54px;max-width:54px}
#zones thead th:nth-child(2){width:64px;min-width:64px;max-width:64px}
#zones thead th:nth-child(n+3){width:78px;min-width:78px;max-width:78px}
#zones tbody tr:not(.areahead) td:nth-child(1){width:54px;min-width:54px;max-width:54px;white-space:nowrap}
#zones tbody tr:not(.areahead) td:nth-child(2){width:64px;min-width:64px;max-width:64px;white-space:nowrap}
#zones table{table-layout:fixed}
.cell{display:flex;flex-direction:column;align-items:center;gap:2px}
input[type=range]{-webkit-appearance:none;width:68px;height:4px;border:none;border-radius:2px;background:#333}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;background:#d0d0d0;border:1px solid #888}
input[type=range]::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#d0d0d0;border:1px solid #888}
.read{font-size:10px;color:#bbb;cursor:pointer}.read:hover{color:#fff;text-decoration:underline}
.in{width:52px;padding:1px 3px;background:#0f0f1a;color:#ddd;border:1px solid #52b788;border-radius:2px;text-align:center;font:11px monospace}
.mini,.elite,.area{font-size:9px;padding:1px 5px;border-radius:2px}.mini{background:#303030;color:#999}.elite{background:#2e2810;color:#d4a830}.area{background:#2e1010;color:#d46060}
#sim{display:none;background:#0a0a1a;border-top:2px solid #0f3460;padding:10px 12px}#sim pre{white-space:pre;max-height:500px;overflow:auto}
</style></head><body>
<header><h1>Balance Dials</h1><button id="save">Save to areas.js</button><button id="simbtn">Run Sim</button><button id="copy">Copy Code</button><div id="rates" class="rates">Loading...</div></header>
<div class="tabs"><button class="tab-btn active" data-tab="zones">Zones</button><button class="tab-btn" data-tab="enemies">Enemies</button><button class="tab-btn" data-tab="bosses">Bosses</button></div>
<div id="zones" class="tab-panel active"><div id="sparks" class="sparks"></div><div class="wrap"><table><thead><tr><th>Zone</th><th>Area</th><th>hp</th><th>atk</th><th>def</th><th>speed</th><th>regen</th><th>gold</th><th>xp</th></tr></thead><tbody id="zbody"></tbody></table></div></div>
<div id="enemies" class="tab-panel"><div class="wrap"><table><thead><tr><th>Name</th><th>Zones</th><th>hp</th><th>atk</th><th>def</th><th>speed</th><th>regen</th><th>gold</th><th>xp</th></tr></thead><tbody id="ebody"></tbody></table></div></div>
<div id="bosses" class="tab-panel"><div class="wrap"><table><thead><tr><th>Name</th><th>Zone</th><th>Type</th><th>hp</th><th>atk</th><th>def</th><th>speed</th><th>regen</th><th>gold</th><th>xp</th></tr></thead><tbody id="bbody"></tbody></table></div></div>
<div id="sim"><h3>Sim Output</h3><pre id="simout"></pre></div>
<script>
var STATS=['hp','atk','def','speed','regen','gold','xp'],TOTAL_ZONES=${TOTAL_ZONES},AREA_MAP=${AREAS_JSON},SPW=120,SPH=44,SPC=22,SPM=18;
var balance={},enemyBalance={},bossBalance={},entityData={enemies:[],bosses:[]},active='zones',cellRefs={};
function areaForZone(z){for(var i=0;i<AREA_MAP.length;i++)if(z>=AREA_MAP[i].zones[0]&&z<=AREA_MAP[i].zones[1])return AREA_MAP[i];return AREA_MAP[0]}
function gv(z,s){return balance[z]&&balance[z][s]!==undefined?balance[z][s]:1}function sv(z,s,v){if(!balance[z])balance[z]={};balance[z][s]=v}
function gev(m,id,s){return m[id]&&m[id][s]!==undefined?m[id][s]:1}function sev(m,id,s,v){if(!m[id])m[id]={};m[id][s]=v}
function bg(td,v){if(Math.abs(v-1)<0.001){td.style.background='';return}var a=Math.min(0.45,Math.abs(v-1)*0.9);td.style.background=v<1?'rgba(231,111,81,'+a.toFixed(3)+')':'rgba(82,183,136,'+a.toFixed(3)+')'}
function track(sl,v){var pct=Math.max(0,Math.min(100,((v-0.5)/1.5)*100)),fill=v<1?'#e76f51':'#52b788';sl.style.background='linear-gradient(to right,'+fill+' 0%,'+fill+' '+pct.toFixed(1)+'%,#333 '+pct.toFixed(1)+'%,#333 100%)'}
function mkCell(tr,key,getf,setf,onchg){var td=document.createElement('td');td.className='stat';var inner=document.createElement('div');inner.className='cell';var sl=document.createElement('input');sl.type='range';sl.min='0.5';sl.max='2.0';sl.step='0.05';var sp=document.createElement('span');sp.className='read';function apply(v){sl.value=v;track(sl,v);sp.textContent='x'+v.toFixed(2);bg(td,v)}apply(getf());cellRefs[key]={slider:sl,span:sp,td:td};sl.addEventListener('input',function(){var v=parseFloat(this.value);if(isNaN(v))return;setf(v);apply(v);if(onchg)onchg()});sp.addEventListener('click',function(){var ni=document.createElement('input');ni.type='number';ni.min='0.05';ni.max='5';ni.step='0.05';ni.value=getf().toFixed(2);ni.className='in';inner.replaceChild(ni,sp);ni.focus();ni.select();var done=false;function commit(){if(done)return;done=true;var v=parseFloat(ni.value);if(!isNaN(v)&&v>0)setf(v);if(ni.parentNode)inner.replaceChild(sp,ni);apply(getf());if(onchg)onchg()}ni.addEventListener('blur',commit);ni.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();commit()}if(e.key==='Escape'&&!done){done=true;inner.replaceChild(sp,ni)}})});inner.appendChild(sl);inner.appendChild(sp);td.appendChild(inner);tr.appendChild(td)}
function refreshCell(k,v){var r=cellRefs[k];if(!r)return;r.slider.value=v;track(r.slider,v);r.span.textContent='x'+v.toFixed(2);bg(r.td,v)}
function spark(stat){var svg=document.getElementById('sp-'+stat);if(!svg)return;var bw=SPW/TOTAL_ZONES,html='<line x1="0" y1="'+SPC+'" x2="'+SPW+'" y2="'+SPC+'" stroke="#444" stroke-width="1"/>';for(var z=1;z<=TOTAL_ZONES;z++){var v=gv(z,stat);if(Math.abs(v-1)<0.001)continue;var h=Math.max(1,Math.min(SPM,Math.abs(v-1)*SPM*2)),c=v>=1?'#52b788':'#e76f51',x=((z-1)*bw).toFixed(1),y=(v>=1?SPC-h:SPC).toFixed(1);html+='<rect class="sb" data-zone="'+z+'" x="'+x+'" y="'+y+'" width="'+Math.max(1,bw-0.5).toFixed(1)+'" height="'+h.toFixed(1)+'" fill="'+c+'"/>'}svg.innerHTML=html;svg.querySelectorAll('.sb').forEach(function(r){r.addEventListener('click',function(){var z=parseInt(r.dataset.zone,10),tr=document.querySelector('tr[data-zone="'+z+'"]');if(!tr)return;tr.scrollIntoView({behavior:'smooth',block:'center'});tr.classList.remove('hl');void tr.offsetWidth;tr.classList.add('hl');setTimeout(function(){tr.classList.remove('hl')},1300)})})}
function buildSparks(){var c=document.getElementById('sparks');c.innerHTML='';STATS.forEach(function(s){var w=document.createElement('div');w.className='spark';var l=document.createElement('span');l.textContent=s;var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='sp-'+s;svg.setAttribute('width',SPW);svg.setAttribute('height',SPH);w.appendChild(l);w.appendChild(svg);c.appendChild(w);spark(s)})}
function resetZone(z){for(var i=0;i<STATS.length;i++){var s=STATS[i];sv(z,s,1);refreshCell(z+'-'+s,1);spark(s)}}
function resetEnt(p,id,map){for(var i=0;i<STATS.length;i++){var s=STATS[i];sev(map,id,s,1);refreshCell(p+'-'+id+'-'+s,1)}}
function buildZones(){var tb=document.getElementById('zbody');tb.innerHTML='';var last=null;for(var z=1;z<=TOTAL_ZONES;z++){var a=areaForZone(z);if(a.id!==last){last=a.id;var hr=document.createElement('tr');hr.className='areahead';var hc=document.createElement('td');hc.colSpan=9;hc.textContent='A'+a.id+' - '+a.name+' (zones '+a.zones[0]+'-'+a.zones[1]+')';hr.appendChild(hc);tb.appendChild(hr)}var tr=document.createElement('tr');tr.dataset.zone=z;tr.addEventListener('dblclick',(function(zz){return function(){resetZone(zz)}})(z));tr.addEventListener('contextmenu',(function(zz){return function(e){e.preventDefault();resetZone(zz)}})(z));var zc=document.createElement('td');zc.className='zone';zc.textContent=z;tr.appendChild(zc);var ac=document.createElement('td');ac.className='meta';ac.textContent='A'+a.id;tr.appendChild(ac);STATS.forEach(function(s){mkCell(tr,z+'-'+s,function(){return gv(z,s)},function(v){sv(z,s,v)},function(){spark(s)})});tb.appendChild(tr)}}
function buildEnemies(){var tb=document.getElementById('ebody');tb.innerHTML='';(entityData.enemies||[]).forEach(function(e){var tr=document.createElement('tr');tr.addEventListener('dblclick',function(){resetEnt('e',e.id,enemyBalance)});tr.addEventListener('contextmenu',function(ev){ev.preventDefault();resetEnt('e',e.id,enemyBalance)});var n=document.createElement('td');n.className='name';n.textContent=e.name;tr.appendChild(n);var z=document.createElement('td');z.className='meta';z.textContent=e.zones[0]+'-'+e.zones[1];tr.appendChild(z);STATS.forEach(function(s){mkCell(tr,'e-'+e.id+'-'+s,function(){return gev(enemyBalance,e.id,s)},function(v){sev(enemyBalance,e.id,s,v)})});tb.appendChild(tr)})}
function cls(t){if(t==='AREA')return'area';if(t==='ELITE')return'elite';return'mini'}
function buildBosses(){var tb=document.getElementById('bbody');tb.innerHTML='';(entityData.bosses||[]).forEach(function(b){var tr=document.createElement('tr');tr.addEventListener('dblclick',function(){resetEnt('b',b.id,bossBalance)});tr.addEventListener('contextmenu',function(ev){ev.preventDefault();resetEnt('b',b.id,bossBalance)});var n=document.createElement('td');n.className='name';n.textContent=b.name;tr.appendChild(n);var z=document.createElement('td');z.className='meta';z.textContent=String(b.zone);tr.appendChild(z);var t=document.createElement('td');t.className='meta';var badge=document.createElement('span');badge.className=cls(b.bossType);badge.textContent=b.bossType;t.appendChild(badge);tr.appendChild(t);STATS.forEach(function(s){mkCell(tr,'b-'+b.id+'-'+s,function(){return gev(bossBalance,b.id,s)},function(v){sev(bossBalance,b.id,s,v)})});tb.appendChild(tr)})}
function cleanZones(){var o={};for(var z=1;z<=TOTAL_ZONES;z++){var e={};for(var i=0;i<STATS.length;i++){var s=STATS[i],v=gv(z,s);if(Math.abs(v-1)>0.0001)e[s]=parseFloat(v.toFixed(2))}if(Object.keys(e).length)o[z]=e}return o}
function cleanMap(map){var o={};Object.keys(map).forEach(function(id){var e={};STATS.forEach(function(s){var v=map[id]&&map[id][s]!==undefined?map[id][s]:1;if(Math.abs(v-1)>0.0001)e[s]=parseFloat(v.toFixed(2))});if(Object.keys(e).length)o[id]=e});return o}
function fmtZones(b){var ks=Object.keys(b).map(Number).sort(function(a,b2){return a-b2});if(!ks.length)return'export const ZONE_BALANCE = {};';var ls=ks.map(function(z){var p=Object.keys(b[z]).map(function(k){return k+': '+b[z][k]}).join(', ');return'  '+z+': { '+p+' },'});return'export const ZONE_BALANCE = {\\n'+ls.join('\\n')+'\\n};'}
function fmtMap(m,name){var ids=Object.keys(m).sort();if(!ids.length)return'export const '+name+' = {};';var ls=ids.map(function(id){var p=Object.keys(m[id]).map(function(k){return k+': '+parseFloat(m[id][k].toFixed(2)).toFixed(2)}).join(', ');return'  \\''+id+'\\': { '+p+' },'});return'export const '+name+' = {\\n'+ls.join('\\n')+'\\n};'}
function setTab(tab){active=tab;document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id===tab)});document.getElementById('save').textContent=tab==='zones'?'Save to areas.js':'Save to balance.js'}
function load(){Promise.all([fetch('/api/data').then(function(r){return r.json()}),fetch('/api/entity-data').then(function(r){return r.json()}),fetch('/api/balance-data').then(function(r){return r.json()})]).then(function(all){var z=all[0],e=all[1],b=all[2];balance={};Object.keys(z.balance||{}).forEach(function(k){balance[parseInt(k,10)]=Object.assign({},z.balance[k])});enemyBalance=Object.assign({},b.enemyBalance||{});bossBalance=Object.assign({},b.bossBalance||{});entityData=e||{enemies:[],bosses:[]};var s=z.scaling||{};document.getElementById('rates').textContent='Base scaling: hp x'+(s.hp?(1+s.hp).toFixed(2):'?')+'/zone | atk x'+(s.atk?(1+s.atk).toFixed(2):'?')+'/zone | gold x'+(s.gold?(1+s.gold).toFixed(2):'?')+'/zone | xp x'+(s.xp?(1+s.xp).toFixed(2):'?')+'/zone';cellRefs={};buildZones();buildSparks();buildEnemies();buildBosses();setTab('zones')}).catch(function(err){document.getElementById('rates').textContent='Error: '+err.message})}
document.querySelectorAll('.tab-btn').forEach(function(b){b.addEventListener('click',function(){setTab(b.dataset.tab)})});
document.getElementById('save').addEventListener('click',function(){var btn=this,url=active==='zones'?'/api/save':'/api/save-balance',payload=active==='zones'?{balance:cleanZones()}:{enemyBalance:cleanMap(enemyBalance),bossBalance:cleanMap(bossBalance)};fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json()}).then(function(j){if(!j.ok){alert('Save failed: '+(j.error||'unknown'));return}var label=active==='zones'?'Save to areas.js':'Save to balance.js';btn.textContent='Saved!';btn.classList.add('success');setTimeout(function(){btn.textContent=label;btn.classList.remove('success')},2000)}).catch(function(e){alert('Save error: '+e.message)})});
document.getElementById('simbtn').addEventListener('click',function(){var p=document.getElementById('sim'),o=document.getElementById('simout');p.style.display='block';o.textContent='Running simulation...';fetch('/api/sim',{method:'POST'}).then(function(r){return r.json()}).then(function(j){o.textContent=j.output||'(no output)';p.scrollIntoView({behavior:'smooth',block:'start'})}).catch(function(e){o.textContent='Error: '+e.message})});
document.getElementById('copy').addEventListener('click',function(){var btn=this,code='';if(active==='zones')code=fmtZones(cleanZones());else if(active==='enemies')code=fmtMap(cleanMap(enemyBalance),'ENEMY_BALANCE');else code=fmtMap(cleanMap(bossBalance),'BOSS_BALANCE');navigator.clipboard.writeText(code).then(function(){btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy Code'},1500)}).catch(function(e){alert('Copy failed: '+e.message)})});
load();
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }
  if (req.url.startsWith('/api/')) {
    handleApi(req, res);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('Balance GUI');
  console.log(`  ${url}`);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
  exec(`start ${url}`, { shell: true });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is another instance running?`);
    console.error(`Open http://localhost:${PORT} in your browser manually.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
