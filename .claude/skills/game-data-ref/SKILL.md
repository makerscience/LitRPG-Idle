---
name: game-data-ref
description: Regenerate GAME_DATA_REFERENCE.md from all game data source files and balance sim output
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(npm run balance:sim), Write
---

# Regenerate Game Data Reference

Regenerate `GAME_DATA_REFERENCE.md` — a comprehensive single-file reference for all game data in the LitRPG Idle vertical slice.

## Data Sources

Read ALL of these files in full before generating output:

1. `src/config.js` — `COMBAT_V2`, `PROGRESSION_V2`, `LOOT_V2` constants
2. `src/data/upgrades.js` — all upgrade definitions (gold + exploit)
3. `src/data/equipSlots.js` — `V2_ACTIVE_SLOTS` slot definitions
4. `src/data/items.js` — all equipment items
5. `src/data/enemies.js` — all enemy definitions
6. `src/data/bosses.js` — all boss definitions
7. `src/data/areas.js` — area definitions, `BOSS_TYPES`, zone scaling

## Steps

1. Read all 7 data source files listed above (in parallel where possible).
2. Run `npm run balance:sim` to get fresh simulation output.
3. Generate `GAME_DATA_REFERENCE.md` following the exact section structure below.
4. Cross-check: verify item counts, enemy counts, boss counts, and zone ranges match the source data. If any mismatch, fix before writing.
5. Write the file using the Write tool.

## Output Structure

The generated file must contain exactly these 11 sections in this order. Use the current `GAME_DATA_REFERENCE.md` as a formatting template — match the table column layouts, heading levels, and markdown conventions exactly.

### Header

```markdown
# Game Data Reference

> Complete reference for all game data in the LitRPG Idle vertical slice (Areas 1-3, Zones 1-30).
> Generated from source files on YYYY-MM-DD.
```

Use today's actual date.

### Table of Contents

Numbered list linking to all 11 sections (use GitHub-style anchor links).

### Section 1: Combat Formulas

- Source: `src/config.js` — `COMBAT_V2`
- Table of all combat formulas: player damage, enemy damage, DoT, attack intervals, spawn delay, death respawn
- Include effective HP formula

### Section 2: Player Base Stats & Growth

- Source: `src/config.js` — `PROGRESSION_V2`
- Starting stats table (Level 1)
- Per-level growth table
- Stats-by-level table (levels 1, 5, 10, 15, 20, 25, 30, 35) — base only, no gear/upgrades

### Section 3: XP Curve

- Source: `src/config.js` — `PROGRESSION_V2.xpTable`
- Full XP table: Level | XP Required | Cumulative XP
- Note the overflow formula for levels beyond the table

### Section 4: Upgrades

- Source: `src/data/upgrades.js`
- Group by currency type: "Gold Upgrades (Legit)" and "Exploit Upgrades (Fragment Cost)"
- For each upgrade: name, effect description, max level, cost formula
- Full level-by-level table with Cost, Total Invested, Cumulative Effect
- Compute costs from the actual formula in the source code — do NOT hardcode

### Section 5: Equipment Slot Unlocks

- Source: `src/data/equipSlots.js` — `V2_ACTIVE_SLOTS`
- Table: Slot | Label | Unlock Zone | Item Slot | Side
- Only include slots that are active in the vertical slice

### Section 6: All Equipment

- Source: `src/data/items.js`
- Group by Area, then by rarity tier (Common / Uncommon) and zone range sub-tiers
- Table columns: Item | Slot | Zones | STR | DEF | HP | Regen | AtkSpd | ATK | Sell
- Use `—` for zero/absent stat values
- Include total item count in section heading

### Section 7: All Enemies

- Source: `src/data/enemies.js`
- Group by Area, then by sub-region for Area 3
- Table columns: Enemy | HP | ATK | AtkSpd | DEF | ArmorPen | DoT | Zones | Gold | XP
- Note zone scaling formula at top
- Include total enemy count in section heading

### Section 8: All Bosses

- Source: `src/data/bosses.js`
- Group by Area
- Table columns: Zone | Boss | Title | Type | HP | ATK | AtkSpd | ArmorPen | DoT | Gold | XP
- Bold AREA bosses (name and type)
- Include Boss Type Definitions sub-section from `src/data/areas.js` — `BOSS_TYPES`
- Include total boss count in section heading

### Section 9: Zone Scaling & Boss Thresholds

- Source: `src/data/areas.js`
- Area definitions table
- Zone scaling formula with full scale factor table (local zones 1-15)
- Boss kill threshold formula with full threshold table (local zones 1-15)

### Section 10: Loot System

- Source: `src/config.js` — `LOOT_V2`
- Drop chances table (normal kill, boss first kill, boss repeat)
- Rarity system table (weight, stat mult, sell mult)
- Slot weights table
- Pity system description

### Section 11: Balance Sim Snapshot

- Paste the full sim output from `npm run balance:sim` in a code block
- Note the date it was run
- List assumptions (common gear only, idle play, no crits, etc.)
- Include legend for column abbreviations
- Include GDD Checkpoint Comparison table (zones 5, 15, 30)
- Include Boss Pass/Fail Summary
- Include Final Upgrade Levels table

## Formatting Rules

- All tables use standard GitHub markdown (`| col | col |`)
- Use `—` (em dash) for zero/null stat values in equipment and enemy tables
- Use `**bold**` for AREA boss names and types
- Number-format large values with commas (e.g., `1,677`)
- Section dividers: use `---` between major sections
- Code blocks for formulas and sim output
- Keep the file self-contained — no external links except source file paths
