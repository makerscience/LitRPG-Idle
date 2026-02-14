# LitRPG Idle — Game Summary

## What Is This?

A browser-based idle RPG built with Phaser 3, targeting desktop at 1280x720 and publishing to Itch.io. The player fights through 30 zones across 3 distinct areas, killing enemies, collecting loot, upgrading stats, and challenging hand-crafted named bosses to advance deeper into an increasingly hostile world.

## Tone and Feel

**Dark, dry, self-aware.** The game knows it's a game — and it won't let you forget it.

The world is grim but never gloomy. Area names like *The Harsh Threshold*, *The Overgrown Frontier*, and *The Broken Road* paint a decaying, hostile landscape, but the tone stays sharp rather than bleak. There's no melodrama here — just a crumbling world full of things that want to kill you, narrated by something that finds the whole situation mildly amusing.

The defining voice is **SYSTEM** — a sarcastic, omniscient narrator that comments on everything. It congratulates your first kill with *"Adequate. You can hit things."*, mocks your deaths, questions your life choices (*"Still here? Most people would have alt-tabbed by now."*), and grudgingly acknowledges when you actually accomplish something (*"Against all odds — and my expectations — you won."*). SYSTEM is not your ally or your enemy. It's the voice of the game itself — bored, judgmental, occasionally impressed against its will.

The humor sits at the intersection of LitRPG meta-awareness and idle game absurdity. Enemies respawn endlessly and SYSTEM knows it. Gold is "just rendered pixels." The damage counter "has too many digits" and "physics called — they want their laws back." It's the comedy of a world that takes itself exactly seriously enough to be funny when it doesn't.

## Core Fantasy

**You are weak, and the world doesn't care.** The game opens with slimes and rats — tutorial-tier cannon fodder — and even they demand attention. Every zone you survive is earned. Every boss you defeat is a statement. The progression from struggling against Hollow Slimes in zone 1 to toppling THE FIRST KEEPER in zone 30 should feel like a genuine journey, not a foregone conclusion.

This is idle RPG progression done with intention. The numbers go up — that's the genre — but they go up *because you made choices*. Which gear to equip. Which upgrades to prioritize. When to challenge the boss. The game respects the idle loop while giving it enough mechanical teeth to matter.

## What We're Building

A **vertical slice** — three complete areas with full enemy rosters, hand-tuned loot tables, zone-based gear progression, and 30 named bosses. Not a prototype, not a demo. A complete arc from "you are nothing" to "you have become something" in a single playthrough.

The systems are deliberately constrained for this release:
- **7 equipment slots** that unlock as you push deeper (legs at zone 6, boots at zone 9, gloves at zone 17, amulet at zone 22)
- **Common and uncommon gear** only — no rarity bloat
- **4 upgrades** purchasable with gold, giving meaningful power spikes
- **Pity system** on boss loot so bad luck never stalls progress completely
- **Offline progress** so time away still means something

Features like prestige loops, territory conquest, and town-building exist in the codebase but are deliberately gated off. The vertical slice stands on its own. Those systems come later, layered onto a foundation that already works.

## The Experience We Want to Deliver

**Satisfying, low-friction, oddly compelling.** The player should:

1. **Feel the crunch** — Combat is readable. Damage numbers tier up visually as you grow stronger. DoT effects are called out. Armor penetration is warned about when dangerous enemies spawn. You can see the math working, even if you never think about the math.

2. **Chase the next unlock** — A new equipment slot. A stronger weapon drop. The boss threshold ticking closer. There's always something 2-3 minutes away that makes you want to stay.

3. **Smile at the writing** — SYSTEM's commentary should land at least once per session. The tone rewards paying attention without punishing you for ignoring it. It's flavor, not friction.

4. **Feel the world** — Parallax forests scroll with perspective depth. Trees grow as they approach. Ferns sway in layered rows. Enemy sprites have attack, reaction, and death poses. The visual presentation punches above "idle game" weight class without pretending to be something it isn't.

5. **Leave and come back** — Offline progress and auto-save mean closing the tab is never punishing. SYSTEM will mock you for leaving, but it'll also hand you the rewards you earned while you were gone.

## Who Is This For?

Players who enjoy idle/incremental games but want something with a bit more craft. People who liked the *progression feel* of games like Idle Slayer, NGU Idle, or Melvor Idle, but also appreciate a voiced personality in the world. LitRPG readers who get the meta-humor of a game system that's aware it's a game system.

The vibe is: **cozy grind, sharp writing, surprising depth.**
