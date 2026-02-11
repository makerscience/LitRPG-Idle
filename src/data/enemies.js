// World 1 enemy definitions — 5 areas, with `area` field (formerly `zone`).
// IDs use w{world}z{zone}_{name} format (kept for backward compat).

const WORLD_1_ENEMIES = [
  // Area 1: Sewers (HP 100–500)
  { id: 'w1z1_rat',    name: 'Sewer Rat',       area: 1, hp: '50',   attack: 6,  goldDrop: '5',   xpDrop: '8',
    sprites: {
      default:  'sewerrat001_default',
      reaction: 'sewerrat001_reaction',
      attack:   'sewerrat001_attack',
      dead:     'sewerrat001_dead',
    },
    spriteSize: { w: 125, h: 125 },
    lootTable: [
    { itemId: 'iron_dagger', weight: 40 }, { itemId: 'iron_helm', weight: 30 }, { itemId: 'leather_tunic', weight: 30 },
  ] },
  { id: 'w1z1_slime',  name: 'Green Slime',     area: 1, hp: '200',  attack: 9,  goldDrop: '10',  xpDrop: '15',
    sprites: {
      default:  'slime001_default',
      reaction: 'slime001_reaction',
      attack:   'slime001_attack',
      dead:     'slime001_dead',
    },
    lootTable: [
    { itemId: 'iron_dagger', weight: 40 }, { itemId: 'iron_helm', weight: 30 }, { itemId: 'leather_tunic', weight: 30 },
  ] },
  { id: 'w1z1_goblin', name: 'Goblin Grunt',    area: 1, hp: '400',  attack: 15,  goldDrop: '20',  xpDrop: '30',
    spriteOffsetY: -40,
    sprites: {
      default:  'goblin001_default',
      reaction: 'goblin001_reaction',
      attack:   'goblin001_attack',
      dead:     'goblin001_dead',
    },
    lootTable: [
    { itemId: 'iron_dagger', weight: 40 }, { itemId: 'iron_helm', weight: 30 }, { itemId: 'leather_tunic', weight: 30 },
  ] },

  // Area 2: Wilderness (HP 800–4000)
  { id: 'w1z2_wolf',    name: 'Dire Wolf',        area: 2, hp: '800',   attack: 36,  goldDrop: '50',   xpDrop: '80',   lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },
  { id: 'w1z2_skeleton',name: 'Skeleton Soldier',  area: 2, hp: '2000',  attack: 54,  goldDrop: '100',  xpDrop: '160',  lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },
  { id: 'w1z2_bandit',  name: 'Bandit Captain',    area: 2, hp: '4000',  attack: 75,  goldDrop: '200',  xpDrop: '300',  lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },

  // Area 3: Deep Caverns (HP 8K–60K)
  { id: 'w1z3_orc',   name: 'Orc Berserker', area: 3, hp: '8000',    attack: 150,   goldDrop: '500',   xpDrop: '800',   lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },
  { id: 'w1z3_troll', name: 'Cave Troll',    area: 3, hp: '30000',   attack: 240,   goldDrop: '1500',  xpDrop: '2500',  lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },
  { id: 'w1z3_mage',  name: 'Dark Mage',     area: 3, hp: '60000',   attack: 360,  goldDrop: '3000',  xpDrop: '5000',  lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },

  // Area 4: Volcanic Ruins (HP 250K–2.5M)
  { id: 'w1z4_whelp',  name: 'Dragon Whelp', area: 4, hp: '250000',   attack: 900,   goldDrop: '10000',   xpDrop: '15000',  lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },
  { id: 'w1z4_golem',  name: 'Iron Golem',   area: 4, hp: '1000000',  attack: 1500,   goldDrop: '50000',   xpDrop: '60000',  lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },
  { id: 'w1z4_lich',   name: 'Lich Lord',    area: 4, hp: '2500000',  attack: 2400,   goldDrop: '100000',  xpDrop: '150000', lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },

  // Area 5: Dragon's Lair (boss area)
  { id: 'w1z5_dragon', name: 'Elder Dragon', area: 5, hp: '10000000', attack: 6000,  goldDrop: '500000',  xpDrop: '750000', lootTable: [
    { itemId: 'dragonbone_blade', weight: 100 },
  ] },
];

// ── Backward-compat: expose `zone` as alias for `area` ─────────────
for (const e of WORLD_1_ENEMIES) {
  Object.defineProperty(e, 'zone', {
    get() { return this.area; },
    enumerable: false,
  });
}

export function getEnemiesForZone(zone) {
  return WORLD_1_ENEMIES.filter(e => e.area === zone);
}

export function getRandomEnemy(zone) {
  const pool = getEnemiesForZone(zone);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getEnemyById(id) {
  return WORLD_1_ENEMIES.find(e => e.id === id);
}

export { WORLD_1_ENEMIES };
