# Game Data Reference

> Complete reference for all game data in the LitRPG Idle vertical slice (Areas 1-3, Zones 1-30).
> Generated from source files on 2026-02-14.

---

## Table of Contents

1. [Combat Formulas](#1-combat-formulas)
2. [Player Base Stats & Growth](#2-player-base-stats--growth)
3. [XP Curve](#3-xp-curve)
4. [Upgrades](#4-upgrades)
5. [Equipment Slot Unlocks](#5-equipment-slot-unlocks)
6. [All Equipment](#6-all-equipment)
7. [All Enemies](#7-all-enemies-20-total)
8. [All Bosses](#8-all-bosses-30-total)
9. [Zone Scaling & Boss Thresholds](#9-zone-scaling--boss-thresholds)
10. [Loot System](#10-loot-system)
11. [Balance Sim Snapshot](#11-balance-sim-snapshot)

---

## 1. Combat Formulas

**Source:** `src/config.js` — `COMBAT_V2`

| Formula | Expression | Notes |
|---------|-----------|-------|
| Player damage | `STR - (EnemyDEF * 0.3)`, min 1 | STR includes base + level + gear + upgrades |
| Enemy damage | `EnemyATK - (PlayerDEF * (1 - armorPen) * 0.5)`, min 1 | armorPen reduces DEF effectiveness (0-1) |
| DoT damage | Flat X HP/sec | Bypasses defense entirely |
| Player attack interval | `2000ms / atkSpeed`, min 400ms | Auto-Attack Speed upgrade reduces further |
| Enemy attack interval | `2000ms / enemyAtkSpeed`, min 400ms | |
| Spawn delay | 1000ms after kill | Before next enemy appears |
| Death respawn delay | 1500ms | Before player respawns |

**Effective HP in combat:**
- `Time to Die = MaxHP / max(totalEnemyDPS - regen, 0.01)`
- `totalEnemyDPS = (hitDamage / hitInterval) + dotDPS`

---

## 2. Player Base Stats & Growth

**Source:** `src/config.js` — `PROGRESSION_V2`

### Starting Stats (Level 1)

| Stat | Value |
|------|-------|
| STR | 10 |
| DEF | 5 |
| HP | 100 |
| Regen | 1.0 HP/sec |
| Atk Speed | 1.0 |

### Per-Level Growth

| Stat | Per Level |
|------|-----------|
| STR | +2 |
| DEF | +2 |
| HP | +12 |
| Regen | +0.1 |

### Stats by Level (base only, no gear/upgrades)

| Level | STR | DEF | HP | Regen |
|-------|-----|-----|----|-------|
| 1 | 10 | 5 | 100 | 1.0 |
| 5 | 18 | 13 | 148 | 1.4 |
| 10 | 28 | 23 | 208 | 1.9 |
| 15 | 38 | 33 | 268 | 2.4 |
| 20 | 48 | 43 | 328 | 2.9 |
| 25 | 58 | 53 | 388 | 3.4 |
| 30 | 68 | 63 | 448 | 3.9 |
| 35 | 78 | 73 | 508 | 4.4 |

---

## 3. XP Curve

**Source:** `src/config.js` — `PROGRESSION_V2.xpTable`

XP required to advance FROM the given level to the next. Beyond level 35, scales as `xpTable[34] * 1.1^(level - 35)`.

| Level | XP Required | Cumulative XP |
|-------|-------------|---------------|
| 1 | 50 | 50 |
| 2 | 75 | 125 |
| 3 | 110 | 235 |
| 4 | 155 | 390 |
| 5 | 210 | 600 |
| 6 | 280 | 880 |
| 7 | 360 | 1,240 |
| 8 | 450 | 1,690 |
| 9 | 560 | 2,250 |
| 10 | 680 | 2,930 |
| 11 | 820 | 3,750 |
| 12 | 980 | 4,730 |
| 13 | 1,160 | 5,890 |
| 14 | 1,360 | 7,250 |
| 15 | 1,580 | 8,830 |
| 16 | 1,830 | 10,660 |
| 17 | 2,100 | 12,760 |
| 18 | 2,400 | 15,160 |
| 19 | 2,750 | 17,910 |
| 20 | 3,120 | 21,030 |
| 21 | 3,530 | 24,560 |
| 22 | 3,980 | 28,540 |
| 23 | 4,480 | 33,020 |
| 24 | 5,020 | 38,040 |
| 25 | 5,620 | 43,660 |
| 26 | 6,280 | 49,940 |
| 27 | 7,000 | 56,940 |
| 28 | 7,800 | 64,740 |
| 29 | 8,680 | 73,420 |
| 30 | 9,640 | 83,060 |
| 31 | 10,700 | 93,760 |
| 32 | 11,870 | 105,630 |
| 33 | 13,150 | 118,780 |
| 34 | 14,560 | 133,340 |
| 35 | 16,100 | 149,440 |

---

## 4. Upgrades

**Source:** `src/data/upgrades.js`

### Gold Upgrades (Legit)

#### Sharpen Blade — +10% click damage per level (max 10)

Cost formula: `floor(75 * 1.8^level)`

| Level | Cost | Total Invested | Cumulative Effect |
|-------|------|----------------|-------------------|
| 1 | 75 | 75 | +10% click dmg |
| 2 | 135 | 210 | +20% |
| 3 | 243 | 453 | +30% |
| 4 | 437 | 890 | +40% |
| 5 | 787 | 1,677 | +50% |
| 6 | 1,417 | 3,094 | +60% |
| 7 | 2,551 | 5,645 | +70% |
| 8 | 4,592 | 10,237 | +80% |
| 9 | 8,266 | 18,503 | +90% |
| 10 | 14,879 | 33,382 | +100% |

#### Battle Hardening — +2 STR per level (max 10)

Cost formula: `floor(120 * 1.8^level)`

| Level | Cost | Total Invested | Cumulative Effect |
|-------|------|----------------|-------------------|
| 1 | 120 | 120 | +2 STR |
| 2 | 216 | 336 | +4 STR |
| 3 | 388 | 724 | +6 STR |
| 4 | 699 | 1,423 | +8 STR |
| 5 | 1,259 | 2,682 | +10 STR |
| 6 | 2,267 | 4,949 | +12 STR |
| 7 | 4,082 | 9,031 | +14 STR |
| 8 | 7,347 | 16,378 | +16 STR |
| 9 | 13,225 | 29,603 | +18 STR |
| 10 | 23,806 | 53,409 | +20 STR |

#### Auto-Attack Speed — -10% auto-attack interval per level (max 5)

Cost formula: `floor(150 * 2^level)`

| Level | Cost | Total Invested | Cumulative Effect |
|-------|------|----------------|-------------------|
| 1 | 150 | 150 | -10% interval |
| 2 | 300 | 450 | -20% |
| 3 | 600 | 1,050 | -30% |
| 4 | 1,200 | 2,250 | -40% |
| 5 | 2,400 | 4,650 | -50% |

#### Gold Find — +15% gold drops per level (max 10)

Cost formula: `floor(60 * 1.7^level)`

| Level | Cost | Total Invested | Cumulative Effect |
|-------|------|----------------|-------------------|
| 1 | 60 | 60 | +15% gold |
| 2 | 102 | 162 | +30% |
| 3 | 173 | 335 | +45% |
| 4 | 294 | 629 | +60% |
| 5 | 500 | 1,129 | +75% |
| 6 | 851 | 1,980 | +90% |
| 7 | 1,447 | 3,427 | +105% |
| 8 | 2,460 | 5,887 | +120% |
| 9 | 4,183 | 10,070 | +135% |
| 10 | 7,112 | 17,182 | +150% |

### Exploit Upgrades (Fragment Cost)

Visible after crackTriggered flag is set.

#### Unstable Crit — +5% crit chance per level (max 5)

Cost formula: `floor(3 * 2^level)` (glitch fragments)

| Level | Cost | Cumulative Effect |
|-------|------|-------------------|
| 1 | 3 | +5% crit chance |
| 2 | 6 | +10% |
| 3 | 12 | +15% |
| 4 | 24 | +20% |
| 5 | 48 | +25% |

#### Memory Leak — +25% gold multiplier per level (max 5)

Cost formula: `floor(5 * 2^level)` (glitch fragments)

| Level | Cost | Cumulative Effect |
|-------|------|-------------------|
| 1 | 5 | +25% gold |
| 2 | 10 | +50% |
| 3 | 20 | +75% |
| 4 | 40 | +100% |
| 5 | 80 | +125% |

---

## 5. Equipment Slot Unlocks

**Source:** `src/data/equipSlots.js` — `V2_ACTIVE_SLOTS`

7 active equipment slots in the vertical slice, unlocked by reaching the specified zone.

| Slot | Label | Unlock Zone | Item Slot | Side |
|------|-------|-------------|-----------|------|
| head | Helmet | Zone 1 | head | Left |
| chest | Chest | Zone 1 | body | Left |
| main_hand | Main Hand | Zone 1 | weapon | Right |
| legs | Legs | Zone 6 | legs | Left |
| boots | Boots | Zone 9 | boots | Left |
| gloves | Gloves | Zone 17 | gloves | Right |
| amulet | Amulet | Zone 22 | amulet | Right |

---

## 6. All Equipment

**Source:** `src/data/items.js`

Stat bonuses listed as: STR / DEF / HP / Regen / AtkSpd / ATK. Zero values omitted for readability.

### Area 1 — The Harsh Threshold (Zones 1-5)

#### Common

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Sharpened Stick | weapon | 1-5 | 3 | — | — | — | — | 3 | 5 |
| Scavenged Hide Wrap | body | 1-5 | — | 3 | 10 | — | — | — | 5 |
| Bone Fragment Helm | head | 1-5 | — | 2 | 5 | — | — | — | 4 |

#### Uncommon

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Bone Shard Blade | weapon | 1-5 | 4 | 1 | — | — | — | 4 | 12 |
| Thick Pelt Vest | body | 1-5 | — | 4 | 15 | — | — | — | 14 |
| Hound Skull Cap | head | 1-5 | — | 3 | 8 | — | — | — | 10 |

### Area 2 — The Overgrown Frontier (Zones 6-15)

#### Common Tier 1 (Zones 6-10)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Salvaged Cleaver | weapon | 6-10 | 7 | — | — | — | — | 7 | 10 |
| Patched Leather Vest | body | 6-10 | — | 6 | 20 | — | — | — | 10 |
| Hardened Leather Hood | head | 6-10 | — | 4 | 10 | — | — | — | 8 |
| Stitched Hide Leggings | legs | 6-10 | — | 4 | 12 | — | — | — | 9 |
| Worn Traveler's Boots | boots | 6-10 | — | 2 | 5 | — | — | — | 8 |

#### Common Tier 2 (Zones 11-15)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Sharpened Cleaver | weapon | 11-15 | 9 | — | — | — | — | 9 | 16 |
| Reinforced Leather Vest | body | 11-15 | — | 8 | 28 | — | — | — | 18 |
| Boiled Leather Hood | head | 11-15 | — | 5 | 14 | — | — | — | 14 |
| Thick Hide Leggings | legs | 11-15 | — | 5 | 16 | — | — | — | 15 |
| Mended Traveler's Boots | boots | 11-15 | — | 3 | 8 | — | — | — | 12 |

#### Uncommon (Zones 8-15)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Frontier Hatchet | weapon | 8-15 | 11 | — | — | — | 0.05 | 11 | 35 |
| Ranger's Coat | body | 8-15 | — | 10 | 35 | — | — | — | 38 |
| Scout's Halfhelm | head | 8-15 | — | 7 | 18 | 0.2 | — | — | 32 |
| Reinforced Trousers | legs | 8-15 | — | 7 | 22 | — | — | — | 30 |
| Wayfinder Boots | boots | 8-15 | — | 3 | — | — | 0.05 | — | 28 |

### Area 3 — The Broken Road (Zones 16-30)

#### Common Tier A (Zones 16-20)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Reclaimed Shortsword | weapon | 16-20 | 13 | — | — | — | — | 13 | 22 |
| Road Warden's Hauberk | body | 16-20 | — | 11 | 38 | — | — | — | 24 |
| Stone-carved Halfhelm | head | 16-20 | — | 7 | 20 | — | — | — | 18 |
| Road Warden's Greaves | legs | 16-20 | — | 7 | 24 | — | — | — | 20 |
| Ironshod Marching Boots | boots | 16-20 | — | 4 | 10 | — | — | — | 16 |
| Scavenged Gauntlets | gloves | 16-20 | 3 | 3 | — | — | — | — | 16 |

#### Common Tier B (Zones 21-25)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Sentinel's Blade | weapon | 21-25 | 17 | — | — | — | — | 17 | 32 |
| Sentinel Half-Plate | body | 21-25 | — | 14 | 48 | — | — | — | 35 |
| Sentinel's Visage | head | 21-25 | — | 9 | 26 | — | — | — | 26 |
| Sentinel Greaves | legs | 21-25 | — | 9 | 30 | — | — | — | 28 |
| Sentinel Treads | boots | 21-25 | — | 5 | 14 | — | — | — | 22 |
| Sentinel Gauntlets | gloves | 21-25 | 5 | 4 | — | — | — | — | 24 |
| Cracked Hearthstone | amulet | 21-25 | — | — | 15 | 0.4 | — | — | 25 |

#### Common Tier C (Zones 26-30)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Keeper's Longsword | weapon | 26-30 | 22 | — | — | — | — | 22 | 45 |
| Keeper's Wardplate | body | 26-30 | — | 18 | 60 | — | — | — | 50 |
| Keeper's Crown | head | 26-30 | — | 11 | 32 | 0.3 | — | — | 38 |
| Keeper's Legguards | legs | 26-30 | — | 12 | 36 | — | — | — | 40 |
| Keeper's Stride | boots | 26-30 | — | 6 | 18 | — | — | — | 30 |
| Keeper's Grip | gloves | 26-30 | 7 | 5 | — | — | — | — | 35 |
| Warm Hearthstone | amulet | 26-30 | — | — | 25 | 0.6 | — | — | 38 |

#### Uncommon (Zones 20-30)

| Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell |
|------|------|-------|-----|-----|----|-------|--------|-----|------|
| Warden's Oath | weapon | 22-30 | 26 | 6 | — | — | — | 26 | 80 |
| Ancient Sentinel Plate | body | 24-30 | — | 20 | 70 | — | — | — | 85 |
| Visage of the First | head | 26-30 | — | 13 | 35 | 0.5 | — | — | 70 |
| Stoneguard Legplates | legs | 24-30 | — | 14 | 40 | — | — | — | 72 |
| Pathfinder's Stride | boots | 20-30 | — | 7 | — | — | 0.08 | — | 55 |
| Irongrip Gauntlets | gloves | 22-30 | 9 | 6 | — | — | — | — | 65 |
| Heartstone Pendant | amulet | 26-30 | — | 3 | 35 | 0.8 | — | — | 75 |

---

## 7. All Enemies (20 total)

**Source:** `src/data/enemies.js`

Stats shown are base values before zone scaling. Zone scaling applies: `stat * (1 + (localZone - 1) * 0.15)`.

### Area 1 — The Harsh Threshold (Zones 1-5)

| Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP |
|-------|-----|-----|--------|-----|----------|-----|-------|------|----|
| Hollow Slime | 12 | 5 | 0.7 | 0 | 0 | — | 1-2 | 3 | 3 |
| Forest Rat | 15 | 7 | 1.4 | 0 | 0 | — | 1-3 | 4 | 4 |
| Feral Hound | 20 | 9 | 1.2 | 0 | 0 | — | 1-3 | 5 | 5 |
| Thornback Boar | 40 | 15 | 0.8 | 0 | 0 | — | 2-4 | 10 | 10 |
| Blighted Stalker | 55 | 21 | 1.0 | 0 | 0 | — | 3-5 | 14 | 14 |

### Area 2 — The Overgrown Frontier (Zones 6-15)

| Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP |
|-------|-----|-----|--------|-----|----------|-----|-------|------|----|
| Rot Vine Crawler | 65 | 24 | 1.0 | 0 | 0 | — | 6-9 | 16 | 16 |
| Mire Lurker | 95 | 36 | 0.7 | 0 | 0 | — | 8-12 | 24 | 24 |
| Wisp Swarm | 45 | 18 | 1.5 | 0 | 0 | — | 9-13 | 11 | 11 |
| Blight Stalker (Evolved) | 85 | 30 | 1.0 | 0 | 0 | 2 | 11-14 | 21 | 21 |
| Bog Revenant | 130 | 42 | 0.9 | 0 | 0 | — | 13-15 | 33 | 33 |

### Area 3 — The Broken Road (Zones 16-30)

#### Sub-Region A: The Weathered Path (Zones 16-20)

| Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP |
|-------|-----|-----|--------|-----|----------|-----|-------|------|----|
| Stone Sentry | 170 | 48 | 0.6 | 0 | 0 | — | 16-20 | 43 | 43 |
| Fractured Echo | 75 | 27 | 2.0 | 0 | 0 | — | 16-19 | 19 | 19 |
| Ruin Pilgrim | 120 | 39 | 1.1 | 0 | 0 | — | 18-20 | 30 | 30 |

#### Sub-Region B: The Outer Ruins (Zones 21-25)

| Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP |
|-------|-----|-----|--------|-----|----------|-----|-------|------|----|
| Shade Remnant | 130 | 48 | 1.0 | 0 | 0.30 | — | 21-25 | 33 | 33 |
| Blighted Guardian | 190 | 63 | 0.9 | 0 | 0 | — | 22-25 | 48 | 48 |
| Ruin Pilgrim (Frenzied) | 140 | 45 | 1.3 | 0 | 0 | — | 21-24 | 35 | 35 |

#### Sub-Region C: The Inner Sanctum (Zones 26-30)

| Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP |
|-------|-----|-----|--------|-----|----------|-----|-------|------|----|
| Hearthguard Construct | 250 | 66 | 0.7 | 0 | 0 | — | 26-30 | 63 | 63 |
| Blighted Scholar | 160 | 54 | 1.0 | 0 | 0.25 | 3 | 27-30 | 40 | 40 |
| Corruption Tendril | 100 | 36 | 1.8 | 0 | 0 | — | 26-29 | 25 | 25 |
| Shade of the Keeper | 200 | 60 | 0.9 | 0 | 0.35 | — | 28-30 | 50 | 50 |

---

## 8. All Bosses (30 total)

**Source:** `src/data/bosses.js`

Boss stats are hardcoded (not derived from zone scaling). Each zone has exactly one boss.

### Area 1 — The Harsh Threshold (Zones 1-5)

| Zone | Boss | Title | Type | HP | ATK | AtkSpd | ArmorPen | DoT | Gold | XP |
|------|------|-------|------|----|-----|--------|----------|-----|------|----|
| 1 | Rotfang | Alpha Hound | MINI | 45 | 18 | 1.1 | 0 | — | 45 | 23 |
| 2 | Irontusk | Raging Boar | MINI | 70 | 28 | 0.8 | 0 | — | 70 | 35 |
| 3 | The Lurcher | Shadow Stalker | MINI | 95 | 35 | 0.9 | 0 | — | 95 | 48 |
| 4 | Blight Mother | Brood Queen | MINI | 120 | 42 | 0.9 | 0 | — | 120 | 60 |
| 5 | **THE HOLLOW** | Guardian of the Threshold | **AREA** | 250 | 63 | 0.7 | 0 | — | 250 | 125 |

### Area 2 — The Overgrown Frontier (Zones 6-15)

| Zone | Boss | Title | Type | HP | ATK | AtkSpd | ArmorPen | DoT | Gold | XP |
|------|------|-------|------|----|-----|--------|----------|-----|------|----|
| 6 | Rootmaw | Burrowing Vine | MINI | 130 | 42 | 0.9 | 0 | — | 130 | 65 |
| 7 | The Sunken | Swamp Predator | MINI | 155 | 49 | 0.8 | 0 | — | 155 | 78 |
| 8 | The Overgrowth | Living Thicket | MINI | 180 | 56 | 0.8 | 0 | — | 180 | 90 |
| 9 | Flickerswarm | Dancing Lights | MINI | 110 | 35 | 1.4 | 0 | — | 110 | 55 |
| 10 | Mire Mother | Queen of the Deep | ELITE | 230 | 63 | 0.7 | 0 | — | 230 | 115 |
| 11 | The Shuddering | Trembling Horror | MINI | 200 | 53 | 0.9 | 0 | 2 | 200 | 100 |
| 12 | Blightbark | Dead Forest Heart | MINI | 270 | 63 | 0.8 | 0 | — | 270 | 135 |
| 13 | The Unburied | Risen Traveler | MINI | 310 | 70 | 0.9 | 0 | — | 310 | 155 |
| 14 | The Lost Scout | Fallen Explorer | MINI | 350 | 77 | 0.9 | 0 | 2 | 350 | 175 |
| 15 | **THE LOST WARDEN** | Guardian of the Frontier | **AREA** | 600 | 88 | 0.6 | 0 | 3 | 600 | 300 |

### Area 3 — The Broken Road (Zones 16-30)

| Zone | Boss | Title | Type | HP | ATK | AtkSpd | ArmorPen | DoT | Gold | XP |
|------|------|-------|------|----|-----|--------|----------|-----|------|----|
| 16 | The Forgotten | Fading Memory | MINI | 320 | 70 | 1.0 | 0 | — | 320 | 160 |
| 17 | Bridge Warden | Stone Guardian | MINI | 370 | 77 | 0.7 | 0 | — | 370 | 185 |
| 18 | The Penitent | Crawling Pilgrim | MINI | 400 | 84 | 1.0 | 0 | — | 400 | 200 |
| 19 | Echoing Congregation | Choir of Echoes | MINI | 280 | 63 | 1.6 | 0 | — | 280 | 140 |
| 20 | **THE ETERNAL SENTRY** | Road Guardian | **ELITE** | 700 | 98 | 0.7 | 0 | — | 700 | 350 |
| 21 | Whispering Shade | Shadow Speaker | MINI | 430 | 84 | 1.0 | 0.25 | — | 430 | 215 |
| 22 | Fallen Captain | Corrupted Commander | MINI | 480 | 91 | 0.9 | 0 | — | 480 | 240 |
| 23 | Armory Keeper | Rusted Sentinel | MINI | 520 | 98 | 0.8 | 0 | — | 520 | 260 |
| 24 | The Nameless | Shadow Without Face | MINI | 460 | 88 | 0.9 | 0.30 | 3 | 460 | 230 |
| 25 | **CORRUPTED WARDEN** | Fallen Guardian | **ELITE** | 850 | 112 | 0.7 | 0.15 | 3 | 850 | 425 |
| 26 | The Heartrot | Blighted Core | MINI | 550 | 98 | 1.2 | 0 | — | 550 | 275 |
| 27 | The Last Scholar | Corrupt Librarian | MINI | 580 | 105 | 0.9 | 0.20 | 3 | 580 | 290 |
| 28 | The Unremembered | Lost Identity | MINI | 620 | 112 | 0.9 | 0.30 | — | 620 | 310 |
| 29 | The Blight Core | Corruption Nexus | MINI | 700 | 105 | 1.0 | 0 | 5 | 700 | 350 |
| 30 | **THE FIRST KEEPER** | Ancient Guardian | **AREA** | 1400 | 133 | 0.7 | 0.20 | 4 | 1400 | 700 |

### Boss Type Definitions

**Source:** `src/data/areas.js` — `BOSS_TYPES`

| Type | Label | HP Mult | ATK Mult | Size Mult |
|------|-------|---------|----------|-----------|
| MINI | Mini-Boss | 6x | 3x | 1.5x |
| ELITE | Elite Mini-Boss | 5x | 2x | 1.5x |
| AREA | Area Boss | 8x | 2.5x | 2x |

---

## 9. Zone Scaling & Boss Thresholds

**Source:** `src/data/areas.js`

### Area Definitions

| Area | Name | Zones | Zone Start |
|------|------|-------|------------|
| 1 | The Harsh Threshold | 5 (z1-5) | 1 |
| 2 | The Overgrown Frontier | 10 (z6-15) | 6 |
| 3 | The Broken Road | 15 (z16-30) | 16 |

### Zone Scaling Formula

Enemy stats are scaled by local zone position within their area:

`scaledStat = baseStat * (1 + (localZone - 1) * 0.15)`

| Local Zone | Scale Factor |
|------------|-------------|
| 1 | 1.00x |
| 2 | 1.15x |
| 3 | 1.30x |
| 4 | 1.45x |
| 5 | 1.60x |
| 6 | 1.75x |
| 7 | 1.90x |
| 8 | 2.05x |
| 9 | 2.20x |
| 10 | 2.35x |
| 11 | 2.50x |
| 12 | 2.65x |
| 13 | 2.80x |
| 14 | 2.95x |
| 15 | 3.10x |

### Boss Kill Threshold

Kills required in a zone before the "Challenge Boss" button appears:

`threshold = 10 + (localZone - 1) * 5`

| Local Zone | Kills Required |
|------------|---------------|
| 1 | 10 |
| 2 | 15 |
| 3 | 20 |
| 4 | 25 |
| 5 | 30 |
| 6 | 35 |
| 7 | 40 |
| 8 | 45 |
| 9 | 50 |
| 10 | 55 |
| 11 | 60 |
| 12 | 65 |
| 13 | 70 |
| 14 | 75 |
| 15 | 80 |

---

## 10. Loot System

**Source:** `src/config.js` — `LOOT_V2`

### Drop Chances

| Trigger | Drops | Details |
|---------|-------|---------|
| Normal enemy kill | 10% chance | 1 item if triggered |
| Boss first kill | 1 guaranteed drop | 30% chance of uncommon |
| Boss repeat kill | 1 guaranteed drop | 11% chance of uncommon |

### Rarity System

| Rarity | Weight | Stat Multiplier | Sell Multiplier |
|--------|--------|-----------------|-----------------|
| Common | 89 | 1.0x | 1.0x |
| Uncommon | 11 | 1.5x | 1.5x |

### Slot Weights (Loot Table)

When rolling from an area loot table, each item has a weight. Higher weight = more likely to drop.

| Slot | Weight |
|------|--------|
| Main Hand (weapon) | 16 |
| Chest (body) | 15 |
| Head | 14 |
| Legs | 14 |
| Boots | 14 |
| Gloves | 14 |
| Amulet | 13 |

### Pity System

After **5 consecutive boss kills** without an uncommon drop, the next boss kill guarantees an uncommon.

---

## 11. Balance Sim Snapshot

**Source:** `npm run balance:sim` — run on 2026-02-14

Assumptions:
- Common gear only (no uncommons)
- Idle play only (auto-attacks, no clicks)
- No crits, no prestige, no territory buffs
- Optimal upgrade purchasing (Battle Hardening > Atk Speed > Gold Find > Sharpen)
- Player grinds exactly boss threshold kills per zone

```
Zone | Lvl | STR  | DEF  |  HP  | Regen | AtkMs | eTTK  | eTTD  | eSurv | Boss                       | bTTK   | bTTD   | Win | bSurv | Gold
-----|-----|------|------|------|-------|-------|-------|-------|-------|----------------------------|--------|--------|-----|-------|------
   1 |   2 |   15 |   12 |  127 |   1.1 |  2000 |  2.41 |  1150 | 477.13 |  Rotfang                    |      6 |  23.09 |   Y |  3.85 |    25
   2 |   3 |   17 |   14 |  139 |   1.2 |  2000 |  2.91 | 411.85 | 141.44 |  Irontusk                   |   8.24 |  19.31 |   Y |  2.34 |    29
   3 |   5 |   23 |   18 |  163 |   1.4 |  1799 |   3.6 | 44.74 | 12.43 |  The Lurcher                |   7.43 |  15.83 |   Y |  2.13 |     7
   4 |   7 |   29 |   22 |  187 |   1.6 |  1600 |  4.06 | 31.96 |  7.87 |  Blight Mother              |   6.62 |  15.14 |   Y |  2.29 |    24
   5 |   9 |   35 |   26 |  211 |   1.8 |  1600 |  4.27 | 22.61 |   5.3 |  THE HOLLOW                 |  11.43 |  13.44 |   Y |  1.18 |   429
   6 |   9 |   39 |   35 |  238 |   1.8 |  1400 |  2.33 | 164.14 | 70.34 |  Rootmaw                    |   4.67 |   25.8 |   Y |  5.53 |   287
   7 |  10 |   43 |   37 |  250 |   1.9 |  1400 |  2.53 | 80.68 | 31.93 |  The Sunken                 |   5.05 |  24.27 |   Y |  4.81 |   256
   8 |  10 |   43 |   37 |  250 |   1.9 |  1400 |  3.37 | 37.88 | 11.24 |  The Overgrowth             |   5.86 |  19.08 |   Y |  3.26 |   433
   9 |  11 |   47 |   41 |  267 |     2 |  1400 |  2.94 | 38.26 | 13.02 |  Flickerswarm               |   3.28 |  32.76 |   Y |    10 |   416
  10 |  12 |   49 |   43 |  279 |   2.1 |  1200 |  2.74 | 29.52 | 10.76 |  Mire Mother                |   5.63 |  22.45 |   Y |  3.99 |   207
  11 |  13 |   55 |   50 |  310 |   2.2 |  1200 |  2.85 | 27.96 |  9.81 |  The Shuddering             |   4.36 |     25 |   Y |  5.73 |   455
  12 |  14 |   57 |   52 |  322 |   2.3 |  1000 |  2.49 | 25.22 | 10.12 |  Blightbark                 |   4.74 |  25.76 |   Y |  5.44 |   381
  13 |  16 |   63 |   56 |  346 |   2.5 |  1000 |  2.81 | 20.51 |  7.29 |  The Unburied               |   4.92 |   21.1 |   Y |  4.29 |   624
  14 |  17 |   65 |   58 |  358 |   2.6 |  1000 |  3.64 | 16.16 |  4.44 |  The Lost Scout             |   5.38 |  17.05 |   Y |  3.17 |  1667
  15 |  19 |   71 |   62 |  382 |   2.8 |  1000 |   4.3 | 13.97 |  3.25 |  THE LOST WARDEN            |   8.45 |  22.08 |   Y |  2.61 |  2386
  16 |  19 |   75 |   70 |  408 |   2.8 |  1000 |  1.63 | 40800 | 24979.59 |  The Forgotten              |   4.27 |  27.76 |   Y |  6.51 |  3770
  17 |  20 |   80 |   75 |  420 |   2.9 |  1000 |  1.76 | 622.22 | 354.29 |  Bridge Warden              |   4.63 |  38.44 |   Y |  8.31 |  1609
  18 |  20 |   80 |   75 |  420 |   2.9 |  1000 |  1.98 | 100.2 | 50.73 |  The Penitent               |      5 |  20.64 |   Y |  4.13 |  4388
  19 |  20 |   80 |   75 |  420 |   2.9 |  1000 |   2.2 | 54.64 | 24.84 |  Echoing Congregation       |    3.5 |     24 |   Y |  6.86 |  3029
  20 |  21 |   82 |   77 |  432 |     3 |  1000 |  2.83 | 43.36 | 15.33 |  THE ETERNAL SENTRY         |   8.54 |  24.24 |   Y |  2.84 |  1638
  21 |  22 |   90 |   88 |  470 |   3.1 |  1000 |  2.68 |  20.3 |  7.57 |  Whispering Shade           |   4.78 |  20.98 |   Y |  4.39 |  7858
  22 |  22 |   92 |   88 |  485 |   3.5 |  1000 |  3.17 | 17.43 |   5.5 |  Fallen Captain             |   5.22 |  27.48 |   Y |  5.27 |  3115
  23 |  23 |   94 |   90 |  497 |   3.6 |  1000 |  3.34 | 15.77 |  4.72 |  Armory Keeper              |   5.53 |  28.24 |   Y |   5.1 |  4971
  24 |  24 |   96 |   92 |  509 |   3.7 |  1000 |  3.51 | 14.53 |  4.14 |  The Nameless               |   4.79 |  20.85 |   Y |  4.35 |  1795
  25 |  25 |   98 |   94 |  521 |   3.8 |  1000 |  3.83 | 13.37 |  3.49 |  CORRUPTED WARDEN           |   8.67 |  21.34 |   Y |  2.46 | 16900
  26 |  26 |  109 |  107 |  571 |   4.4 |  1000 |  4.01 | 13.64 |   3.4 |  The Heartrot               |   5.05 |  25.61 |   Y |  5.07 | 10852
  27 |  27 |  111 |  109 |  583 |   4.5 |  1000 |  4.06 | 12.28 |  3.03 |  The Last Scholar           |   5.23 |  22.31 |   Y |  4.27 | 30567
  28 |  29 |  115 |  113 |  607 |   4.7 |  1000 |   4.4 |  11.2 |  2.55 |  The Unremembered           |   5.39 |  21.75 |   Y |  4.04 | 53887
  29 |  30 |  117 |  115 |  619 |   4.8 |  1000 |  4.47 | 10.95 |  2.45 |  The Blight Core            |   5.98 |  25.85 |   Y |  4.32 | 80087
  30 |  31 |  119 |  117 |  631 |   4.9 |  1000 |   5.3 | 11.21 |  2.12 |  THE FIRST KEEPER           |  11.76 |  21.56 |   Y |  1.83 | 115187
```

**Legend:** eTTK = enemy time-to-kill (sec), eTTD = enemy time-to-die (sec), eSurv = survival ratio (>1 = win), bTTK/bTTD/bSurv = same for boss, AtkMs = player attack interval in ms, Gold = gold on hand after zone.

### GDD Checkpoint Comparison

| Zone | Checkpoint | Stat | Actual | Target | Diff |
|------|-----------|------|--------|--------|------|
| 5 | Area 1 exit | Level | 9 | ~7 | +28.6% |
| 5 | | STR | 35 | ~25 | +40.0% |
| 5 | | DEF | 26 | ~24 | +8.3% |
| 5 | | HP | 211 | ~177 | +19.2% |
| 15 | Area 2 exit | Level | 19 | ~18 | +5.6% |
| 15 | | STR | 71 | ~45 | +57.8% |
| 15 | | DEF | 62 | ~46 | +34.8% |
| 15 | | HP | 382 | ~370 | +3.2% |
| 30 | Area 3 exit | Level | 31 | ~35 | -11.4% |
| 30 | | STR | 119 | ~97 | +22.7% |
| 30 | | DEF | 117 | ~90 | +30.0% |
| 30 | | HP | 631 | ~690 | -8.6% |

### Boss Pass/Fail Summary

- **Passed: 30/30** | Failed: 0/30
- Final Boss: THE FIRST KEEPER — survival ratio 1.83x (target: 1.1-2.0x)
- Final player: Lv31 STR=119 DEF=117 HP=631 Regen=4.9

### Final Upgrade Levels (Sim)

| Upgrade | Final Level |
|---------|-------------|
| Battle Hardening | 10/10 |
| Auto-Attack Speed | 5/5 |
| Gold Find | 10/10 |
| Sharpen Blade | 10/10 |
