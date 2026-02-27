# Stance, Skills & Tutorial Design

## Overview

Design for the stance progression system, secondary skill unlocks, enemy counter-triangle, SYSTEM-narrated teaching moments, and SP upgrade tiers for all 6 skills.

## 1. Stance Progression Architecture

**Starting state (zone 1):** All 3 stances unlocked with primary skills:
- Power → Power Smash (3x damage hit, 30s cooldown)
- Flurry → Rapid Strikes (5 quick hits, 10s cooldown)
- Fortress → Bulwark (absorb shield, on-demand)

**Secondary skills** locked at start, unlocked via progression milestones:

| Secondary Skill | Stance   | Unlocked By                          | Zone   | What It Answers                |
|-----------------|----------|--------------------------------------|--------|--------------------------------|
| Armor Break     | Power    | First Armored Beetle encounter       | 6      | Armor (shreds defense)         |
| Cleanse         | Fortress | First heavy DOT/thorns stacking      | ~11-12 | DOT/thorns/debuffs (purges)    |
| Interrupt       | Flurry   | First enemy with charge-up attack    | ~13-15 | Charged attacks (cancels wind-up) |

Stance switching: free with existing 500ms pause. Game teaches switching through encounter design.

## 2. Counter-Triangle & Enemy Design

Each stance has a weakness exploited by a specific enemy trait:

| Stance   | Weakness              | Counter Trait | Why It Hurts                                        |
|----------|-----------------------|---------------|-----------------------------------------------------|
| Flurry   | Many hits = many procs | Thorns        | Each rapid hit triggers thorns damage back           |
| Power    | Slow, infrequent hits | Evasion       | Missing a slow 2x swing wastes the DPS window       |
| Fortress | Low damage (0.8x)    | Regen         | Can't out-damage the enemy's healing                 |

**Strategic answers:**
- Thorns → switch OFF flurry to power/fortress, OR use Cleanse to purge
- Evasion → switch OFF power to flurry for volume, OR brute-force
- Regen → switch OFF fortress to power for burst damage

**New mechanic: Charge Attack.** Enemies telegraph a powerful attack with a 2-3 second channel bar/visual glow. If not interrupted, deals massive damage. Interrupt (flurry secondary) cancels it during the wind-up window. Separate from enrage (permanent HP-threshold buff).

First charge-attack enemy: mid-Area-2 (zone ~13-15).

## 3. Teaching Moments — SYSTEM Mini-Events

### Secondary Skill Unlock Sequences (3-4 lines, mid-combat)

Pattern: Player encounters trigger enemy → fights for a few seconds (feels the problem) → SYSTEM interrupts → skill unlocks immediately.

**Armor Break (Zone 6, first Armored Beetle):**
```
[delay 0s]   SYSTEM: "Your attacks are glancing off. That thing has plating."
[delay 2s]   SYSTEM: "Here. I'm authorizing something... unsubtle."
[delay 2s]   SYSTEM: "ARMOR BREAK unlocked. Switch to Power stance. Hit it where it's soft."
[delay 1s]   → Armor Break button appears/pulses, skill is active
```
Flag: `UNLOCK_ARMOR_BREAK`

**Cleanse (Zone ~11-12, first heavy DOT/thorns stacking):**
```
[delay 0s]   SYSTEM: "Those spines aren't just for show. You're bleeding out."
[delay 2s]   SYSTEM: "Fortress stance. Brace yourself and purge it."
[delay 2s]   SYSTEM: "CLEANSE unlocked. Burns away what's eating you."
[delay 1s]   → Cleanse button appears/pulses, skill is active
```
Flag: `UNLOCK_CLEANSE`

**Interrupt (Zone ~13-15, first charge-attack enemy):**
```
[delay 0s]   SYSTEM: "It's charging something. That's... not good."
[delay 1.5s] SYSTEM: "Quick — Flurry stance. Hit it before it finishes."
[delay 2s]   SYSTEM: "INTERRUPT unlocked. Break their concentration."
[delay 1s]   → Interrupt button appears/pulses, skill is active
```
Flag: `UNLOCK_INTERRUPT`

### Earlier Teaching Quips (single-line, no unlock)

| Zone | Trigger                     | SYSTEM Line                                                          | Teaches                  |
|------|-----------------------------|----------------------------------------------------------------------|--------------------------|
| 1    | First stance switch         | "You can think AND fight? Noted."                                    | Stances exist, switching encouraged |
| 3    | First thorns damage         | "It hit you back. Automatically. Maybe don't hit it so fast."        | Thorns punish flurry     |
| 4    | First evasion dodge         | "It dodged. Swing faster next time. Or slower. I forget which works."| Evasion punishes power   |
| 5    | First regen heal            | "It's healing. You're going to need to hit harder than that."        | Regen punishes fortress  |

## 4. SP Upgrade Tiers

### Primary Skills (available from start, 3 tiers each at 1 SP)

**Power Smash (Power):**
| Tier | Name          | Effect                                         |
|------|---------------|-------------------------------------------------|
| 0    | (base)        | 3x damage hit. 30s cooldown.                   |
| 1    | Heavy Impact  | Damage multiplier increased to 4x              |
| 2    | Crushing Blow | Target takes 15% increased damage for 4s       |
| 3    | Cataclysm     | Cooldown reduced to 22s                         |

**Rapid Strikes (Flurry):**
| Tier | Name          | Effect                              |
|------|---------------|-------------------------------------|
| 0    | (base)        | 5 quick hits. 10s cooldown.         |
| 1    | Sixth Strike  | Hit count increased to 6            |
| 2    | Bleeding Cuts | Each hit applies a small DOT (stacks) |
| 3    | Relentless    | Cooldown reduced to 7s              |

**Bulwark (Fortress):**
| Tier | Name             | Effect                                        |
|------|------------------|-----------------------------------------------|
| 0    | (base)           | Absorb shield, 10s or until broken. On-demand.|
| 1    | Reinforced Shell | Shield absorb increased by 40%                |
| 2    | Thorned Barrier  | Attackers take reflected damage while shield holds |
| 3    | Bastion          | Shield duration increased to 14s              |

### Secondary Skills (appear after milestone unlock, 3 tiers each at 1 SP)

**Armor Break (Power):**
| Tier | Name              | Effect                                    |
|------|-------------------|-------------------------------------------|
| 0    | (unlock)          | Shreds 35% enemy defense for 6s. 15s CD.  |
| 1    | Deeper Fractures  | Shred increased to 50%                    |
| 2    | Lingering Weakness| Duration increased to 9s                  |
| 3    | Shatter           | Cooldown reduced to 10s                   |

**Interrupt (Flurry):**
| Tier | Name            | Effect                                      |
|------|-----------------|---------------------------------------------|
| 0    | (unlock)        | Cancels charge attack. 1s stun. 12s CD.     |
| 1    | Staggering Blow | Stun duration increased to 2s               |
| 2    | Opportunist     | Interrupting grants 3s of +30% attack speed |
| 3    | Hair Trigger    | Cooldown reduced to 8s                      |

**Cleanse (Fortress):**
| Tier | Name            | Effect                                       |
|------|-----------------|----------------------------------------------|
| 0    | (unlock)        | Purges all DOT/thorns/corruption. 20s CD.    |
| 1    | Residual Ward   | Grants 3s DOT immunity after cleanse         |
| 2    | Purifying Flame | Cleanse deals damage based on stacks purged  |
| 3    | Inner Peace     | Cooldown reduced to 14s                      |

### Total SP Landscape
- 6 existing stat upgrades
- 9 primary skill tiers (3 skills x 3 tiers)
- 9 secondary skill tiers (3 skills x 3 tiers, unlocked via milestones)
- **Total: 24 SP upgrades**

Secondary skill tiers only appear in the upgrade panel after the skill is unlocked — no spoilers.
