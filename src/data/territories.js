// Territory definitions for the Overworld Map.
// Each territory maps to one enemy type and provides a unique buff when conquered.

const TERRITORIES = [
  // Area 1: Forest
  {
    id: 'forest_rats_nest', name: "Forest Rat's Nest", area: 1,
    enemyId: 'w1z1_rat',
    buff: { key: 'goldGain', label: '+15% Gold Gain', value: 0.15 },
    killsRequired: 50, goldCost: '500',
    description: 'A nest of oversized forest rats hoarding stolen coins.',
    mapPosition: { x: 150, y: 540 },
  },
  {
    id: 'slime_pit', name: 'Slime Pit', area: 1,
    enemyId: 'w1z1_slime',
    buff: { key: 'hpRegen', label: '+20% HP Regen', value: 0.20 },
    killsRequired: 40, goldCost: '800',
    description: 'A bubbling pit of regenerative slime.',
    mapPosition: { x: 310, y: 540 },
  },
  {
    id: 'goblin_warren', name: 'Goblin Warren', area: 1,
    enemyId: 'w1z1_goblin',
    buff: { key: 'xpGain', label: '+10% XP Gain', value: 0.10 },
    killsRequired: 30, goldCost: '1200',
    description: 'A network of goblin tunnels filled with crude training dummies.',
    mapPosition: { x: 470, y: 540 },
  },

  // Area 2: Wilderness
  {
    id: 'wolf_den', name: 'Wolf Den', area: 2,
    enemyId: 'w1z2_wolf',
    buff: { key: 'critChance', label: '+3% Crit Chance', value: 0.03 },
    killsRequired: 40, goldCost: '5000',
    description: 'A den of dire wolves. Their ferocity is contagious.',
    mapPosition: { x: 150, y: 430 },
  },
  {
    id: 'skeleton_crypt', name: 'Skeleton Crypt', area: 2,
    enemyId: 'w1z2_skeleton',
    buff: { key: 'flatStr', label: '+5 STR', value: 5 },
    killsRequired: 30, goldCost: '15000',
    description: 'Ancient bones infused with martial memory.',
    mapPosition: { x: 310, y: 430 },
  },
  {
    id: 'bandit_hideout', name: 'Bandit Hideout', area: 2,
    enemyId: 'w1z2_bandit',
    buff: { key: 'goldGain', label: '+10% Gold Gain', value: 0.10 },
    killsRequired: 20, goldCost: '30000',
    description: 'A hideout stuffed with ill-gotten gains.',
    mapPosition: { x: 470, y: 430 },
  },

  // Area 3: Deep Caverns
  {
    id: 'orc_camp', name: 'Orc Camp', area: 3,
    enemyId: 'w1z3_orc',
    buff: { key: 'baseDamage', label: '+10% Base Damage', value: 0.10 },
    killsRequired: 25, goldCost: '100000',
    description: 'An orcish war camp. Their battle techniques are... educational.',
    mapPosition: { x: 150, y: 320 },
  },
  {
    id: 'troll_cave', name: 'Troll Cave', area: 3,
    enemyId: 'w1z3_troll',
    buff: { key: 'maxHp', label: '+15% Max HP', value: 0.15 },
    killsRequired: 15, goldCost: '300000',
    description: 'A cave where troll regeneration seeps into the walls.',
    mapPosition: { x: 310, y: 320 },
  },
  {
    id: 'mage_tower', name: 'Mage Tower', area: 3,
    enemyId: 'w1z3_mage',
    buff: { key: 'fragmentDropRate', label: '+10% Fragment Drop Rate', value: 0.10 },
    killsRequired: 10, goldCost: '500000',
    description: 'A tower crackling with unstable magical energy.',
    mapPosition: { x: 470, y: 320 },
  },

  // Area 4: Volcanic Ruins
  {
    id: 'dragon_nursery', name: 'Dragon Nursery', area: 4,
    enemyId: 'w1z4_whelp',
    buff: { key: 'autoAttackSpeed', label: '+10% Attack Speed', value: 0.10 },
    killsRequired: 15, goldCost: '2000000',
    description: 'Hatchlings snap at you faster than you can blink.',
    mapPosition: { x: 150, y: 210 },
  },
  {
    id: 'golem_foundry', name: 'Golem Foundry', area: 4,
    enemyId: 'w1z4_golem',
    buff: { key: 'flatVit', label: '+8 VIT', value: 8 },
    killsRequired: 8, goldCost: '5000000',
    description: 'Iron-forged resilience, now in adventurer size.',
    mapPosition: { x: 310, y: 210 },
  },
  {
    id: 'lich_sanctum', name: 'Lich Sanctum', area: 4,
    enemyId: 'w1z4_lich',
    buff: { key: 'prestigeMultiplier', label: '+10% Prestige Multiplier', value: 0.10 },
    killsRequired: 5, goldCost: '10000000',
    description: 'Dark knowledge that transcends death... and resets.',
    mapPosition: { x: 470, y: 210 },
  },

  // Area 5: Dragon's Lair
  {
    id: 'elder_dragons_hoard', name: "Elder Dragon's Hoard", area: 5,
    enemyId: 'w1z5_dragon',
    buff: { key: 'allIncome', label: '+15% All Income', value: 0.15 },
    killsRequired: 3, goldCost: '50000000',
    description: 'The ultimate treasure. Everything earns more.',
    mapPosition: { x: 310, y: 100 },
  },
];

export function getTerritory(id) {
  return TERRITORIES.find(t => t.id === id);
}

export function getTerritoriesForZone(zone) {
  return TERRITORIES.filter(t => t.area === zone);
}

export function getTerritoriesForArea(areaId) {
  return TERRITORIES.filter(t => t.area === areaId);
}

export function getAllTerritories() {
  return TERRITORIES;
}

export { TERRITORIES };
