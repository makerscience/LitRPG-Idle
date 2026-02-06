// World 1 enemy definitions — 5 zones.
// IDs use w{world}z{zone}_{name} format.

const WORLD_1_ENEMIES = [
  // Zone 1 (HP 10–50)
  { id: 'w1z1_rat',    name: 'Sewer Rat',       zone: 1, hp: '10',  attack: 2,  goldDrop: '5',   xpDrop: '8',   lootTable: [] },
  { id: 'w1z1_slime',  name: 'Green Slime',     zone: 1, hp: '25',  attack: 3,  goldDrop: '10',  xpDrop: '15',  lootTable: [] },
  { id: 'w1z1_goblin', name: 'Goblin Grunt',    zone: 1, hp: '50',  attack: 5,  goldDrop: '20',  xpDrop: '30',  lootTable: [] },

  // Zone 2 (HP 100–500)
  { id: 'w1z2_wolf',    name: 'Dire Wolf',        zone: 2, hp: '100',  attack: 12,  goldDrop: '50',   xpDrop: '60',   lootTable: [] },
  { id: 'w1z2_skeleton',name: 'Skeleton Soldier',  zone: 2, hp: '250',  attack: 18,  goldDrop: '100',  xpDrop: '120',  lootTable: [] },
  { id: 'w1z2_bandit',  name: 'Bandit Captain',    zone: 2, hp: '500',  attack: 25,  goldDrop: '200',  xpDrop: '250',  lootTable: [] },

  // Zone 3 (HP 1K–10K)
  { id: 'w1z3_orc',   name: 'Orc Berserker', zone: 3, hp: '1000',   attack: 50,   goldDrop: '500',   xpDrop: '600',   lootTable: [] },
  { id: 'w1z3_troll', name: 'Cave Troll',    zone: 3, hp: '5000',   attack: 80,   goldDrop: '1500',  xpDrop: '2000',  lootTable: [] },
  { id: 'w1z3_mage',  name: 'Dark Mage',     zone: 3, hp: '10000',  attack: 120,  goldDrop: '3000',  xpDrop: '4000',  lootTable: [] },

  // Zone 4 (HP 50K–500K)
  { id: 'w1z4_whelp',  name: 'Dragon Whelp', zone: 4, hp: '50000',   attack: 300,   goldDrop: '10000',   xpDrop: '15000',  lootTable: [] },
  { id: 'w1z4_golem',  name: 'Iron Golem',   zone: 4, hp: '200000',  attack: 500,   goldDrop: '50000',   xpDrop: '60000',  lootTable: [] },
  { id: 'w1z4_lich',   name: 'Lich Lord',    zone: 4, hp: '500000',  attack: 800,   goldDrop: '100000',  xpDrop: '150000', lootTable: [] },

  // Zone 5 (boss)
  { id: 'w1z5_dragon', name: 'Elder Dragon', zone: 5, hp: '2000000', attack: 2000,  goldDrop: '500000',  xpDrop: '750000', lootTable: [] },
];

export function getEnemiesForZone(zone) {
  return WORLD_1_ENEMIES.filter(e => e.zone === zone);
}

export function getRandomEnemy(zone) {
  const pool = getEnemiesForZone(zone);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export { WORLD_1_ENEMIES };
