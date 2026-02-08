// World 1 enemy definitions — 5 zones.
// IDs use w{world}z{zone}_{name} format.

const WORLD_1_ENEMIES = [
  // Zone 1 (HP 10–50)
  { id: 'w1z1_rat',    name: 'Sewer Rat',       zone: 1, hp: '10',  attack: 2,  goldDrop: '5',   xpDrop: '8',
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
  { id: 'w1z1_slime',  name: 'Green Slime',     zone: 1, hp: '20',  attack: 3,  goldDrop: '10',  xpDrop: '15',
    sprites: {
      default:  'slime001_default',
      reaction: 'slime001_reaction',
      attack:   'slime001_attack',
      dead:     'slime001_dead',
    },
    lootTable: [
    { itemId: 'iron_dagger', weight: 40 }, { itemId: 'iron_helm', weight: 30 }, { itemId: 'leather_tunic', weight: 30 },
  ] },
  { id: 'w1z1_goblin', name: 'Goblin Grunt',    zone: 1, hp: '40',  attack: 5,  goldDrop: '20',  xpDrop: '30',
    sprites: {
      default:  'goblin001_default',
      reaction: 'goblin001_reaction',
      attack:   'goblin001_attack',
      dead:     'goblin001_dead',
    },
    lootTable: [
    { itemId: 'iron_dagger', weight: 40 }, { itemId: 'iron_helm', weight: 30 }, { itemId: 'leather_tunic', weight: 30 },
  ] },

  // Zone 2 (HP 100–500)
  { id: 'w1z2_wolf',    name: 'Dire Wolf',        zone: 2, hp: '80',   attack: 12,  goldDrop: '50',   xpDrop: '80',   lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },
  { id: 'w1z2_skeleton',name: 'Skeleton Soldier',  zone: 2, hp: '200',  attack: 18,  goldDrop: '100',  xpDrop: '160',  lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },
  { id: 'w1z2_bandit',  name: 'Bandit Captain',    zone: 2, hp: '400',  attack: 25,  goldDrop: '200',  xpDrop: '300',  lootTable: [
    { itemId: 'steel_sword', weight: 25 }, { itemId: 'leather_cap', weight: 30 }, { itemId: 'chainmail_vest', weight: 25 }, { itemId: 'iron_greaves', weight: 20 },
  ] },

  // Zone 3 (HP 1K–10K)
  { id: 'w1z3_orc',   name: 'Orc Berserker', zone: 3, hp: '800',    attack: 50,   goldDrop: '500',   xpDrop: '800',   lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },
  { id: 'w1z3_troll', name: 'Cave Troll',    zone: 3, hp: '3000',   attack: 80,   goldDrop: '1500',  xpDrop: '2500',  lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },
  { id: 'w1z3_mage',  name: 'Dark Mage',     zone: 3, hp: '6000',   attack: 120,  goldDrop: '3000',  xpDrop: '5000',  lootTable: [
    { itemId: 'mithril_blade', weight: 30 }, { itemId: 'steel_helm', weight: 35 }, { itemId: 'steel_greaves', weight: 35 },
  ] },

  // Zone 4 (HP 50K–500K)
  { id: 'w1z4_whelp',  name: 'Dragon Whelp', zone: 4, hp: '25000',   attack: 300,   goldDrop: '10000',   xpDrop: '15000',  lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },
  { id: 'w1z4_golem',  name: 'Iron Golem',   zone: 4, hp: '100000',  attack: 500,   goldDrop: '50000',   xpDrop: '60000',  lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },
  { id: 'w1z4_lich',   name: 'Lich Lord',    zone: 4, hp: '250000',  attack: 800,   goldDrop: '100000',  xpDrop: '150000', lootTable: [
    { itemId: 'adamantine_axe', weight: 100 },
  ] },

  // Zone 5 (boss)
  { id: 'w1z5_dragon', name: 'Elder Dragon', zone: 5, hp: '1000000', attack: 2000,  goldDrop: '500000',  xpDrop: '750000', lootTable: [
    { itemId: 'dragonbone_blade', weight: 100 },
  ] },
];

export function getEnemiesForZone(zone) {
  return WORLD_1_ENEMIES.filter(e => e.zone === zone);
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
