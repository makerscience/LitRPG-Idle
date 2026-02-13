# GAME DESIGN DOCUMENT
## Early Game Structure & Loot System
### Idle/Clicker RPG — Survival-to-Civilization Arc
**Areas 1–3 (30 Zones) • MVP Vertical Slice**

*Version 1.0 — February 2026*

---

## Table of Contents

1. Game Overview & Core Loops
2. Player Progression (Stats, Leveling, XP)
3. Area 1: The Harsh Threshold (Zones 1–5)
4. Area 2: The Overgrown Frontier (Zones 6–15)
5. Area 3: The Broken Road (Zones 16–30)
6. Loot & Equipment System
7. Inventory System
8. Combat Math Reference
9. The Ruins Activation & What Comes Next

---

## 1. Game Overview & Core Loops

### Narrative Premise

The player wakes up in an unfamiliar, hostile world with nothing. No memory of arrival, no gear, no allies. The world is dangerous — even basic wildlife can kill. The early game follows a survival-to-civilization arc inspired by LitRPG themes: the player progresses from desperate scavenger to the inheritor and rebuilder of an ancient fallen settlement.

### Core Loop (Moment-to-Moment)

The character auto-attacks monsters, pushing through zones as they level up, acquire equipment, and grow stronger. Each zone ends with a mini-boss. Each area ends with an area boss that gates progression to the next area. The player's primary decisions are equipment choices and where to focus their time.

### Greater Loop (Session-to-Session)

After completing three areas (30 zones), the player discovers ancient ruins and activates the town-building system. This allows them to reclaim previously cleared territory at higher difficulty, generating resources over real time. These resources feed into town construction, which unlocks new systems, global buffs, and deeper progression. The territory/town loop runs parallel to continued forward exploration — it is never a gate, always an accelerant.

### Early Game Thematic Arc

| Area | Zones | Theme | Tone | Player Fantasy |
|------|-------|-------|------|----------------|
| 1: The Harsh Threshold | 1–5 | Desperate survival | "I might die to a wolf" | Scrappy survivor |
| 2: The Overgrown Frontier | 6–15 | Cautious exploration | "I'm getting competent" | Hardened explorer |
| 3: The Broken Road | 16–30 | Discovery & purpose | "This is mine now" | Inheritor of a lost civilization |

---

## 2. Player Progression

### Base Stats (Level 1, No Gear)

| Stat | Value | Purpose |
|------|-------|---------|
| HP | 100 | Total health pool |
| Strength | 10 | Determines outgoing damage per hit |
| Defense | 5 | Reduces incoming damage (50% of Def value subtracted from hits) |
| HP Regen | 1/sec | Passive health recovery; critical for sustain fights |
| Attack Speed | 1.0/sec | Base attack rate (modified by some gear) |

### Per-Level Gains

Each level grants: +2 Strength, +2 Defense, +12 HP, +0.1 HP Regen. Attack Speed does not increase from levels — only from gear. This means levels alone increase power by roughly 8–10% per level early, declining to 3–5% by level 20. Gear is the bigger power lever — a full gear tier upgrade is worth roughly 5–7 levels.

### XP Table

XP per kill roughly equals enemy HP. Scaling factor is approximately 1.12–1.15x per level. The curve slows steadily but never cliffs.

| Level | XP to Next | Cumulative XP | Location |
|-------|-----------|---------------|----------|
| 1 | 50 | 0 | Zone 1 |
| 2 | 75 | 50 | Zone 1–2 |
| 3 | 110 | 125 | Zone 2 |
| 4 | 155 | 235 | Zone 3 |
| 5 | 210 | 390 | Zone 3–4 |
| 6 | 280 | 600 | Zone 4–5 |
| 7 | 360 | 880 | Zone 5 (Area 1 Boss) |
| 8 | 450 | 1,240 | Zone 6 |
| 9 | 560 | 1,690 | Zone 7 |
| 10 | 680 | 2,250 | Zone 8 |
| 11 | 820 | 2,930 | Zone 9 |
| 12 | 980 | 3,750 | Zone 10 |
| 13 | 1,160 | 4,730 | Zone 11 |
| 14 | 1,360 | 5,890 | Zone 12 |
| 15 | 1,580 | 7,250 | Zone 13 |
| 16 | 1,830 | 8,830 | Zone 14 |
| 17 | 2,100 | 10,660 | Zone 14–15 |
| 18 | 2,400 | 12,760 | Zone 15 (Area 2 Boss) |
| 19 | 2,750 | 15,160 | Zone 16 |
| 20 | 3,120 | 17,910 | Zone 17 |
| 21 | 3,530 | 21,030 | Zone 18 |
| 22 | 3,980 | 24,560 | Zone 19 |
| 23 | 4,480 | 28,540 | Zone 20 |
| 24 | 5,020 | 33,020 | Zone 20 (Sub-boss) |
| 25 | 5,620 | 38,040 | Zone 21 |
| 26 | 6,280 | 43,660 | Zone 22–23 |
| 27 | 7,000 | 49,940 | Zone 23–24 |
| 28 | 7,800 | 56,940 | Zone 24–25 |
| 29 | 8,680 | 64,740 | Zone 25 (Sub-boss) |
| 30 | 9,640 | 73,420 | Zone 26 |
| 31 | 10,700 | 83,060 | Zone 27 |
| 32 | 11,870 | 93,760 | Zone 28 |
| 33 | 13,150 | 105,630 | Zone 29 |
| 34 | 14,560 | 118,780 | Zone 29–30 |
| 35 | 16,100 | 133,340 | Zone 30 (Area 3 Boss) |

---

## 3. Area 1: The Harsh Threshold

**Zones 1–5 • Player Levels 1–7 • Equipment Slots: Weapon, Chest, Helm**

The player wakes up in a rocky clearing at the edge of a dark forest. No weapon, no armor. Everything here can kill them. The tone is tense — this isn't a power fantasy yet. It's a scramble to survive. Each zone represents the player pushing slightly further from where they woke up, driven by necessity.

### Equipment

*All gear is improvised from the environment. Descriptions reinforce that the player is scraping by.*

**Common Drops:**

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Sharpened Stick | Carved from a branch. Pathetic, but better than fists. | +3 Str |
| Chest | Scavenged Hide Wrap | Torn from a dead animal. Barely holds together. | +3 Def, +10 HP |
| Helm | Bone Fragment Helm | Lashed together from something's ribcage. Grim. | +2 Def, +5 HP |

**Uncommon Drops (~8% when item drops):**

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Bone Shard Blade | A jawbone, sharpened. Desperate craftsmanship. | +4 Str, +1 Def |
| Chest | Thick Pelt Vest | Layered hides. Heavier than it looks. | +4 Def, +15 HP |
| Helm | Hound Skull Cap | You wore what you killed. It fits. | +3 Def, +8 HP |

### Enemies

| Enemy | HP | Dmg | Atk Spd | Zones | Notes |
|-------|-----|-----|---------|-------|-------|
| Feral Hound | 20 | 3 | 1.2/sec | 1–3 | Fast, weak. First kill should feel like a close call. |
| Thornback Boar | 40 | 5 | 0.8/sec | 2–4 | Slow, hits harder. Teaches enemy variety. |
| Blighted Stalker | 55 | 7 | 1.0/sec | 3–5 | Humanoid, twisted. First lore hook — what happened? |

### Zone Breakdown

| Zone | Enemies Present | Mini-Boss | Boss HP | Boss Dmg | Boss Atk Spd |
|------|----------------|-----------|---------|----------|--------------|
| 1 | Feral Hound | Rotfang (alpha hound) | 45 | 5 | 1.1/sec |
| 2 | Feral Hound, Thornback Boar | Irontusk (scarred boar) | 70 | 8 | 0.8/sec |
| 3 | Thornback Boar, Blighted Stalker | The Lurcher (tall stalker) | 95 | 10 | 0.9/sec |
| 4 | Blighted Stalker, Feral Hound | Blight Mother (stalker w/ summons) | 120 | 12 | 0.9/sec |
| 5 | All three | **THE HOLLOW** (Area Boss) | 250 | 18 | 0.7/sec |

**Area Boss — The Hollow:** A larger Blighted Stalker. Clearly used to be human. Wears scraps of old armor. When defeated, drops a crude map fragment scratched into leather pointing deeper into the wilderness. First narrative hook: someone was here before, and they were looking for something.

### Player Power at Area 1 Exit

Level ~7, full common gear: HP ~177 | Str ~25 | Def ~24 | Regen ~1.6/sec

Estimated clear time: ~30–60 minutes active, 2–3 hours idle.

---

## 4. Area 2: The Overgrown Frontier

**Zones 6–15 • Player Levels 7–18 • New Slots: Legs (Zone 6), Boots (Zone 9)**

Following the map fragment, the player pushes into denser, wilder territory. Overgrown paths, collapsed fences, remnants of farms long abandoned. Nature has reclaimed everything. The tone shifts from pure survival to cautious exploration. The environment transitions from overgrown farmland (zones 6–9) to swampy lowlands (zones 10–11) to the edge of something darker (zones 12–15).

### Equipment — Tier 1 (Zones 6–10)

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Salvaged Cleaver | Found in a collapsed farmhouse. Nicked but heavy. | +7 Str |
| Chest | Patched Leather Vest | Cobbled together from hides and old scraps. | +6 Def, +20 HP |
| Helm | Hardened Leather Hood | Boiled leather, shaped to fit. Ugly but functional. | +4 Def, +10 HP |
| Legs | Stitched Hide Leggings | Finally, something covering your legs. | +4 Def, +12 HP |
| Boots | Worn Traveler's Boots | Pulled off a long-dead body. They fit. | +2 Def, +5 HP |

### Equipment — Tier 2 (Zones 11–15)

*Mid-area gear refresh. ~25–35% stronger than Tier 1. Keeps common drops exciting through the back half.*

| Slot | Item | Stats |
|------|------|-------|
| Weapon | Sharpened Cleaver | +9 Str |
| Chest | Reinforced Leather Vest | +8 Def, +28 HP |
| Helm | Boiled Leather Hood | +5 Def, +14 HP |
| Legs | Thick Hide Leggings | +5 Def, +16 HP |
| Boots | Mended Traveler's Boots | +3 Def, +8 HP |

### Uncommon Equipment (Zones 8–15)

*Strong enough to carry from mid-area through the Area Boss. Each tells a micro-story about the fallen settlement.*

| Slot | Item | Flavor Detail | Stats |
|------|------|---------------|-------|
| Weapon | Frontier Hatchet | A woodsman's tool, repurposed. | +11 Str, +0.05 Atk Spd |
| Chest | Ranger's Coat | Found in an abandoned outpost. Someone maintained this. | +10 Def, +35 HP |
| Helm | Scout's Halfhelm | Dented but solid. Has a name scratched inside. | +7 Def, +18 HP, +0.2 Regen |
| Legs | Reinforced Trousers | Leather panels sewn onto heavy cloth. | +7 Def, +22 HP |
| Boots | Wayfinder Boots | Light, well-made. Whoever owned these could move. | +3 Def, +0.05 Atk Spd |

### Enemies

| Enemy | HP | Dmg | Atk Spd | Zones | Design Purpose |
|-------|-----|-----|---------|-------|----------------|
| Rot Vine Crawler | 65 | 8 | 1.0/sec | 6–9 | Plant horror. Corruption is in the land. |
| Mire Lurker | 95 | 12 | 0.7/sec | 8–12 | Ambush predator. High dmg, slow. |
| Wisp Swarm | 45 | 6 | 1.5/sec | 9–13 | Fast chip damage. Speed kills. |
| Blight Stalker (Evolved) | 85 | 10 + 2/sec DoT | 1.0/sec | 11–14 | DoT introduction. Regen becomes critical. |
| Bog Revenant | 130 | 14 | 0.9/sec | 13–15 | Late-area pressure. Tanky humanoid. |

### Zone Breakdown

| Zone | Environment | Primary Enemies | Mini-Boss | Boss Stats |
|------|-------------|----------------|-----------|------------|
| 6 | Overgrown farmland | Rot Vine Crawler | Rootmaw | 130 HP, 12 Dmg, 0.9/sec |
| 7 | Flooded fields | Crawler, Mire Lurker | The Sunken | 155 HP, 14 Dmg, 0.8/sec |
| 8 | Abandoned village | Lurker, Crawler | The Overgrowth | 180 HP, 16 Dmg, 0.8/sec |
| 9 | Swamp edge, mist. **Boots unlock.** | Lurker, Wisp Swarm | Flickerswarm | 110 HP, 10 Dmg, 1.4/sec |
| 10 | Deep swamp | Wisp Swarm, Crawler | Mire Mother | 230 HP, 18 Dmg, 0.7/sec |
| 11 | Corrupted swamp | Evolved Stalker, Wisps | The Shuddering | 200 HP, 15+2/sec DoT, 0.9/sec |
| 12 | Dead forest | Evolved Stalker, Lurker | Blightbark | 270 HP, 18 Dmg, 0.8/sec |
| 13 | Old road in mud | Bog Revenant, Wisps | The Unburied | 310 HP, 20 Dmg, 0.9/sec |
| 14 | Ruined outpost | Revenant, Evolved Stalker | The Lost Scout | 350 HP, 22+2/sec DoT, 0.9/sec |
| 15 | Outpost final stand | All enemy types | **THE LOST WARDEN** | 600 HP, 25+3/sec DoT, 0.6/sec |

**Area Boss — The Lost Warden:** A fully armored humanoid covered in vines and blight. A soldier, a guardian of the settlement. Still "guarding" it, but long gone — a shell of corruption in old armor. Drops a journal fragment: "The ruins hold the answer. If we can reach them, we can stop this."

**Key Design Moment:** The Evolved Blight Stalker and Lost Warden introduce DoT (damage over time). This teaches players that HP Regen isn't just a nice stat — it's survival against the corruption. Players who ignored Regen-boosting gear will struggle with the Area Boss.

### Player Power at Area 2 Exit

Level ~18, full Tier 2 common gear: HP ~370 | Str ~45 | Def ~46 | Regen ~2.7/sec

Estimated clear time: ~3–5 hours active, 1–2 days idle.

---

## 5. Area 3: The Broken Road

**Zones 16–30 • Player Levels 18–35 • Three Sub-Regions • New Slots: Gloves (Zone 17), Amulet (Zone 22)**

An old road emerges from beneath the overgrowth. Cracked stone, worn smooth by centuries of travel. It leads upward into hills, toward something. Fifteen zones are divided into three sub-regions of five, each with distinct visual identity, enemy focus, and gear tier. The player experiences three mini-arcs within the larger journey from explorer to inheritor.

---

### Sub-Region A: The Weathered Path (Zones 16–20)

The old road emerges fully. Ancient stonework appears — retaining walls, carved markers. Enemies are remnants: constructs and echoes of the civilization that built this road. New slot: Gloves (Zone 17).

#### Equipment — Tier A

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Reclaimed Shortsword | Found in a stone monument. Old but well-forged. | +13 Str |
| Chest | Road Warden's Hauberk | Standard issue for whoever patrolled this road. | +11 Def, +38 HP |
| Helm | Stone-carved Halfhelm | Shaped from the same stone as the road markers. | +7 Def, +20 HP |
| Legs | Road Warden's Greaves | Matching the hauberk. A uniform, once. | +7 Def, +24 HP |
| Boots | Ironshod Marching Boots | Built for long travel on hard roads. | +4 Def, +10 HP |
| Gloves | Scavenged Gauntlets | Mismatched, one leather, one metal. | +3 Def, +3 Str |

#### Enemies — Sub-Region A

| Enemy | HP | Dmg | Atk Spd | Zones | Notes |
|-------|-----|-----|---------|-------|-------|
| Stone Sentry | 170 | 16 | 0.6/sec | 16–20 | Construct. Very tanky, slow. Rewards Str. |
| Fractured Echo | 75 | 9 | 2.0/sec | 16–19 | Memory made hostile. Fast, fragile. |
| Ruin Pilgrim | 120 | 13 | 1.1/sec | 18–20 | Corrupted humanoids drawn to the ruins. |

#### Zone Breakdown — Sub-Region A

| Zone | Environment | Enemies | Mini-Boss | Boss Stats |
|------|-------------|---------|-----------|------------|
| 16 | Road begins, milestones | Echo, Sentry | The Forgotten | 320 HP, 20 Dmg, 1.0/sec |
| 17 | Bridge over dry river. **Gloves unlock.** | Sentry, Echo | Bridge Warden | 370 HP, 22 Dmg, 0.7/sec |
| 18 | Crossroads, old signpost | Sentry, Pilgrim | The Penitent | 400 HP, 24 Dmg, 1.0/sec |
| 19 | Collapsed waystation | Pilgrim, Echo | Echoing Congregation | 280 HP, 18 Dmg, 1.6/sec |
| 20 | Road widens, walls ahead | All three | **THE ETERNAL SENTRY** (Sub-boss) | 700 HP, 28 Dmg, 0.7/sec |

**Player at end of Sub-Region A** (~level 24, Tier A commons): HP ~445 | Str ~57 | Def ~55 | Regen ~3.3/sec

---

### Sub-Region B: The Outer Ruins (Zones 21–25)

Through the walls, a processional avenue. Crumbling colonnades, shattered statues, plazas overtaken by blight. Corruption and ancient civilization collide directly. Enemies are a mix of constructs still fighting the blight and corrupted things that have overtaken parts of the ruins. New slot: Amulet (Zone 22). **Armor penetration mechanic introduced.**

#### Equipment — Tier B

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Sentinel's Blade | From the ruins' garrison. Engraved. | +17 Str |
| Chest | Sentinel Half-Plate | Same era as the ruins. Heavy. | +14 Def, +48 HP |
| Helm | Sentinel's Visage | Full-face helm. Something shifts when worn. | +9 Def, +26 HP |
| Legs | Sentinel Greaves | Engraved with the same road marker symbols. | +9 Def, +30 HP |
| Boots | Sentinel Treads | Standard garrison issue. | +5 Def, +14 HP |
| Gloves | Sentinel Gauntlets | Matching the set. | +4 Def, +5 Str |
| Amulet | Cracked Hearthstone | A warm stone on a cord. Pulses faintly. First hint of magic. | +15 HP, +0.4 Regen |

#### Enemies — Sub-Region B

| Enemy | HP | Dmg | Atk Spd | Zones | Notes |
|-------|-----|-----|---------|-------|-------|
| Shade Remnant | 130 | 16 (30% armor pen) | 1.0/sec | 21–25 | Ghost. Attacks bypass 30% of Def. Changes the meta. |
| Blighted Guardian | 190 | 21 | 0.9/sec | 22–25 | Corrupted sentinel. Still at its post. |
| Ruin Pilgrim (Frenzied) | 140 | 15 | 1.3/sec | 21–24 | More aggressive near their goal. |

#### Zone Breakdown — Sub-Region B

| Zone | Environment | Enemies | Mini-Boss | Boss Stats |
|------|-------------|---------|-----------|------------|
| 21 | Outer plaza, broken fountain | Frenzied Pilgrim, Shade | Whispering Shade | 430 HP, 24 Dmg (25% pen), 1.0/sec |
| 22 | Colonnade. **Amulet unlocks.** | Shade, Guardian | Fallen Captain | 480 HP, 26 Dmg, 0.9/sec |
| 23 | Armory district | Guardian, Frenzied Pilgrim | Armory Keeper | 520 HP, 28 Dmg, 0.8/sec |
| 24 | Inner wall approach | All three | The Nameless | 460 HP, 25 (30% pen) + 3/sec DoT, 0.9/sec |
| 25 | Inner gate, cracked doors | All three | **CORRUPTED WARDEN** (Sub-boss) | 850 HP, 32 (15% pen) + 3/sec DoT, 0.7/sec |

**Player at end of Sub-Region B** (~level 29, Tier B commons): HP ~560 | Str ~73 | Def ~70 | Regen ~4.2/sec

---

### Sub-Region C: The Inner Sanctum (Zones 26–30)

Past the inner gate, the architecture changes. Civic, almost sacred. A great hall, living quarters, a library. At the center, the hearthstone chamber. Corruption is at its worst — concentrated and virulent. Enemies are the strongest echoes of what this place was, twisted beyond recognition. **All mechanics combine: high HP, armor pen, DoT.**

#### Equipment — Tier C (Final Pre-Town Gear)

*The "Keeper" set. Less military, more ornamental. These were caretakers — scholars, healers, leaders. The gear feels important.*

| Slot | Item | Flavor | Stats |
|------|------|--------|-------|
| Weapon | Keeper's Longsword | Elegant, functional. Made to endure. | +22 Str |
| Chest | Keeper's Wardplate | Ornamental but strong. A leader's armor. | +18 Def, +60 HP |
| Helm | Keeper's Crown | Not a crown exactly — a circlet of stone and metal. | +11 Def, +32 HP, +0.3 Regen |
| Legs | Keeper's Legguards | Matching the wardplate. | +12 Def, +36 HP |
| Boots | Keeper's Stride | Silent on stone. Good for halls. | +6 Def, +18 HP |
| Gloves | Keeper's Grip | They tighten when you grip a weapon. | +5 Def, +7 Str |
| Amulet | Warm Hearthstone | The warmth is stronger. It flares near the blight. | +25 HP, +0.6 Regen |

#### Uncommon Drops — All of Area 3 (~8–10% when item drops)

*Best-in-slot for the entire early game. Optional power — not required for the Area Boss, but makes it comfortable.*

| Slot | Item | Stats | Found In |
|------|------|-------|----------|
| Weapon | Warden's Oath | +26 Str, +6 Def | Zones 22–30 |
| Chest | Ancient Sentinel Plate | +20 Def, +70 HP | Zones 24–30 |
| Helm | Visage of the First | +13 Def, +35 HP, +0.5 Regen | Zones 26–30 |
| Legs | Stoneguard Legplates | +14 Def, +40 HP | Zones 24–30 |
| Boots | Pathfinder's Stride | +7 Def, +0.08 Atk Spd | Zones 20–30 |
| Gloves | Irongrip Gauntlets | +6 Def, +9 Str | Zones 22–30 |
| Amulet | Heartstone Pendant | +35 HP, +0.8 Regen, +3 Def | Zones 26–30 |

#### Enemies — Sub-Region C

| Enemy | HP | Dmg | Atk Spd | Zones | Notes |
|-------|-----|-----|---------|-------|-------|
| Hearthguard Construct | 250 | 22 | 0.7/sec | 26–30 | Elite construct. Massive HP pool. |
| Blighted Scholar | 160 | 18 (25% pen) + 3/sec DoT | 1.0/sec | 27–30 | Most complex enemy. Pen + DoT. |
| Corruption Tendril | 100 | 12 | 1.8/sec | 26–29 | The blight itself. Fast, relentless. |
| Shade of the Keeper | 200 | 20 (35% pen) | 0.9/sec | 28–30 | Highest armor pen in early game. |

#### Zone Breakdown — Sub-Region C

| Zone | Environment | Enemies | Mini-Boss | Boss Stats |
|------|-------------|---------|-----------|------------|
| 26 | Great hall, echoing | Tendril, Construct | The Heartrot | 550 HP, 28 Dmg, 1.2/sec |
| 27 | Library, books crumbling | Construct, Scholar | The Last Scholar | 580 HP, 30 (20% pen) + 3/sec DoT, 0.9/sec |
| 28 | Living quarters | Scholar, Shade of Keeper | The Unremembered | 620 HP, 32 (30% pen), 0.9/sec |
| 29 | Hearthstone antechamber | Shade, Tendril | The Blight Core | 700 HP, 30 + 5/sec DoT, 1.0/sec |
| 30 | Hearthstone chamber | All enemy types | **THE FIRST KEEPER** | 1400 HP, 38 (20% pen) + 4/sec DoT, 0.7/sec |

**Area Boss — The First Keeper:** The original guardian of the ruins. Massive, ancient, partially corrupted. Built to protect this place; even the blight hasn't fully broken its purpose. When defeated, the ruins respond — doors open, lights flicker on in corridors that haven't been lit in centuries. The ruins accept the player as the new keeper.

### Player Power at Area 3 Exit

Level ~35, full Tier C common gear: HP ~690 | Str ~97 | Def ~90 | Regen ~5.8/sec

Estimated clear time: ~8–15 hours active, 3–7 days idle.

Total early game (Areas 1–3): ~12–20 hours active, or ~1–2 weeks of casual idle play.

---

## 6. Loot & Equipment System

### Design Decisions (Locked In)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Duplicate handling | Manual comparison — player chooses | RPG feel. Player makes meaningful decisions about gear. |
| Star/perfect roll modifiers | Not used | Keeping the system clean. Complexity comes from gear tiers and uncommons. |
| Low-level zone farming | No drop rate penalty | Natural power curve self-corrects. Old zone drops are just weaker. |
| Pity system | Kicks in after 5+ zones with no upgrade to a slot | Prevents extreme drought frustration without removing highs/lows. |
| Boss loot | First kill guaranteed good; repeats slightly better than normal | Rewards progression; bosses worth refighting but not mandatory to farm. |
| Inventory | 15 starting slots, expandable via town + utility gear | Moderate base, grows with the player. |
| Salvage | Sell unwanted items for gold | Simple, clean currency loop. |

### Drop Rates

**Base Drop Chance (any item at all):**

| Enemy Type | Drop Chance Per Kill | Notes |
|-----------|---------------------|-------|
| Normal enemy | 8–12% | ~1 item per 30–50 seconds of active play |
| Mini-boss (first kill) | 100% guaranteed, 30% uncommon chance | First kill feels like a loot event |
| Mini-boss (repeat kill) | 100% guaranteed, 11% uncommon chance | Still guaranteed, just normal rarity odds |
| Sub-boss (first kill) | 100% × 2 items, 1 guaranteed uncommon | Uncommon weighted toward weapon/chest |
| Sub-boss (repeat kill) | 100% × 1 item, 15% uncommon chance | Slightly better than normal enemy odds |
| Area boss (first kill) | 100% × 3 items, 1 guaranteed uncommon + highest tier | Plus narrative drop (map fragment, journal) |
| Area boss (repeat kill) | 100% × 2 items, 15% uncommon chance | Worth refighting occasionally |

**Rarity Distribution (when item drops):**

| Rarity | Chance | Display Color | Effective Per-Kill Rate |
|--------|--------|---------------|------------------------|
| Common | 88% | White/Grey | ~8–11% per kill |
| Uncommon | 11% | Green | ~0.9–1.3% per kill |
| (Future: Rare) | (1%) | (Blue) | Post-Area 3 / town crafting |

### Slot Drop Weighting

When an item drops, each unlocked slot has roughly equal probability, with weapon and chest slightly favored as the most impactful slots.

| Slot | Base Weight | Notes |
|------|-----------|-------|
| Weapon | 16% | Slightly higher — most exciting drop |
| Chest | 15% | Second most impactful |
| Helm | 14% | Standard |
| Legs | 14% | Standard |
| Boots | 14% | Standard |
| Gloves | 14% | Standard |
| Amulet | 13% | Slightly lower — niche (Regen) slot |

**Pity System:** If a gear slot has not received an upgrade (a drop with higher stats than currently equipped) for 5 or more zones, that slot's drop weight is doubled. This is invisible to the player. It prevents extreme bad luck without removing the excitement of dry-streak-breaking drops.

### Zone-Appropriate Drops

Enemies only drop gear from their area and tier. A Rot Vine Crawler in Zone 7 drops Area 2 Tier 1 gear, never Area 1 gear. This prevents loot table dilution. There is no drop rate penalty for farming lower-level zones — the drops are simply weaker, which naturally discourages it without punishing the player.

### Expected Loot Volume Per Area

| Area | Est. Enemies Killed | Est. Item Drops | Est. Uncommons Seen | Gear Slots Available |
|------|--------------------|-----------------|--------------------|---------------------|
| Area 1 (5 zones) | 200–300 | 20–30 | 2–3 | 3 |
| Area 2 (10 zones) | 800–1,200 | 80–120 | 9–13 | 5 |
| Area 3 (15 zones) | 1,500–2,500 | 150–250 | 17–28 | 7 |

---

## 7. Inventory System

### Base Inventory

The player starts with 15 inventory slots. This is separate from equipped gear — equipped items don't take up inventory space. 15 slots allows comfortable play in Area 1 (3 gear slots, modest drop rate) but starts to create pressure in Area 2 as more slots unlock and drops increase.

### Expansion Paths

| Method | How It Works | When Available |
|--------|-------------|----------------|
| Utility Equipment | A separate "utility" slot for bags/backpacks. Does not compete with combat gear. Provides +3 to +10 inventory slots depending on bag quality. | Area 1 onwards (basic Scrap Pouch found early) |
| Town Buildings | Town structures like a Storehouse or Vault add permanent inventory capacity. Upgradable over time. | Post-Area 3 (town activation) |

The utility slot is its own category — it doesn't compete with weapon, armor, or amulet slots. This means the player never has to choose between combat power and inventory space in terms of gear slots. However, bag quality does scale with area progression, so better bags are found in later zones and provide meaningful inventory upgrades as the loot volume increases.

### Selling Items

Unwanted items can be sold for gold. Gold is the primary early-game currency, used for (future systems): purchasing consumables, repairing gear, funding town construction. Sell values scale with item tier and rarity — an uncommon from Area 3 sells for significantly more than a common from Area 1.

---

## 8. Combat Math Reference

### Damage Formulas

**Player damage per hit:** Strength - (Enemy Defense × 0.3), minimum 1. Most early enemies have 0 Defense, so this is effectively just Strength.

**Enemy damage per hit to player:** Enemy Damage - (Player Defense × 0.5), minimum 1. Defense cuts incoming damage by roughly half its value — significant but never total immunity.

**Armor penetration:** Enemy Damage - ((Player Defense × (1 - pen%)) × 0.5), minimum 1. A 30% armor pen enemy against 60 Defense effectively faces 42 Defense.

### Win Condition

The player wins if they can survive longer than it takes to kill the enemy. Effective Player HP = Player HP + (Regen × Fight Duration). This is why Regen becomes more important as fights get longer (i.e., as bosses get tankier). In short fights, raw HP and Defense dominate. In long boss fights, Regen is the deciding factor.

### Area Boss Balance Check — The First Keeper

| Metric | Value |
|--------|-------|
| Boss stats | 1400 HP, 38 Dmg (20% pen), 4/sec DoT, 0.7 Atk/sec |
| Player stats (Tier C common, lvl 35) | 690 HP, 97 Str, 90 Def, 5.8 Regen |
| Player effective Def vs 20% pen | 90 × 0.8 = 72 effective Def |
| Damage reduction | 72 × 0.5 = 36 |
| Net damage per boss hit | 38 - 36 = 2 |
| Boss hit DPS | 2 × 0.7 = 1.4/sec |
| Boss DoT DPS | 4/sec |
| Total incoming DPS | 5.4/sec |
| Player Regen | 5.8/sec |
| Net player HP change | +0.4/sec (barely out-regening) |
| Time to kill boss | 1400 / 97 = ~14.4 seconds |
| Result | WIN — slow but stable. Tight fight with commons. |

With a few uncommon pieces, the fight becomes comfortable. Undergeared (Tier B commons, level ~30), incoming DPS exceeds Regen and the player slowly dies. This is the intended gear check.

---

## 9. The Ruins Activation & What Comes Next

### The Moment

When the First Keeper falls, the ruins respond. Doors open. Lights flicker on in corridors that haven't been lit in centuries. Inside the central chamber: a hearth, long cold, surrounded by empty foundations. This was a town once. The infrastructure is dormant, waiting.

The player touches the hearthstone (which resonates with the Cracked Hearthstone / Heartstone Pendant they've been carrying), and the bond is formed. The player becomes the new Keeper. The town system activates.

### What Unlocks

| System | Description |
|--------|-------------|
| Town Tab | New UI tab. Player can build first structure (Campfire for global Regen buff, or Stash for inventory expansion). |
| Territory Reclaim | Player can return to Areas 1–3 and run "Reclaim" challenges — same zones, enemies scaled up ~1.5x, territory boss at the end. |
| Resource Generation | Claimed areas generate resources over real time. Area 1: Wood. Area 2: Herbs. Area 3: Stone. These feed into town construction. |
| Area 4+ Access | Forward progression continues. Area 4 is accessible but hard. Territory/town is a parallel path, never a gate. |

### The Thematic Payoff

The player went from waking up with nothing, to scraping together survival gear from dead animals, to inheriting the mantle of an ancient civilization. The sharpened stick to the Warden's Oath. The hide wrap to the Keeper's Wardplate. They didn't just find a town — they earned the right to rebuild one.

When they go back to reclaim Area 1 — the place where they almost died to a Feral Hound — they're doing it as someone powerful. That contrast is the emotional engine of the territory system. It's not just a mechanic; it's the player proving how far they've come.
