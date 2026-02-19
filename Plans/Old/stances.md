I like the concept of the rock-paper-scissors feel, plus it also feels good to be smart. Let's say the character, the player has three different basic things you can do in an active way right at the beginning. Maybe it's like:
* A power attack that hits a ton but does a ton of tiny, weaker attacks, like a bunch of rapid punches.
* One super strong hit.
* Maybe a defensive stance, maybe even changing stances.
 Maybe you have three different stances you can be in and you can flip between them. Maybe that's the thing, and those are essentially three different builds:
* A strong attack build.
* A fast attack build.
* A heavy tank build.
 Each one is good against certain types of enemies, and instead of choosing active attacks, you're flipping between character states.

Show less
2:27 PM

Examined stance-switching mechanic's interaction with enemy types and gameplay feel


This is a really strong core mechanic for the idle genre specifically, because it solves a fundamental problem: you need active play to feel meaningful without requiring moment-to-moment button mashing. Stance switching is a decision, not a reflex, which means it works at the pace of an idle game while still rewarding attention.

Let me think through how this plays out.

Why three stances works so well here. The beauty of this is that the player's "skill" isn't mechanical — it's reading the situation. You see a new enemy, you assess what kind of threat it is, and you flip to the right stance. That assessment is the gameplay. And once you've figured out an area, you know which stance to leave your character in for idle farming, which is a clean transition from active to passive play. You've essentially turned game knowledge into power progression, which feels great.

How the stances map to enemy pressure. Think of it as each stance having a natural predator and natural prey:

The fast stance shreds anything where you need to outpace something — regen enemies, summoners (killing adds quickly), enemies with vulnerable windows (more attacks means more chances to hit during the window), and anything where sustained DPS over time matters. But it bounces off armored enemies and it feeds damage-reflect enemies because you're hitting them so many times.

The power stance cracks open anything with a damage threshold or armor, handles reflect enemies well since fewer hits means less reflected damage, and is great for burst windows on phased or shielded enemies. But it struggles against evasive enemies because each miss costs you enormously when you're only swinging occasionally, and it's bad against swarms since you're overkilling individual small enemies.

The tank stance is your answer to telegraphed big hits, debuffers and DoT enemies where you need to outlast them, enrage mechanics where you need to survive the dangerous phase, and anything where the enemy's strategy is to overwhelm your defenses. But fights take forever, so anything with a timer or scaling threat punishes you for being slow.

The interesting part — enemies that aren't cleanly solved by one stance. This is where your design gets really rich. The best enemies should create tension where no single stance is the obvious answer, or where the right stance changes during the fight.

Imagine your enrage enemy — the one that gets stronger at low HP. Early in the fight, fast stance is great because you're shredding through its HP quickly. But once it hits the enrage threshold, suddenly you're taking huge hits from an enemy you've made angry, and you might need to swap to tank stance to survive the final phase. The player who reads that transition and swaps at the right moment kills it efficiently. The player who stays in fast stance either dies or needs much better gear to brute force it.

Or the summoner — maybe fast stance handles the adds well, but the summoner itself has armor, so you actually want to swap to power stance when the adds are dead, burst the summoner, then swap back to fast when new adds spawn. Now you have a rhythm to the fight.

The idle-to-active spectrum this creates. Here's what I think is the most elegant thing about this system. When a player first enters a new area, they're actively reading enemies and swapping stances, maybe even mid-fight. That's the "active" phase where the area is challenging. As they gear up, they find the one stance that works well enough against everything in the area, leave it on, and idle farm. Then they push to the next area and they're back to active stance management.

But you could add another layer to this. What if the idle AI has a "stance preference" you can set? Like, "default to tank stance" for safe idle farming at the cost of speed, or "default to fast stance" for faster farming but you might die to certain enemy types if your gear isn't good enough. That gives the player a meaningful idle configuration decision — do I farm safely and slowly, or do I push my luck for faster drops?

Where this gets even more interesting — hybrid and transition costs. You might want to think about whether stance switching is instant or has a cost. If it's instant, the optimal play is always to be in the perfect stance for every moment, which can feel frantic. If there's a small cooldown or transition animation, then you're committing to a stance for a few seconds, which makes the decision weightier. Maybe when you switch, there's a brief vulnerable moment where you're in no stance, so switching at the wrong time is punished. That prevents the degenerate strategy of just mashing between stances constantly and rewards reading the fight correctly.

You could also think about whether stances have a "momentum" mechanic — like fast stance gets faster the longer you stay in it, building up combo stacks, so switching out costs you that buildup. Power stance might charge up a bigger hit the longer you wait. Tank stance might build up a damage absorption shield over time. This rewards committing to a stance and makes the switch decision more costly and therefore more interesting.

Gear and progression tie-in. This also gives you a really natural gear system. Gear could lean into one stance — fast attack gloves, a heavy two-handed hammer for power, a shield for tank — but the player always has access to all three stances. So gear shifts the balance rather than locking you in. Maybe a well-geared fast build can handle some enemies that would normally require power stance, because the gear compensates for the weakness. That means gear progression gradually smooths out the rock-paper-scissors, which is exactly what lets an area transition from "active management required" to "idle farmable."

The big thing I'd keep in mind is making sure each stance feels different, not just numerically but visually and rhythmically. Fast stance should have a flurry of hit numbers popping up. Power stance should have a satisfying pause and then a big chunky number. Tank stance should have visible damage reduction, shields, or a health bar that barely moves. In a clicker/idle game, readability and visual feedback are doing a lot of the work that animation and game feel do in action games.

Let's really think deeply on what each of these three stances would look like. How do you build in a really solid feeling progression over a long idle game? It's going to be played for like 10s, if not hundreds, of hours. What can we put in there? In the mid to late game that really expands on these systems, and then how focused can we be in the beginning to really differentiate between the three different stances?
I guess I'm looking for making this as elegant as possible, while at the same time allowing for complexity growth over time. That's interesting and meaningful for the player.

2:34 PM

Architected progression framework balancing early simplicity with late-game complexity expansion


This is the kind of design question where getting the foundation right makes everything else fall into place, so let me really dig in.

The core principle: each stance should be defined by a single, intuitive verb at the start, and then the progression system adds adverbs and adjectives to that verb over time.

At minute one, the player understands: fast stance hits a lot, power stance hits hard, tank stance endures. That's the entire tutorial. Everything you add over the course of a hundred hours should be elaborating on what "hits a lot," "hits hard," and "endures" can mean, not contradicting it.

EARLY GAME — THE CLEAN FOUNDATION

Fast Stance: Flurry

The core loop is volume. Your character attacks rapidly, each hit is small, and you see a stream of small damage numbers. The feel is a buzzing, relentless pressure. Think of the visual as a rapid tapping or scratching — claw marks, quick jabs, a flurry of small sparks.

The single defining stat is attack speed. Everything else flows from that. You hit often, so anything that procs "on hit" is naturally better here. You generate more contact with the enemy per second, so you're the stance that discovers enemy mechanics fastest — you'll trigger a reflect enemy's reflection quickly, you'll notice a regen enemy's health refilling between your small hits, you'll land hits during brief vulnerability windows more reliably.

The early game weakness should be viscerally obvious: you fight an armored enemy and you see a wall of "1, 1, 1, 1, 1" damage numbers. The player doesn't need a tooltip to understand the problem. They feel it.

Power Stance: Impact

The core loop is commitment. Your character winds up, pauses, and delivers a single massive hit. The feel is weighty and deliberate. Big, chunky damage number, screen shake or a flash, the enemy health bar drops in a visible chunk. Between hits, there's a breath of tension — your character is vulnerable and doing nothing, which makes each swing feel like it matters.

The defining stat is raw damage per hit. The early game satisfaction is the opposite of Flurry — you fight that armored enemy and you see the armor just crack. One big number punches through where the fast stance couldn't. But put this against a swarm of small enemies and the problem is obvious: you overkill the first one with 500 damage when it only had 50 HP, then stand there winding up while five others are chewing on you. Wasted force. The player feels the inefficiency without being told.

Tank Stance: Fortress

The core loop is inevitability. Your character attacks slowly, hits moderately, but barely takes damage. The feel is a siege — you're a wall, and the enemy is slowly exhausting itself against you. Health bars move slowly on both sides. The visual should emphasize solidity — a shield, a brace, a glow of absorption.

The defining stat is damage reduction, and the secondary identity is sustain — maybe a small passive heal or lifesteal that's unique to this stance. The early game appeal is safety. New area, unknown enemies, scary damage? Go Fortress, survive, learn the enemy's patterns, then switch to an offensive stance once you know what you're dealing with. The weakness is time. Everything takes forever. A regen enemy in Fortress stance is a stalemate. A scaling enemy in Fortress stance eventually overwhelms you because you can't kill it before it powers up. The player watches the fight drag on and thinks "I need to kill this faster" — that's the natural push toward switching.

THE PROGRESSION LAYER — HOW YOU DEEPEN WITHOUT MUDDYING

Here's where the long-term design lives. I'd suggest thinking about progression in three distinct layers that unlock over time.

Layer 1: Stance Mastery (unlocks maybe 1-3 hours in)

Each stance has its own experience bar. The more you use Flurry, the better your Flurry gets. This does two things: it rewards the player for engaging with the stance system rather than just camping one stance, and it creates a natural "identity" where players start to feel ownership of their preferred stance.

But here's the key — mastery shouldn't just add numbers. It should add mechanical nuance to the stance. Flurry mastery might unlock a "combo counter" mechanic where consecutive hits without switching build a multiplier that resets on stance change. Now staying in Flurry has a compounding reward, which makes the decision to switch away from Flurry feel costly. Power mastery might unlock a "charge" mechanic where the longer you wait between swings (up to a cap), the harder the next one hits. Now there's a micro-optimization within the stance — do you swing as soon as possible, or do you wait an extra beat for more damage? Tank mastery might unlock a "retaliation" mechanic where absorbed damage builds up a counter that releases as a burst of damage, so your tankiness is slowly converting into offense.

These mastery mechanics are important because they give each stance an internal skill curve, not just a matchup-dependent identity. A novice Flurry player just attacks fast. A mastered Flurry player is maintaining combo stacks and thinking about when it's worth breaking the combo to switch.

Layer 2: Stance Talents / Skill Trees (unlocks maybe 5-10 hours in)

This is where you let the player specialize within a stance and where two players using Flurry start to look different from each other. Think of these as branching paths within each stance:

Flurry might branch into "Bleed" (each hit stacks a DoT, so your fast attacks become a ticking time bomb) versus "Chain" (hits have a chance to bounce to nearby enemies, turning Flurry into an AoE stance) versus "Exploit" (crits deal bonus damage that scales with how many times you've already hit the target, rewarding sustained single-target focus).

Power might branch into "Shatter" (hits reduce enemy armor permanently, so each swing makes the next one better) versus "Execute" (bonus damage against enemies below a health threshold, making Power the finisher stance) versus "Tremor" (each hit does splash damage to nearby enemies, solving the AoE weakness but at reduced efficiency).

Fortress might branch into "Thorns" (reflected damage scaling with how much you absorb) versus "Regenerator" (massive self-healing that lets you sustain through almost anything) versus "Unbreakable" (a shield mechanic that periodically grants full immunity for a brief window).

The crucial design principle here is that each branch should change what the stance is good at while preserving how it feels. Bleed Flurry and Chain Flurry both feel like rapid attacking, but one is a single-target DoT specialist and the other is a crowd clearer. The player's identity isn't just "I use Flurry" anymore, it's "I use Bleed Flurry," and that distinction matters against different enemies.

Layer 3: Stance Synergies and Transitions (unlocks maybe 15-25 hours in)

This is the layer that makes the system sing for long-term players, and it's the one that rewards truly understanding all three stances rather than just mastering one.

The concept: switching stances isn't just a binary swap anymore — the stance you're leaving colors the stance you're entering. What you were just doing affects what you're about to do.

Flurry → Power: "Momentum." Your accumulated combo stacks from Flurry add bonus damage to your first Power hit. So the optimal play against certain enemies is to build up Flurry stacks and then cash them in with a massive Power swing. Suddenly these two stances aren't just alternatives; they're a sequence.

Power → Fortress: "Aftershock." Your last Power hit's damage determines how much bonus armor you get when entering Fortress. So you swing big, then hunker down, and you're rewarded with extra survivability proportional to your commitment to Power.

Fortress → Flurry: "Release." Stored retaliation damage from Fortress converts into bonus attack speed for your first several seconds of Flurry. You've been tanking, absorbing, building pressure, and now you release it as a burst of speed.

This creates a rotation — not a mandatory one, but an emergent optimal pattern for players who want to engage deeply. Against a tough enemy, the advanced player might go Fortress to absorb the opening salvo and build retaliation, swap to Flurry to release that stored energy and build combo stacks, then swap to Power to cash in the combo as a massive finisher. That's a three-phase fight strategy that emerges naturally from the mechanics without ever being explicitly taught.

And the important thing: a player who doesn't want to engage with this can still just sit in one stance and be fine for farming. The transitions are a bonus, not a requirement.