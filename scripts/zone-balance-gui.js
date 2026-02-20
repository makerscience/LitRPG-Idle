#!/usr/bin/env node
// Zone Balance GUI — visual editor for ZONE_BALANCE in areas.js.
// Usage: npm run balance:gui
// Starts a local HTTP server on port 3001 and opens the browser.

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AREAS_PATH = path.join(ROOT, 'src', 'data', 'areas.js');
const SIM_PATH = path.join(ROOT, 'scripts', 'balance-sim.js');
const PORT = 3001;

// ── Area metadata (mirrors areas.js structure; first-match zone assignment) ──
const AREA_MAP = [
  { id: 1, name: 'The Harsh Threshold',    zones: [1,  10], color: '#4a7c59' },
  { id: 2, name: 'The Overgrown Frontier', zones: [11, 15], color: '#6b7c4a' },
  { id: 3, name: 'The Broken Road',        zones: [16, 30], color: '#7c5a4a' },
];
const TOTAL_ZONES = 30;
const STATS = ['hp', 'atk', 'def', 'speed', 'regen', 'gold', 'xp'];

// ── Parse ZONE_BALANCE from areas.js text ─────────────────────────────────
function parseZoneBalance(fileText) {
  const balance = {};
  const blockMatch = fileText.match(/export const ZONE_BALANCE = \{([\s\S]*?)\n\};/);
  if (!blockMatch) return balance;
  const block = blockMatch[1];
  const entryRe = /(\d+):\s*\{([^}]*)\}/g;
  let em;
  while ((em = entryRe.exec(block)) !== null) {
    const zone = parseInt(em[1], 10);
    const inner = em[2];
    const entry = {};
    const kvRe = /(\w+):\s*([\d.]+)/g;
    let kv;
    while ((kv = kvRe.exec(inner)) !== null) {
      entry[kv[1]] = parseFloat(kv[2]);
    }
    if (Object.keys(entry).length > 0) balance[zone] = entry;
  }
  return balance;
}

function parseZoneScaling(fileText) {
  const scaling = {};
  const blockMatch = fileText.match(/export const ZONE_SCALING = \{([\s\S]*?)\};/);
  if (!blockMatch) return scaling;
  const kvRe = /(\w+):\s*([\d.]+)/g;
  let kv;
  while ((kv = kvRe.exec(blockMatch[1])) !== null) {
    scaling[kv[1]] = parseFloat(kv[2]);
  }
  return scaling;
}

// ── Write ZONE_BALANCE back to areas.js ───────────────────────────────────
function formatBlock(balance) {
  const entries = Object.keys(balance)
    .map(Number).sort((a, b) => a - b)
    .map(zone => {
      const stats = balance[zone];
      const pairs = Object.entries(stats)
        .filter(([, v]) => Math.abs(v - 1) > 0.0001)
        .map(([k, v]) => k + ': ' + parseFloat(v.toFixed(2))).join(', ');
      return pairs ? '  ' + zone + ': { ' + pairs + ' },' : null;
    }).filter(Boolean);
  if (entries.length === 0) return '{\n}';
  return '{\n' + entries.join('\n') + '\n}';
}

function saveZoneBalance(balance) {
  const fileText = fs.readFileSync(AREAS_PATH, 'utf8');
  const updated = fileText.replace(
    /export const ZONE_BALANCE = \{[\s\S]*?\n\};/,
    'export const ZONE_BALANCE = ' + formatBlock(balance) + ';'
  );
  fs.writeFileSync(AREAS_PATH, updated, 'utf8');
}

// ── HTTP helpers ───────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

// ── API request handler ────────────────────────────────────────────────────
function handleApi(req, res) {
  const url = req.url;

  if (req.method === 'GET' && url === '/api/data') {
    const fileText = fs.readFileSync(AREAS_PATH, 'utf8');
    const balance = parseZoneBalance(fileText);
    const scaling = parseZoneScaling(fileText);
    sendJson(res, { balance, scaling, areas: AREA_MAP });
    return;
  }

  if (req.method === 'POST' && url === '/api/save') {
    readBody(req).then(body => {
      saveZoneBalance(body.balance || {});
      sendJson(res, { ok: true });
    }).catch(e => sendJson(res, { ok: false, error: e.message }, 400));
    return;
  }

  if (req.method === 'POST' && url === '/api/sim') {
    exec('node "' + SIM_PATH + '"', { cwd: ROOT }, (err, stdout, stderr) => {
      sendJson(res, { ok: !err, output: stdout || stderr || '' });
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

// ── Embedded HTML GUI ──────────────────────────────────────────────────────
// Node.js interpolations are evaluated here; browser-side JS uses no template literals.
const AREAS_JSON = JSON.stringify(AREA_MAP);

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Zone Balance Editor</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; font-size: 13px; }
header {
  background: #16213e; padding: 10px 16px; display: flex; align-items: center;
  gap: 10px; flex-wrap: wrap; border-bottom: 2px solid #0f3460;
  position: sticky; top: 0; z-index: 10;
}
header h1 { font-size: 15px; color: #e94560; flex: 1; min-width: 180px; }
.base-rates { font-size: 11px; color: #aaa; flex-basis: 100%; margin-top: 2px; }
button {
  background: #0f3460; color: #e0e0e0; border: 1px solid #e94560;
  padding: 5px 12px; cursor: pointer; border-radius: 3px;
  font-family: monospace; font-size: 12px; white-space: nowrap;
}
button:hover { background: #e94560; }
button.success { background: #2d6a4f; border-color: #52b788; }
/* ── Sparklines ── */
.sparklines {
  display: flex; gap: 10px; padding: 8px 16px;
  background: #0f1a2e; border-bottom: 1px solid #0f3460; flex-wrap: wrap; align-items: flex-end;
}
.sparkline-wrap { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.sparkline-label { font-size: 10px; color: #888; }
.sparkline-wrap svg { display: block; }
.sparkline-wrap svg rect { cursor: pointer; }
.sparkline-wrap svg rect:hover { opacity: 0.65; }
/* ── Table ── */
.table-wrap { overflow-x: auto; padding: 0 8px 16px; }
table { border-collapse: collapse; width: 100%; min-width: 680px; }
th {
  background: #16213e; color: #e94560; padding: 5px 8px; text-align: center;
  position: sticky; top: 52px; z-index: 5; font-size: 12px;
  border-bottom: 1px solid #0f3460;
}
td { padding: 2px 3px; text-align: center; border-bottom: 1px solid #1e1e3a; vertical-align: middle; }
tr.data-row:hover > td:not(.stat-cell) { background: rgba(255,255,255,0.04); }
td.zone-num { color: #aaa; font-weight: bold; width: 36px; font-size: 12px; }
td.area-label { font-size: 11px; color: #888; width: 36px; }
td.stat-cell { width: 78px; padding: 3px 2px; transition: background 0.12s; }
/* ── Cell inner layout ── */
.cell-inner { display: flex; flex-direction: column; align-items: center; gap: 2px; }
/* ── Range slider ── */
input[type=range] {
  -webkit-appearance: none;
  width: 68px; height: 4px; border-radius: 2px;
  outline: none; border: none; cursor: pointer; display: block; margin: 0 auto;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 11px; height: 11px; border-radius: 50%;
  background: #d0d0d0; cursor: pointer; border: 1px solid #888; margin-top: -3.5px;
}
input[type=range]::-moz-range-thumb {
  width: 11px; height: 11px; border-radius: 50%;
  background: #d0d0d0; cursor: pointer; border: 1px solid #888;
}
/* ── Readout span ── */
.readout {
  font-size: 10px; color: #bbb; cursor: pointer; line-height: 1.3; white-space: nowrap;
}
.readout:hover { color: #fff; text-decoration: underline; }
/* ── Inline number edit ── */
.inline-num {
  width: 52px; padding: 1px 3px; text-align: center;
  background: #0f0f1a; color: #e0e0e0; border: 1px solid #52b788;
  border-radius: 2px; font-family: monospace; font-size: 11px;
}
/* ── Area rows ── */
.area-1 td.zone-num { border-left: 3px solid #4a7c59; }
.area-2 td.zone-num { border-left: 3px solid #6b7c4a; }
.area-3 td.zone-num { border-left: 3px solid #7c5a4a; }
tr.area-header td {
  background: #0f1a2e; color: #7a9cc5; font-size: 11px; padding: 5px 10px;
  text-align: left; border-top: 2px solid #0f3460; border-bottom: 1px solid #0f3460;
}
/* ── Row highlight pulse ── */
@keyframes rowflash { 0%,100% { background: transparent; } 50% { background: rgba(233,69,96,0.28); } }
tr.highlight td { animation: rowflash 0.55s ease 2; }
/* ── Sim panel ── */
#sim-panel {
  background: #0a0a1a; border-top: 2px solid #0f3460;
  padding: 12px 16px; display: none;
}
#sim-panel h2 { color: #e94560; margin-bottom: 8px; font-size: 13px; }
#sim-output {
  white-space: pre; font-size: 11px; color: #ccc; line-height: 1.5;
  max-height: 500px; overflow-y: auto;
}
</style>
</head>
<body>
<header>
  <h1>Zone Balance Dials</h1>
  <button id="btn-save">Save to areas.js</button>
  <button id="btn-sim">Run Sim</button>
  <button id="btn-copy">Copy Code</button>
  <div class="base-rates" id="base-rates">Loading...</div>
</header>
<div id="sparklines" class="sparklines"></div>
<div class="table-wrap">
  <table id="balance-table">
    <thead>
      <tr>
        <th>Zone</th><th>Area</th>
        <th>hp</th><th>atk</th><th>def</th><th>speed</th>
        <th>regen</th><th>gold</th><th>xp</th>
      </tr>
    </thead>
    <tbody id="table-body"></tbody>
  </table>
</div>
<div id="sim-panel">
  <h2>Sim Output</h2>
  <pre id="sim-output"></pre>
</div>

<script>
var STATS = ['hp','atk','def','speed','regen','gold','xp'];
var AREA_MAP = ${AREAS_JSON};
var TOTAL_ZONES = ${TOTAL_ZONES};
var SPARK_W = 120, SPARK_H = 44, SPARK_CENTER = 22, SPARK_MAX_BAR = 18;

function getAreaForZone(z) {
  for (var i = 0; i < AREA_MAP.length; i++) {
    if (z >= AREA_MAP[i].zones[0] && z <= AREA_MAP[i].zones[1]) return AREA_MAP[i];
  }
  return AREA_MAP[0];
}

var balance = {};
var cellRefs = {}; // key: zone+'-'+stat -> { slider, span, td }

function getVal(zone, stat) {
  return (balance[zone] && balance[zone][stat] !== undefined) ? balance[zone][stat] : 1;
}

function setVal(zone, stat, v) {
  if (!balance[zone]) balance[zone] = {};
  balance[zone][stat] = v;
}

// ── Heat-map cell background ─────────────────────────────────────────────────
function updateCellBg(td, value) {
  var a;
  if (Math.abs(value - 1) < 0.001) {
    td.style.background = '';
  } else if (value < 1) {
    a = Math.min(0.45, (1 - value) * 0.9);
    td.style.background = 'rgba(231,111,81,' + a.toFixed(3) + ')';
  } else {
    a = Math.min(0.45, (value - 1) * 0.9);
    td.style.background = 'rgba(82,183,136,' + a.toFixed(3) + ')';
  }
}

// ── Slider track gradient ────────────────────────────────────────────────────
function updateSliderTrack(slider, value) {
  var pct = Math.max(0, Math.min(100, ((value - 0.5) / 1.5) * 100));
  var fill = value < 1.0 ? '#e76f51' : '#52b788';
  slider.style.background = 'linear-gradient(to right,' + fill + ' 0%,' + fill + ' ' + pct.toFixed(1) + '%,#333 ' + pct.toFixed(1) + '%,#333 100%)';
}

// ── Refresh a cell from current balance state ────────────────────────────────
function refreshCell(zone, stat) {
  var ref = cellRefs[zone + '-' + stat];
  if (!ref) return;
  var v = getVal(zone, stat);
  ref.slider.value = v;
  updateSliderTrack(ref.slider, v);
  ref.span.textContent = '\u00d7' + v.toFixed(2);
  updateCellBg(ref.td, v);
}

// ── Reset row ────────────────────────────────────────────────────────────────
function resetRow(zone) {
  for (var i = 0; i < STATS.length; i++) {
    setVal(zone, STATS[i], 1);
    refreshCell(zone, STATS[i]);
  }
  for (var j = 0; j < STATS.length; j++) { redrawSparkline(STATS[j]); }
}

// ── Sparklines ───────────────────────────────────────────────────────────────
function redrawSparkline(stat) {
  var svg = document.getElementById('spark-' + stat);
  if (!svg) return;
  var bw = SPARK_W / TOTAL_ZONES;
  var html = '<line x1="0" y1="' + SPARK_CENTER + '" x2="' + SPARK_W + '" y2="' + SPARK_CENTER + '" stroke="#444" stroke-width="1"/>';
  for (var z = 1; z <= TOTAL_ZONES; z++) {
    var v = getVal(z, stat);
    if (Math.abs(v - 1) < 0.001) continue;
    var barH = Math.max(1, Math.min(SPARK_MAX_BAR, Math.abs(v - 1) * SPARK_MAX_BAR * 2));
    var color = v >= 1 ? '#52b788' : '#e76f51';
    var x = ((z - 1) * bw).toFixed(1);
    var barY = (v >= 1 ? SPARK_CENTER - barH : SPARK_CENTER).toFixed(1);
    html += '<rect class="sb" data-zone="' + z + '" x="' + x + '" y="' + barY + '" width="' + Math.max(1, bw - 0.5).toFixed(1) + '" height="' + barH.toFixed(1) + '" fill="' + color + '"/>';
  }
  svg.innerHTML = html;
  var rects = svg.querySelectorAll('.sb');
  for (var i = 0; i < rects.length; i++) {
    (function(r) {
      r.addEventListener('click', function() {
        var zone = parseInt(r.dataset.zone);
        var tr = document.querySelector('tr[data-zone="' + zone + '"]');
        if (tr) {
          tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
          tr.classList.remove('highlight');
          void tr.offsetWidth; // reflow to restart animation
          tr.classList.add('highlight');
          setTimeout(function() { tr.classList.remove('highlight'); }, 1300);
        }
      });
    })(rects[i]);
  }
}

function buildSparklines() {
  var container = document.getElementById('sparklines');
  container.innerHTML = '';
  STATS.forEach(function(stat) {
    var wrap = document.createElement('div');
    wrap.className = 'sparkline-wrap';
    var label = document.createElement('div');
    label.className = 'sparkline-label';
    label.textContent = stat;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'spark-' + stat);
    svg.setAttribute('width', SPARK_W);
    svg.setAttribute('height', SPARK_H);
    wrap.appendChild(label);
    wrap.appendChild(svg);
    container.appendChild(wrap);
    redrawSparkline(stat);
  });
}

// ── Build table ──────────────────────────────────────────────────────────────
function buildTable() {
  cellRefs = {};
  var tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  var lastAreaId = null;

  for (var z = 1; z <= TOTAL_ZONES; z++) {
    var area = getAreaForZone(z);
    var areaClass = 'area-' + area.id;

    if (area.id !== lastAreaId) {
      lastAreaId = area.id;
      var hrow = document.createElement('tr');
      hrow.className = 'area-header';
      var hcell = document.createElement('td');
      hcell.colSpan = 9;
      hcell.textContent = 'A' + area.id + ' \u2014 ' + area.name + '  (zones ' + area.zones[0] + '\u2013' + area.zones[1] + ')';
      hrow.appendChild(hcell);
      tbody.appendChild(hrow);
    }

    var tr = document.createElement('tr');
    tr.className = 'data-row ' + areaClass;
    tr.dataset.zone = z;

    (function(zoneNum) {
      tr.addEventListener('dblclick', function() { resetRow(zoneNum); });
      tr.addEventListener('contextmenu', function(e) { e.preventDefault(); resetRow(zoneNum); });
    })(z);

    var tdZone = document.createElement('td');
    tdZone.className = 'zone-num';
    tdZone.textContent = z;
    tr.appendChild(tdZone);

    var tdArea = document.createElement('td');
    tdArea.className = 'area-label';
    tdArea.textContent = 'A' + area.id;
    tr.appendChild(tdArea);

    for (var s = 0; s < STATS.length; s++) {
      (function(stat, zone) {
        var td = document.createElement('td');
        td.className = 'stat-cell';

        var inner = document.createElement('div');
        inner.className = 'cell-inner';

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0.5';
        slider.max = '2.0';
        slider.step = '0.05';

        var span = document.createElement('span');
        span.className = 'readout';

        function applyVal(v) {
          slider.value = v;
          updateSliderTrack(slider, v);
          span.textContent = '\u00d7' + v.toFixed(2);
          updateCellBg(td, v);
        }
        applyVal(getVal(zone, stat));
        cellRefs[zone + '-' + stat] = { slider: slider, span: span, td: td };

        slider.addEventListener('input', function() {
          var v = parseFloat(this.value);
          if (!isNaN(v)) {
            setVal(zone, stat, v);
            span.textContent = '\u00d7' + v.toFixed(2);
            updateSliderTrack(slider, v);
            updateCellBg(td, v);
            redrawSparkline(stat);
          }
        });

        span.addEventListener('click', function() {
          var numInput = document.createElement('input');
          numInput.type = 'number';
          numInput.min = '0.05';
          numInput.max = '5';
          numInput.step = '0.05';
          numInput.value = getVal(zone, stat).toFixed(2);
          numInput.className = 'inline-num';
          inner.replaceChild(numInput, span);
          numInput.focus();
          numInput.select();
          var done = false;
          function commit() {
            if (done) return; done = true;
            var v = parseFloat(numInput.value);
            if (!isNaN(v) && v > 0) { setVal(zone, stat, v); }
            if (numInput.parentNode) { inner.replaceChild(span, numInput); }
            applyVal(getVal(zone, stat));
            redrawSparkline(stat);
          }
          numInput.addEventListener('blur', commit);
          numInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { if (!done) { done = true; inner.replaceChild(span, numInput); } }
          });
        });

        inner.appendChild(slider);
        inner.appendChild(span);
        td.appendChild(inner);
        tr.appendChild(td);
      })(STATS[s], z);
    }

    tbody.appendChild(tr);
  }
}

function getCleanBalance() {
  var out = {};
  for (var z = 1; z <= TOTAL_ZONES; z++) {
    var entry = {};
    for (var i = 0; i < STATS.length; i++) {
      var v = getVal(z, STATS[i]);
      if (Math.abs(v - 1) > 0.0001) entry[STATS[i]] = parseFloat(v.toFixed(2));
    }
    if (Object.keys(entry).length > 0) out[z] = entry;
  }
  return out;
}

function formatCodeBlock(bal) {
  var keys = Object.keys(bal).map(Number).sort(function(a,b){return a-b;});
  if (keys.length === 0) return 'export const ZONE_BALANCE = {};';
  var lines = keys.map(function(zone) {
    var stats = bal[zone];
    var pairs = Object.keys(stats).map(function(k){ return k + ': ' + stats[k]; }).join(', ');
    return '  ' + zone + ': { ' + pairs + ' },';
  });
  return 'export const ZONE_BALANCE = {\\n' + lines.join('\\n') + '\\n};';
}

function loadData() {
  fetch('/api/data').then(function(res) { return res.json(); }).then(function(json) {
    balance = {};
    var raw = json.balance || {};
    Object.keys(raw).forEach(function(zStr) {
      balance[parseInt(zStr)] = Object.assign({}, raw[zStr]);
    });

    var s = json.scaling || {};
    var rateKeys = ['hp','atk','gold','xp'];
    var rates = rateKeys.map(function(k) {
      return k + ' x' + (s[k] ? (1 + s[k]).toFixed(2) : '?') + '/zone';
    }).join('  |  ');
    document.getElementById('base-rates').textContent = 'Base scaling: ' + rates;

    buildTable();
    buildSparklines();
  }).catch(function(e) {
    document.getElementById('base-rates').textContent = 'Error loading data: ' + e.message;
  });
}

document.getElementById('btn-save').addEventListener('click', function() {
  var btn = this;
  var bal = getCleanBalance();
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ balance: bal }),
  }).then(function(res) { return res.json(); }).then(function(json) {
    if (json.ok) {
      btn.textContent = 'Saved!';
      btn.classList.add('success');
      setTimeout(function() {
        btn.textContent = 'Save to areas.js';
        btn.classList.remove('success');
      }, 2000);
    } else {
      alert('Save failed: ' + (json.error || 'unknown error'));
    }
  }).catch(function(e) { alert('Save error: ' + e.message); });
});

document.getElementById('btn-sim').addEventListener('click', function() {
  var panel = document.getElementById('sim-panel');
  var out = document.getElementById('sim-output');
  panel.style.display = 'block';
  out.textContent = 'Running simulation...';
  fetch('/api/sim', { method: 'POST' }).then(function(res) {
    return res.json();
  }).then(function(json) {
    out.textContent = json.output || '(no output)';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }).catch(function(e) { out.textContent = 'Error: ' + e.message; });
});

document.getElementById('btn-copy').addEventListener('click', function() {
  var btn = this;
  var code = formatCodeBlock(getCleanBalance());
  navigator.clipboard.writeText(code).then(function() {
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = 'Copy Code'; }, 1500);
  }).catch(function(e) { alert('Copy failed: ' + e.message); });
});

loadData();
</script>
</body>
</html>`;

// ── HTTP server ────────────────────────────────────────────────────────────
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
  const url = 'http://localhost:' + PORT;
  console.log('');
  console.log('Zone Balance GUI');
  console.log('  ' + url);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
  // Auto-open browser (Windows)
  exec('start ' + url, { shell: true });
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Is another instance running?');
    console.error('Open http://localhost:' + PORT + ' in your browser manually.');
  } else {
    console.error(err);
  }
  process.exit(1);
});
