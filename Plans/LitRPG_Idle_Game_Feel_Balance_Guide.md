# LITRPG IDLE
## Game Feel & Balance Guide
### Design Principles + Data Analysis + Specific Fixes

*February 2026*

---

# PART I — The Psychology of Player Engagement

These principles are the foundation everything else in this document builds on. They are not abstract theory — they are the specific psychological mechanisms that determine whether a player stays for five minutes or five weeks. Every number in your game should be traceable back to one of these principles.

---

## PRINCIPLE 1: Time-to-Kill Is the Master Metric

Everything the player *feels* in an idle RPG traces back to how long enemies take to die. When a slime takes 12 seconds to kill, the player is watching, engaged, possibly worried. When that same slime takes 1.5 seconds, they feel powerful. The ratio between first-encounter TTK and farmed-out TTK is the entire emotional arc of a zone compressed into a single number. If you get nothing else right, get this right.

**Design target:** Zone-entry TTK should be 6–10 seconds for regular enemies. By the time the player is ready for the zone boss, TTK should have dropped to 2–3 seconds. This 3–5x compression ratio is the snowball the player feels.

## PRINCIPLE 2: Effort Must Precede Reward, But the Ratio Must Shift

Early in an area, the ratio is high effort to modest reward. This is fine — if the player understands what the reward is *for*. Effort without legible purpose feels like grinding. Effort toward a visible goal feels like investment. The player should always be able to see exactly what they are working toward: the next upgrade price, the boss threshold, the equipment slot unlock. As the snowball builds, the ratio inverts. Enemies melt, gold flows, drops cascade. This feels incredible specifically because the player remembers when it was hard. The contrast does the emotional work.

## PRINCIPLE 3: Variable Reward Beats Guaranteed Reward

Uncertainty creates mental models. The player starts predicting: "I'm due for a drop." "The last three weapons were bad." They are building internal narratives about probability, and every drop either confirms or subverts that narrative. Both outcomes are engaging. Confirmation feels like understanding the system. Subversion creates the itch to try again. Your pity system is powerful here because it creates real patterns underneath the randomness — the player who senses it has been too long since a good drop is *correct*, and that alignment between intuition and reality is deeply satisfying.

## PRINCIPLE 4: Players Feel Deltas, Not Absolutes

Humans do not pay attention to static states. We attend to *changes*. A health bar at 80% is invisible. A health bar dropping from 80% to 40% during a fight is riveting. A damage number of 24 means nothing in isolation. A damage number that used to be 16 and is now 24 means everything. Your game is not a sequence of states — it is a sequence of transitions. Every system should be designed to produce visible, legible transitions when the player makes a choice.

**Corollary:** The jump from triple-digit to quadruple-digit damage is more satisfying than a 50% increase within the same order of magnitude, even though the latter may be mathematically larger. Humans think logarithmically. Number presentation should respect that.

## PRINCIPLE 5: Productive Frustration Is Your Most Powerful Tool

The instinct is to minimize frustration, but that is wrong. What you minimize is *unproductive* frustration — the feeling that nothing you do matters, that the system is opaque, that failure is random. Productive frustration — "I can see what I need but I can't quite do it yet" — is the single most powerful motivational state in game design. It is the one-more-run feeling. The boss you almost beat. The zone where enemies kill you at 70% and you know one more upgrade will get you there.

**The loop:** Frustration → Insight → Action → Reward → New frustration at a higher level. Each cycle should take 2–5 minutes in the active early game, 15–30 minutes in the mid-game idle phase. Frustration should never outlast the player's ability to identify their next move.

## PRINCIPLE 6: Agency Survives Automation Through System-Level Decisions

When combat is automated, the player's hands are off the wheel. Agency must live in decisions that change the *shape* of the automation. Equipping a new weapon changes how fast enemies die, which changes gold flow, which changes when the next decision arrives. The player is a strategist, not a soldier. Critically, feedback from their decisions must be immediate and visible — not in a stat screen, but in the actual rhythm of combat. The game's tempo should change when the player makes a choice, because tempo is how idle games communicate consequences.

## PRINCIPLE 7: The Game Must Teach the Player When to Leave

The healthiest play pattern is: arrive, make decisions, let automation run, leave, come back later, make more decisions. The player watching enemies die for 45 minutes straight is not having a good time — they are in a compulsion loop that leads to burnout. Your game should have natural breathing points where optimal play is to close the tab. SYSTEM's voice is a game design tool here, not just flavor. "Go do something with your life, I'll handle this" is not just funny — it is permission to leave. That trust between player and game is what turns a single session into a weeks-long relationship.

## PRINCIPLE 8: Each New System Should Arrive When Existing Systems Feel Solved

Complexity should layer in at the moment the player has mastered what came before. Area 1 teaches the grammar: hit things, get XP, get drops, buy skills. Area 2 complicates the grammar: enemy modifiers, a new equipment slot, more interesting skill tradeoffs. Area 3 introduces full complexity: elemental interactions, set bonuses, proc effects. The player at zone 30 should still care about gear drops as much as they did at zone 1 — but for richer, more layered reasons. That is how you build something that sustains a game ten times this size.

---

### How These Principles Map to Your Systems

| System | Primary Principle | Role in the Feel |
|--------|-------------------|------------------|
| Leveling / XP | Effort → Reward (#2) | Slow rising floor. Safety net, not the engine. Should never feel like the strategy. |
| Equipment drops | Variable Reward (#3), Deltas (#4) | Where the drama lives. Cross-tier drops are breakthroughs. Within-tier drops are optimization. |
| Gold upgrades | Productive Frustration (#5), Agency (#6) | Decision-pressure system. Early game: can't afford everything. Late game: flowing freely. |
| Slot unlocks | Deltas (#4), System Layering (#8) | New dimensions of optimization. Each should coincide with a difficulty spike. |
| Boss encounters | Productive Frustration (#5) | Gate + graduation. Should be beatable right when the snowball peaks. |
| SYSTEM voice | Leave Permission (#7) | Mirrors player emotion. Mocks struggle, grudgingly acknowledges triumph, gives permission to leave. |

---

# PART II — Current Game Data Analysis

This section analyzes your current balance sim data against the principles above. The sim assumes common gear, idle play, optimal upgrade purchasing, and exactly boss-threshold kills per zone.

---

## Issue 1: The Player Is Never in Danger

> **CRITICAL — This Is the Central Problem**
>
> Your balance sim shows 30/30 boss wins with the lowest survival ratio being 1.18x (zone 5). Regular enemies are even less threatening. The player wins every fight from zone 1 to zone 30. There is no productive frustration anywhere in the current data. The game as tuned right now is a screensaver with numbers.

Look at the survival ratios (eSurv) for regular enemies across the three areas:

| Zone | eSurv | Interpretation |
|------|-------|----------------|
| 1 | 477.13 | ⚠️ Player can survive 477 consecutive fights. Zero danger. |
| 5 | 5.30 | Mild pressure, but still comfortable. |
| 6 | 70.34 | ⚠️ Gear jump resets to trivial. |
| 15 | 3.25 | Best pressure in the game. Still not threatening. |
| 16 | 24,979.59 | ⚠️ Area 3 entry is absurdly safe. No reset. |
| 25 | 3.49 | Reasonable late-game pressure. |
| 30 | 2.12 | Tightest in the game, but still a guaranteed win. |

The target eSurv for a zone-entry fight should be between **1.5 and 3.0** to create the feeling of genuine engagement. Values above 10 mean the player can zone out completely. Values above 100 mean the game is playing itself with no possible tension.

**The area transitions are especially broken.** When the player enters area 2 (zone 6), their eSurv is 70.34 — higher than most of area 1. When they enter area 3 (zone 16), their eSurv is 24,979.59. There is no difficulty reset. The new area feels easier than the old one, which destroys the emotional arc: the player should feel outgunned again, forced to re-engage with the systems.

## Issue 2: Enemy TTK Does Not Create a Snowball Arc

The enemy TTK (eTTK) column tells us how long regular enemies take to kill. For a satisfying snowball, we want to see high TTK at zone entry that compresses dramatically by zone exit. Here is what the data shows:

| Area | Entry Zone eTTK | Exit Zone eTTK | Compression Ratio | Assessment |
|------|-----------------|----------------|--------------------|----|
| 1 (z1–z5) | 2.41s | 4.27s | ⚠️ 0.56x (INVERTED) | Gets HARDER, not easier |
| 2 (z6–z15) | 2.33s | 4.30s | ⚠️ 0.54x (INVERTED) | Same problem |
| 3 (z16–z30) | 1.63s | 5.30s | ⚠️ 0.31x (INVERTED) | Worst inversion |

**This is backwards.** In every area, enemies take *longer* to kill at the end than at the beginning. The zone scaling formula `(1 + (localZone - 1) * 0.15)` is increasing enemy HP faster than the player's power is growing. The player never experiences the snowball. Instead they experience a slow, steady grind that gets marginally harder with each zone. This is the opposite of the feeling we want.

**Target:** Entry eTTK of 6–10 seconds, compressing to 2–3 seconds by zone exit. The player should feel enemies going from walls to paper as they gear up.

## Issue 3: Gear Stat Jumps Are Too Flat Within Tiers, Too Spiky at Transitions

Looking at your weapon progression as the most visible stat line:

| Tier | Weapon STR/ATK | Jump from Previous | Assessment |
|------|----------------|--------------------|----|
| Area 1 Common | 3 / 3 | — | Fine as starting gear |
| Area 2 Tier 1 Common | 7 / 7 | +4 / +4 (133%) | Solid cross-tier jump |
| Area 2 Tier 2 Common | 9 / 9 | +2 / +2 (29%) | ⚠️ Too small. Barely noticeable. |
| Area 3 Tier A Common | 13 / 13 | +4 / +4 (44%) | Decent |
| Area 3 Tier B Common | 17 / 17 | +4 / +4 (31%) | Diminishing returns feeling |
| Area 3 Tier C Common | 22 / 22 | +5 / +5 (29%) | ⚠️ Should feel like endgame power. Doesn't. |

The problem is that the absolute stat gains are linear while the enemies scale multiplicatively. A weapon going from 13 to 17 ATK feels like a +4 absolute improvement, but against enemies with 170–250 HP at a 2.5x zone scale, that +4 barely dents the TTK. Cross-tier weapon drops should feel like the game just *shifted*. Right now they feel like mild optimizations.

## Issue 4: The Zone 16 Anomaly

> **DATA POINT**
>
> Zone 16 eSurv: 24,979.59. Zone 15 eSurv: 3.25. The player goes from the tightest survival ratio in the game to the loosest, at the exact moment they should feel the most pressure — entering a new area.

This happens because the player arrives at zone 16 with area 2's endgame gear (STR 75, DEF 70 from the sim) while zone 16 enemies use base stats with a localZone of 1 (no zone scaling). The area 3 base enemy stats are not high enough to challenge a fully geared area 2 character. The 15% per-zone scaling then gradually catches up, but by then the player has also been gaining levels and drops in area 3.

The same issue exists at zone 6 (eSurv 70.34 vs zone 5's 5.30), but it is less extreme because the area 1 to area 2 gear gap is smaller. Both transitions need to be walls, not ramps down.

## Issue 5: Per-Level Stat Growth Is Too Generous

At +2 STR and +2 DEF per level, leveling alone provides significant combat power. By level 10, base STR is 28 — almost triple the starting value of 10. Combined with the relatively modest enemy scaling, this means the player's level growth alone can outpace zone difficulty, making gear and upgrade decisions feel optional.

**The principle at stake:** Leveling should be the safety net, not the engine (Principle #6). If a player can progress just by grinding XP without thinking about gear or upgrades, you have removed their agency. The game plays itself at that point, which violates the core fantasy of intelligent early-game decision-making.

## Issue 6: Upgrade Pricing Creates No Early-Game Tension

Battle Hardening level 1 costs 120 gold. By zone 2, the sim shows the player has 29 gold on hand, and by zone 3 they are comfortably buying upgrades. The first upgrade purchase should be a meaningful sacrifice — several zones' worth of gold — that forces the player to think about *which* upgrade they want. When the first upgrade is affordable almost immediately, there is no decision pressure. The player just buys things in sequence.

The sim confirms this: all 4 upgrades are maxed out by the end. The gold economy is loose enough that the player never has to choose between competing upgrades in a meaningful way.

## Issue 7: Boss Survival Ratios Are Too Comfortable

Boss fights are the emotional peaks of your game. They should feel like a genuine test. The ideal boss survival ratio is between **1.1x and 1.5x** — the player wins, but it is close enough that they felt the danger. Here is what the data shows:

| Boss | Zone | bSurv | Assessment |
|------|------|-------|------------|
| Rotfang | 1 | 3.85 | ⚠️ Way too easy for the first boss encounter |
| THE HOLLOW | 5 | 1.18 | ✅ Perfect. This is the target. |
| Rootmaw | 6 | 5.53 | ⚠️ First boss of area 2 should not be trivial |
| Mire Mother | 10 | 3.99 | Too comfortable for an elite |
| THE LOST WARDEN | 15 | 2.61 | Close but could be tighter |
| The Forgotten | 16 | 6.51 | ⚠️ Area 3 opener, should be harder |
| THE ETERNAL SENTRY | 20 | 2.84 | Acceptable |
| CORRUPTED WARDEN | 25 | 2.46 | Acceptable |
| THE FIRST KEEPER | 30 | 1.83 | ✅ Good. Close to ideal. |

The zone 5 boss (THE HOLLOW at 1.18x) and the zone 30 boss (THE FIRST KEEPER at 1.83x) are the only bosses that land in the right range for their position. Most bosses are far too safe, which means the player never experiences the "almost beat it" productive frustration that makes boss victories feel earned.

---

# PART III — Specific Recommended Changes

These changes are ordered by impact. The first three fixes will transform the feel of your game more than everything else combined.

---

## Fix 1: Rebalance Enemy Base Stats to Create Area-Entry Walls

**Problem:** Area transitions feel like ramps down instead of walls. The player enters each new area more powerful relative to its enemies than they were at the end of the previous area.

**Solution:** Each area's base enemy stats should be tuned so that a player arriving with the previous area's best common gear and expected level faces a genuine challenge. The entry zone of each area should produce an eSurv between 1.5 and 3.0.

### Recommended Area 2 Base Enemy Stat Increases

The player arrives at zone 6 with roughly STR 35–39, DEF 26–35, HP 211–238 (depending on gear). Area 2 enemies need base stats high enough that this character struggles.

| Enemy | Current HP | Suggested HP | Current ATK | Suggested ATK | Rationale |
|-------|------------|--------------|-------------|---------------|-----------|
| Rot Vine Crawler | 65 | 100–110 | 24 | 35–38 | Entry enemy, must challenge area 1 endgame player |
| Mire Lurker | 95 | 140–150 | 36 | 48–52 | Mid-area threat, slow but hits hard |
| Wisp Swarm | 45 | 65–75 | 18 | 28–30 | Fast + fragile archetype, keeps current feel |
| Blight Stalker Evo | 85 | 130–140 | 30 | 42–45 | DoT threat, HP increase keeps them alive long enough to matter |
| Bog Revenant | 130 | 180–200 | 42 | 58–62 | Late-area wall, player needs tier 2 gear to handle |

### Recommended Area 3 Base Enemy Stat Increases

The player arrives at zone 16 with roughly STR 71–75, DEF 62–70, HP 382–408. Area 3 enemies need a dramatic stat bump.

| Enemy | Current HP | Suggested HP | Current ATK | Suggested ATK |
|-------|------------|--------------|-------------|---------------|
| Stone Sentry | 170 | 280–300 | 48 | 72–78 |
| Fractured Echo | 75 | 120–140 | 27 | 45–50 |
| Ruin Pilgrim | 120 | 200–220 | 39 | 58–62 |
| Shade Remnant | 130 | 220–240 | 48 | 70–75 |
| Blighted Guardian | 190 | 320–350 | 63 | 88–95 |
| Hearthguard Construct | 250 | 420–450 | 66 | 95–100 |
| Shade of the Keeper | 200 | 340–360 | 60 | 85–90 |

> **IMPORTANT: Tune Iteratively**
>
> These numbers are directional estimates based on combat formula analysis. The right approach is to implement them, run your balance sim, and check that zone-entry eSurv falls between 1.5 and 3.0 for each area. Then adjust from there. The exact numbers matter less than the shape of the curve.

## Fix 2: Reduce Zone Scaling, Increase Base Stat Differentiation

**Problem:** The flat 15% per-zone scaling means enemy difficulty rises linearly within an area, outpacing the player's compound power growth and creating an inverted TTK curve (enemies get harder to kill as the player progresses through a zone range, not easier).

**Solution:** Reduce the zone scaling multiplier from 0.15 to 0.08–0.10 per local zone. Compensate by making base enemy stats higher and more differentiated between the enemy types within an area. This means the *entry* to each area is harder (which we want), but the *exit* is proportionally easier relative to a geared player (which creates the snowball).

| Local Zone | Current Scale (0.15) | Proposed Scale (0.09) | Difference at Zone 10 | Difference at Zone 15 |
|------------|----------------------|-----------------------|-----------------------|-----------------------|
| 1 | 1.00x | 1.00x | — | — |
| 5 | 1.60x | 1.36x | — | — |
| 10 | 2.35x | 1.81x | −22.9% | — |
| 15 | 3.10x | 2.26x | — | −27.1% |

This single change has the largest impact on game feel. With a 0.09 scaling factor, enemy HP at zone 15 is 27% lower than with the current 0.15 factor. That is the difference between a 5-second kill and a 3.5-second kill — which is the difference between "still grinding" and "snowballing."

## Fix 3: Reduce Per-Level Stat Growth

**Problem:** +2 STR and +2 DEF per level makes leveling too powerful relative to gear and upgrades. The player's automatic stat growth outpaces the need for deliberate choices.

**Solution:** Reduce per-level growth to +1 STR and +1.5 DEF per level. Optionally reduce HP growth from +12 to +10 per level. This ensures that gear drops and upgrade purchases are the *primary* drivers of power, with leveling providing a gentle background lift that never solves the player's problems on its own.

| Stat | Current Per Level | Proposed Per Level | Impact at Level 15 | Impact at Level 30 |
|------|-------------------|--------------------|--------------------|--------------------|
| STR | +2 | +1 | 22 vs 38 (−42%) | 39 vs 68 (−43%) |
| DEF | +2 | +1.5 | 26 vs 33 (−21%) | 48.5 vs 63 (−23%) |
| HP | +12 | +10 | 240 vs 268 (−10%) | 390 vs 448 (−13%) |

This is a significant nerf to the player's passive power. That is the point. The gap between what leveling provides and what enemies demand is where gear and upgrades become meaningful. The player should look at a new zone and think "I need a better weapon," not "I just need to grind two more levels."

## Fix 4: Widen Gear Stat Bands and Increase Cross-Tier Jumps

**Problem:** Within-tier gear provides minor optimization. Cross-tier jumps are noticeable but not dramatic.

**Solution:** Increase the stat range within each tier so the best-in-tier piece is meaningfully better than the first piece found, and increase the floor of each new tier so the worst new-tier drop is clearly better than the best old-tier piece.

### Recommended Weapon Stat Progression

| Tier | Current STR/ATK | Proposed STR/ATK | Jump Feel |
|------|-----------------|------------------|-----------|
| Area 1 Common | 3 / 3 | 3–5 / 3–5 | Starting gear, low variance is fine |
| Area 2 T1 Common | 7 / 7 | 9–12 / 9–12 | Clear breakthrough from area 1 best |
| Area 2 T2 Common | 9 / 9 | 14–18 / 14–18 | Significant jump, not incremental |
| Area 3 TA Common | 13 / 13 | 20–25 / 20–25 | New area reset demands new gear |
| Area 3 TB Common | 17 / 17 | 28–34 / 28–34 | Endgame approach, big numbers |
| Area 3 TC Common | 22 / 22 | 38–45 / 38–45 | Final tier, feels like real power |

Apply proportional increases to armor, HP, and secondary stats on defensive gear. The principle is: each tier should roughly double the stat contribution of the previous tier, not add a fixed amount to it.

> **NOTE ON UNCOMMONS**
>
> With wider stat bands, uncommons become even more exciting because their 1.5x multiplier applies to a larger base. An uncommon weapon in the proposed area 3 tier C with a base of 45 becomes 67.5 — a genuinely dramatic find. This is good. Uncommons should feel like events.

## Fix 5: Restructure Upgrade Pricing to Create Early-Game Decisions

**Problem:** Upgrade costs are low enough that the player buys them sequentially without meaningful tradeoffs.

**Solution:** Increase base costs for the first 2–3 levels of each upgrade so they require meaningful gold accumulation. The player entering area 2 should be able to afford maybe 1–2 total upgrade levels, forcing a real choice about where to invest.

| Upgrade | Current L1 Cost | Proposed L1 Cost | Current L2 Cost | Proposed L2 Cost | Rationale |
|---------|-----------------|------------------|-----------------|------------------|-----------|
| Battle Hardening | 120 | 300 | 216 | 600 | STR is the most impactful stat early; it should cost accordingly |
| Auto-Attack Speed | 150 | 400 | 300 | 800 | Speed is a multiplier on everything; premium pricing justified |
| Gold Find | 60 | 150 | 102 | 300 | ROI upgrade; cheaper than combat stats but still a real investment |
| Sharpen Blade | 75 | 200 | 135 | 400 | Click damage matters in early active play |

Keep the exponential scaling factor the same — the late-game costs are fine. The change is to the base costs, which shifts the entire curve upward for early levels while maintaining the same shape.

## Fix 6: Introduce Player Death as a Real Possibility

**Problem:** The sim shows the player never dies or even comes close to dying against regular enemies (minimum eSurv of 2.12 at zone 30). Death exists in the system but functions as a theoretical possibility rather than a lived experience.

**Solution:** With the enemy stat increases from Fix 1 and the player stat reductions from Fix 3, death should become a real possibility in zone-entry situations. But you should also ensure the *penalty* for death is tuned correctly. The current 1500ms respawn delay is very short. Consider:

| Element | Current | Proposed | Reasoning |
|---------|---------|----------|-----------|
| Respawn delay | 1500ms | 2500–3000ms | Long enough to feel consequential, short enough to not frustrate |
| Death penalty | None apparent | Drop to previous zone on 3 consecutive deaths | Creates a clear signal: you are not ready for this zone yet |
| Recovery mechanic | None | First kill after death drops guaranteed gold (1.5x) | Softens the sting, gets the player back into the loop |

The goal is not to punish the player. It is to make survival *mean something*. A game where you cannot die is a game where winning has no weight.

## Fix 7: Tune Boss Kill Thresholds to Match Zone Duration Goals

**Problem:** The current threshold formula `(10 + (localZone - 1) * 5)` scales linearly up to 80 kills for zone 15 (local) of area 3. At current eTTK values of 4–5 seconds plus a 1-second spawn delay, this means the player is spending 7–8 minutes per late-game zone just on the kill threshold. That is fine for idle play but means the active early game also takes a minimum of ~1 minute per zone even when kills are fast, which may be too low for early engagement.

**Solution:** Consider a two-part threshold: a flat base of 15 kills for all zones (establishes minimum engagement), plus a per-area multiplier that accounts for TTK differences. Alternatively, gate bosses behind a gold threshold rather than a kill count — this creates a natural link between "have I farmed enough" and "am I strong enough," since gold accumulation correlates with both time spent and efficiency.

## Fix 8: Add Enemy DEF to Create Gear-Check Moments

**Observation:** Every single enemy in the game has 0 DEF. The player's damage formula subtracts `(EnemyDEF * 0.3)` from STR, but since enemy DEF is always 0, this entire mechanic is unused. This is a missed opportunity.

**Solution:** Introduce enemy DEF on specific enemies starting in area 2, particularly on "armored" archetypes like Stone Sentry, Blighted Guardian, and Hearthguard Construct. Even modest DEF values (10–25) create situations where the player's damage is noticeably reduced, making weapon upgrades feel more urgent. An enemy with 20 DEF reduces player damage by 6 points (20 * 0.3). For a player with 40 STR, that is a 15% damage reduction — enough to feel, not enough to brick progress.

This also gives you a design lever for boss encounters: a boss with high DEF rewards the player who prioritized STR upgrades, while a boss with high ATK and low DEF rewards the player who prioritized DEF and HP. Different boss archetypes test different player choices.

---

## Priority Implementation Order

| Priority | Fix | Effort | Impact on Feel |
|----------|-----|--------|----------------|
| 1 | Reduce zone scaling (Fix 2) | One number change | **Enormous — Creates the snowball** |
| 2 | Increase area-entry enemy stats (Fix 1) | Re-tune ~20 enemy stat blocks | **Enormous — Creates area-entry walls** |
| 3 | Reduce per-level growth (Fix 3) | One config change | **High — Makes gear matter more** |
| 4 | Widen gear stat bands (Fix 4) | Re-tune ~30 item stat blocks | High — Creates breakthrough moments |
| 5 | Restructure upgrade pricing (Fix 5) | 4 base cost changes | Medium — Creates early decisions |
| 6 | Add enemy DEF (Fix 8) | Add values to enemy data | Medium — Creates gear-check moments |
| 7 | Introduce death mechanics (Fix 6) | Code + balance | Medium — Makes survival mean something |
| 8 | Tune boss thresholds (Fix 7) | Formula tweak | Low-medium — Pacing refinement |

Fixes 1–3 are the foundation. Implement them together, run your sim, and evaluate the resulting curves before touching anything else. The remaining fixes layer on top of a game that already *feels right* at the macro level.

> **FINAL NOTE: THE SIM IS YOUR COMPASS**
>
> After each change, re-run your balance sim and check three numbers: zone-entry eSurv (target 1.5–3.0), zone-exit eTTK (target 2–3 seconds), and boss bSurv (target 1.1–1.5 for mini-bosses, 1.0–1.3 for area bosses). If those three numbers are in range, the game will feel right. Everything else is refinement.
