# Plan: Per-Entity Stat Dials in Balance GUI

## Context
The balance GUI (`scripts/zone-balance-gui.js`) lets you dial per-zone stat multipliers via `ZONE_BALANCE` in `areas.js`. This plan adds the same slider-based editing for **individual enemy types** and **individual bosses**, so you can fine-tune a specific enemy (e.g., make a forest rat tankier) or tune a single boss without affecting any other enemies in that zone.

---

## Approach Summary
- Add two new tabs to the GUI: **Enemies** and **Bosses** (existing content becomes the "Zones" tab)
- Each entity tab is a table: one row per enemy/boss, same 7-stat slider pattern (hp, atk, def, speed, regen, gold, xp)
- Balance data saved to a new **`src/data/balance.js`** file as sparse maps (`ENEMY_BALANCE`, `BOSS_BALANCE`)
- `CombatEngine.spawnEnemy()` and `spawnBoss()` multiply base stats by the entity bias on top of existing zone scaling
- Enemy/boss dials **stack** with zone dials: `finalStat = base × zoneScale × zoneBias × entityBias`

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/data/balance.js` | **Create** — `ENEMY_BALANCE`, `BOSS_BALANCE` sparse maps + getter functions |
| `scripts/dump-zone-data.mjs` | **Create** — ESM helper that dumps enemy/boss names as JSON for the GUI server |
| `scripts/zone-balance-gui.js` | **Modify** — tabs, two new tables, 3 new API endpoints, balance.js parser/saver |
| `src/systems/CombatEngine.js` | **Modify** — apply entity bias in `spawnEnemy()` and `spawnBoss()` |

---

## Step 1 — Create `src/data/balance.js`

```js
// Per-entity stat multipliers applied on top of zone scaling.
// Sparse: omitted entries default to 1.0 (no change).
// Format: { 'entityId': { stat: multiplier } }

export const ENEMY_BALANCE = {};
export const BOSS_BALANCE  = {};

export function getEnemyBias(enemyId, stat) {
  return ENEMY_BALANCE[enemyId]?.[stat] ?? 1.0;
}

export function getBossBias(bossId, stat) {
  return BOSS_BALANCE[bossId]?.[stat] ?? 1.0;
}
```

---

## Step 2 — Create `scripts/dump-zone-data.mjs`

Spawned by the GUI server to load ESM data files and emit JSON.
`enemies.js` and `bosses.js` have no imports, so this is dependency-free.

```js
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES }  from '../src/data/bosses.js';

console.log(JSON.stringify({
  enemies: ENEMIES.map(e => ({ id: e.id, name: e.name, zones: e.zones })),
  bosses:  BOSSES.map(b => ({ id: b.id, name: b.name, zone: b.zone, bossType: b.bossType })),
}));
```

---

## Step 3 — Modify `src/systems/CombatEngine.js`

### 3a. Add import
```js
import { getEnemyBias, getBossBias } from '../data/balance.js';
```

### 3b. `spawnEnemy()` — apply entity bias alongside existing zone factors (~line 354)

```js
const eb = (stat) => getEnemyBias(enemyTemplate.id, stat);
const scaledData = {
  ...enemyTemplate,
  hp:          D(enemyTemplate.hp).times(getZoneScaling(zone, 'hp') * getZoneBias(globalZone, 'hp') * eb('hp')).floor().toString(),
  attack:      Math.floor(enemyTemplate.attack * atkScale * getZoneBias(globalZone, 'atk') * eb('atk')),
  defense:     Math.floor((enemyTemplate.defense || 0) * getZoneBias(globalZone, 'def') * eb('def')),
  attackSpeed: (enemyTemplate.attackSpeed ?? 1) * getZoneBias(globalZone, 'speed') * eb('speed'),
  goldDrop:    D(enemyTemplate.goldDrop).times(getZoneScaling(zone, 'gold') * getZoneBias(globalZone, 'gold') * eb('gold')).floor().toString(),
  xpDrop:      D(enemyTemplate.xpDrop).times(getZoneScaling(zone, 'xp') * getZoneBias(globalZone, 'xp') * eb('xp')).floor().toString(),
  regen:       enemyTemplate.regen ? Math.floor(enemyTemplate.regen * atkScale * getZoneBias(globalZone, 'regen') * eb('regen')) : 0,
  thorns:      enemyTemplate.thorns ? Math.floor(enemyTemplate.thorns * atkScale * getZoneBias(globalZone, 'atk') * eb('atk')) : 0,
};
```

### 3c. `spawnBoss()` — apply boss bias before `_buildMember` call (~line 387)
Bosses have hand-authored absolute stats (no zone scaling), so only boss bias is applied:

```js
const bb = (stat) => getBossBias(bossTemplate.id, stat);
const scaledBoss = {
  ...bossTemplate,
  hp:          D(bossTemplate.hp).times(bb('hp')).floor().toString(),
  attack:      Math.floor(bossTemplate.attack * bb('atk')),
  defense:     Math.floor((bossTemplate.defense || 0) * bb('def')),
  attackSpeed: (bossTemplate.attackSpeed ?? 1) * bb('speed'),
  goldDrop:    D(bossTemplate.goldDrop).times(bb('gold')).floor().toString(),
  xpDrop:      D(bossTemplate.xpDrop).times(bb('xp')).floor().toString(),
  regen:       bossTemplate.regen ? Math.floor(bossTemplate.regen * bb('regen')) : 0,
};
const bossMember = CombatEngine._buildMember(scaledBoss, 0, { isBoss: true });
```

---

## Step 4 — Modify `scripts/zone-balance-gui.js`

### 4a. New path constants
```js
const DUMP_PATH    = path.join(__dirname, 'dump-zone-data.mjs');
const BALANCE_PATH = path.join(ROOT, 'src', 'data', 'balance.js');
```

### 4b. New server-side helpers

```js
// Load entity names via dump script (cached)
let _entityCache = null;
function loadEntityData() {
  if (_entityCache) return Promise.resolve(_entityCache);
  return new Promise((resolve, reject) => {
    exec(`node "${DUMP_PATH}"`, { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      _entityCache = JSON.parse(stdout);
      resolve(_entityCache);
    });
  });
}

// Parse ENEMY_BALANCE or BOSS_BALANCE block from balance.js text
function parseEntityBalance(fileText, mapName) {
  const balance = {};
  const re = new RegExp('export const ' + mapName + ' = \\{([\\s\\S]*?)\\n\\};');
  const m = fileText.match(re);
  if (!m) return balance;
  const entryRe = /'([^']+)':\s*\{([^}]*)\}/g;
  let em;
  while ((em = entryRe.exec(m[1])) !== null) {
    const inner = {};
    const kvRe = /(\w+):\s*([\d.]+)/g;
    let kv;
    while ((kv = kvRe.exec(em[2])) !== null) inner[kv[1]] = parseFloat(kv[2]);
    if (Object.keys(inner).length) balance[em[1]] = inner;
  }
  return balance;
}

// Format a sparse entity balance map as a JS const block
function formatEntityBalance(balance, mapName) {
  const lines = Object.entries(balance)
    .filter(([, stats]) => Object.values(stats).some(v => Math.abs(v - 1) > 0.001))
    .map(([id, stats]) => {
      const pairs = Object.entries(stats)
        .filter(([, v]) => Math.abs(v - 1) > 0.001)
        .map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(', ');
      return `  '${id}': { ${pairs} },`;
    });
  return `export const ${mapName} = {\n${lines.join('\n')}\n};`;
}

// Write both maps back to balance.js
function saveEntityBalance(enemyBalance, bossBalance) {
  let text = fs.existsSync(BALANCE_PATH) ? fs.readFileSync(BALANCE_PATH, 'utf8') : '';
  const replaceOrAppend = (t, mapName, block) => {
    const re = new RegExp('export const ' + mapName + ' = \\{[\\s\\S]*?\\n\\};');
    return re.test(t) ? t.replace(re, block) : t + '\n' + block + '\n';
  };
  text = replaceOrAppend(text, 'ENEMY_BALANCE', formatEntityBalance(enemyBalance, 'ENEMY_BALANCE'));
  text = replaceOrAppend(text, 'BOSS_BALANCE',  formatEntityBalance(bossBalance,  'BOSS_BALANCE'));
  fs.writeFileSync(BALANCE_PATH, text, 'utf8');
}
```

### 4c. New API endpoints

```js
// GET /api/entity-data  — enemy + boss names for building GUI tables
if (req.method === 'GET' && req.url === '/api/entity-data') {
  loadEntityData().then(d => sendJson(res, d))
    .catch(err => { res.writeHead(500); res.end(err.message); });
  return;
}

// GET /api/balance-data  — current ENEMY_BALANCE + BOSS_BALANCE values
if (req.method === 'GET' && req.url === '/api/balance-data') {
  const text = fs.existsSync(BALANCE_PATH) ? fs.readFileSync(BALANCE_PATH, 'utf8') : '';
  sendJson(res, {
    enemyBalance: parseEntityBalance(text, 'ENEMY_BALANCE'),
    bossBalance:  parseEntityBalance(text, 'BOSS_BALANCE'),
  });
  return;
}

// POST /api/save-balance  — write entity balance maps to balance.js
if (req.method === 'POST' && req.url === '/api/save-balance') {
  readBody(req).then(body => {
    saveEntityBalance(body.enemyBalance || {}, body.bossBalance || {});
    sendJson(res, { ok: true });
  }).catch(err => { res.writeHead(500); res.end(err.message); });
  return;
}
```

### 4d. Browser-side changes

**New CSS (add to `<style>` block):**
```css
.tabs { display:flex; gap:4px; padding:8px 16px; background:#111; border-bottom:1px solid #2a2a2a; }
.tab-btn { padding:6px 18px; border-radius:4px; border:none; cursor:pointer;
           background:#1e1e1e; color:#888; font-size:13px; }
.tab-btn.active { background:#2a4a2a; color:#7abf7a; }
.tab-panel { display:none; }
.tab-panel.active { display:block; }
.entity-name-col { min-width:160px; text-align:left; padding:4px 8px; color:#ccc; font-size:12px; }
.entity-meta-col { min-width:80px; font-size:10px; color:#666; text-align:center; }
.badge-mini  { background:#303030; color:#999; font-size:9px; padding:1px 5px; border-radius:2px; }
.badge-elite { background:#2e2810; color:#d4a830; font-size:9px; padding:1px 5px; border-radius:2px; }
.badge-area  { background:#2e1010; color:#d46060; font-size:9px; padding:1px 5px; border-radius:2px; }
```

**HTML structure:** Wrap existing table+sparklines in `<div id="panel-zones" class="tab-panel active">`. Add `<div id="panel-enemies" class="tab-panel">` and `<div id="panel-bosses" class="tab-panel">`. Add tab buttons row above all panels.

**New in-memory state:**
```js
var entityBalance = {};  // { 'a1_forest_rat': { hp: 1.2 } }
var bossBalance   = {};  // { 'boss_a1z1_rotfang': { hp: 1.5 } }
var entityData    = { enemies: [], bosses: [] };
var activeTab     = 'zones';
```

**Entity table builder** — same slider + readout + heat-map pattern as zone table:
- Enemy rows: Name | Zones (e.g. "1–3") | hp | atk | def | speed | regen | gold | xp
- Boss rows: Name | Zone | Type badge | hp | atk | def | speed | regen | gold | xp
- `cellRefs` key prefix: `'e-' + enemy.id + '-' + stat` / `'b-' + boss.id + '-' + stat`
- Getters/setters read from `entityBalance` / `bossBalance` (default 1.0)
- Double-click row → reset all 7 sliders to 1.0 (same as zone reset)

**Init (parallel fetch, then build all tables):**
```js
Promise.all([
  fetch('/api/data').then(r => r.json()),
  fetch('/api/entity-data').then(r => r.json()),
  fetch('/api/balance-data').then(r => r.json()),
]).then(function([zoneData, entities, balanceData]) {
  // initialize balance, entityBalance, bossBalance
  // buildTable() — existing
  // buildSparklines() — existing
  // buildEntityTable('enemies', entities.enemies)
  // buildEntityTable('bosses',  entities.bosses)
});
```

**Save button behavior:**
- Zones tab → POST `/api/save` (existing, saves ZONE_BALANCE to areas.js)
- Enemies/Bosses tab → POST `/api/save-balance` (saves both entity maps to balance.js)

**Copy Code button:** Copies the relevant `export const` block for the active tab only.

**No sparklines for entity tabs** — tables are short enough to scan visually.

---

## Verification
1. `npm run balance:gui` → server starts on port 3001, no errors in terminal
2. Three tabs visible: **Zones** | **Enemies** | **Bosses**
3. Enemies tab: ~18 rows (one per enemy template), all sliders at ×1.00
4. Bosses tab: 30 rows (one per zone), type badges visible (MINI / ELITE / AREA)
5. Move Forest Rat `hp` slider to 1.50 → **Save** → inspect `src/data/balance.js`:
   ```js
   export const ENEMY_BALANCE = {
     'a1_forest_rat': { hp: 1.50 },
   };
   ```
6. Reload GUI → Forest Rat hp slider restores to ×1.50
7. In-game: reload page → Forest Rat noticeably tankier in zones 1–2
8. Existing Zones tab, sparklines, Run Sim, Copy Code all work unchanged
