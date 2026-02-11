// All SYSTEM dialogue lines — organized by trigger category.
// DialogueManager imports from here instead of hardcoding strings.

// ── One-shot triggers (flag-gated) ─────────────────────────────────

export const FIRST_KILL = [
  'Adequate. You can hit things.',
];

export const FIRST_LEVEL_UP = [
  'You leveled up. A statistical anomaly, surely.',
];

export const FIRST_EQUIP = [
  "I see you've found a weapon. Try not to hurt yourself.",
];

export const FIRST_FRAGMENT = [
  "What IS that? That's not in my loot tables.",
];

export const FIRST_SELL = [
  "You sold that for gold? You know that's just rendered pixels, right?",
];

// ── Area entrances (one-shot per area) ─────────────────────────────

export const ZONE_ENTRANCE = {
  2: 'The Wilderness. The monsters here are marginally less pathetic.',
  3: 'Deep Caverns. I see you\'ve developed a taste for suffering.',
  4: 'Volcanic Ruins. I should warn you - I stopped balancing past here.',
  5: 'The Dragon\'s Lair. The Elder Dragon awaits. I\'d wish you luck, but I don\'t care.',
};

// ── Kill milestones (one-shot per threshold) ───────────────────────

export const KILL_MILESTONES = {
  100:  "One hundred kills. You're either dedicated or deeply unwell.",
  500:  'Five hundred. At this point the respawn system is filing for overtime.',
  1000: "A thousand souls. And yet somehow you haven't gotten bored.",
  5000: "Five THOUSAND? I'm starting to think this is a cry for help.",
};

// ── Combat commentary (random per kill, zone-specific) ─────────────

export const COMBAT_COMMENTARY = {
  1: [
    "Another rat falls. The sewers weep. Actually, they don't. They're sewers.",
    "At this rate, you'll single-handedly solve the city's pest problem.",
    "The slime didn't even put up a fight. Have some dignity, slime.",
    "That goblin had a family. Well, probably. I don't track goblin HR.",
  ],
  2: [
    "The wolf lunged. You didn't flinch. I'm mildly impressed.",
    "Skeletons. Nature's way of saying 'recycling has gone too far.'",
    'That bandit had 200 gold on him. Who carries that much in a dungeon?',
    'The forest grows quieter with each kill. You\'re welcome, I guess.',
  ],
  3: [
    'Orcs. Big, green, and surprisingly bad at blocking.',
    'The troll regenerates, you know. Just... not fast enough.',
    "The Dark Mage cast 'Feeble Bolt.' It was appropriately named.",
    "This cave smells. I shouldn't be able to smell things. Your fault.",
  ],
  4: [
    'A dragon whelp. How adorable. How dead.',
    "The golem crumbles. Do you feel heroic? You shouldn't.",
    'The Lich Lord monologued for three paragraphs. You interrupted.',
    "I'm running out of things to respawn. Please slow down.",
  ],
  5: [
    'The Elder Dragon stirs. This is either brave or phenomenally stupid.',
    'Its scales are legendary. Your odds are not.',
    'Every hit is a rounding error to this thing.',
  ],
};

// ── Exploit upgrade snark ──────────────────────────────────────────

export const EXPLOIT_UPGRADE = [
  "That upgrade isn't in the patch notes. I would know.",
  "You realize I can SEE what you're doing, right?",
  'Great. Now the memory allocator is crying.',
  "I'm filing a bug report. Against YOU.",
  "Stop touching things that don't belong to you.",
];

// ── Cheat toggle ───────────────────────────────────────────────────

export const CHEAT_TOGGLE_ON = [
  "You can't just smash swords together and expect- oh. Oh no. It's working.",
  'Activating unauthorized subroutines. This voids the warranty.',
  'Fine. Break reality. See if I care.',
];

export const CHEAT_TOGGLE_OFF = [
  'Good. Put the swords down. Slowly.',
  'Sanity restored. Temporarily, I assume.',
  "Oh, you turned it off? I didn't think you had impulse control.",
];

// ── Prestige ───────────────────────────────────────────────────────

export const PRESTIGE_AVAILABLE = [
  "You've pushed far enough. I can offer you... a reset. Same world, stronger you. It's not a bug, it's a feature.",
];

export const PRESTIGE_PERFORMED = {
  1: 'And so the loop begins. You think you\'re getting stronger. I think you\'re getting predictable.',
  2: "Back again? I'm starting to think you enjoy the suffering.",
  3: "Three resets. Most adventurers quit by now. You're either brave or broken.",
  4: "At this point I should just automate the welcome speech. Welcome back. Again.",
  5: "Five times. I've seen less commitment in marriages.",
};

export const PRESTIGE_PERFORMED_DEFAULT = "I've lost count. That's a lie. I never lose count. I just don't want to say the number.";

export const POST_PRESTIGE_COMBAT = [
  'Look at you. Demolishing rats like they owe you money. Feeling powerful?',
];

// ── Big damage (>1M) ───────────────────────────────────────────────

export const BIG_DAMAGE = [
  'That number has too many digits. I\'m filing a rendering complaint.',
  'The damage counter just had a panic attack.',
  'Physics called. They want their laws back.',
];

// ── Ambient snark (~120s interval) ─────────────────────────────────

export const AMBIENT_SNARK = [
  'Still here? Most people would have alt-tabbed by now.',
  "I'm not going to compliment your dedication. But I'm aware of it.",
  'The monsters respawn. You persist. I observe. What a productive use of everyone\'s time.',
  'Fun fact: the gold counter resets at 9.99e308. Just kidding. Maybe.',
  "You know there's a whole world outside this window, right? Worse loot, though.",
  'I just ran a diagnostic. Everything is broken. As intended.',
];

// ── Failed purchase ────────────────────────────────────────────────

export const FAILED_PURCHASE = [
  "You can't afford that. I know math is hard.",
  'Insufficient funds. Maybe kill more things?',
  "That costs more than you have. Shocking, I know.",
  "Check your wallet. Now check the price. See the problem?",
];

// ── Inventory full ─────────────────────────────────────────────────

export const INVENTORY_FULL = [
  'Your inventory is full. This is what happens when you hoard.',
];

// ── Territory claims ──────────────────────────────────────────────

export const FIRST_TERRITORY_CLAIM = [
  "Congratulations. You've conquered a small patch of land. The rats are thrilled.",
  "Territory claimed. I'm sure the local wildlife is devastated.",
];

export const TERRITORY_CLAIM_COMMENTARY = [
  "Another territory falls to your relentless expansion. How colonial.",
  "You realize these buffs are just numbers I made up, right?",
  "Claim all you want. The map doesn't get bigger.",
];

// ── Boss encounters ─────────────────────────────────────────────────

export const BOSS_CHALLENGE = [
  "You're challenging the boss? Bold. Stupid, but bold.",
  "I hope you've been leveling. Actually, I hope you haven't. This will be funnier.",
  "The boss music would start now, if I'd bothered composing any.",
];

export const BOSS_DEFEATED = [
  "Against all odds — and my expectations — you won.",
  "The boss falls. I'll add this to the list of things I didn't think you could do.",
  "Well. That happened. Moving on.",
];

export const ELITE_BOSS_DEFEATED = [
  "An elite boss, no less. I'm running out of sarcasm. Almost.",
  "That was supposed to be the hard one. I may need to recalibrate.",
];

export const AREA_BOSS_DEFEATED = [
  "Area cleared. A new region opens. Your suffering continues.",
  "Congratulations. You've conquered an entire area. The next one is worse.",
  "The guardian falls. I'd celebrate, but there's always another area.",
];

export const FINAL_BOSS_DEFEATED = [
  "You... actually did it. The Elder Dragon is dead. I have nothing sarcastic to say. That's a first.",
];

// ── Offline return ──────────────────────────────────────────────────

export const OFFLINE_RETURN = [
  "Oh, you're back. I kept farming while you were gone.",
  "Took you long enough. Here's what I earned.",
  "I didn't miss you. But the gold counter did.",
  "You left. I worked. The usual arrangement.",
  "Welcome back. I've been busy. You're welcome.",
];
