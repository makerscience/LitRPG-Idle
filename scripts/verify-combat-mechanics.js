#!/usr/bin/env node
// Phase 7 combat verification checks for Phase 5/6 mechanics.

import assert from 'node:assert/strict';
import { EVENTS, on, bus } from '../src/events.js';
import { COMBAT_V2 } from '../src/config.js';
import { getBaseDamage, getHpRegen } from '../src/systems/ComputedStats.js';
import Store from '../src/systems/Store.js';
import TimeEngine from '../src/systems/TimeEngine.js';
import CombatEngine from '../src/systems/CombatEngine.js';

function captureEvent(eventName) {
  const payloads = [];
  const unsub = on(eventName, (payload) => payloads.push(payload));
  return { payloads, unsub };
}

function assertHasKeys(payload, required, context) {
  for (const key of required) {
    assert.ok(payload && (key in payload), `${context}: missing key "${key}"`);
  }
}

function mkEnemyData(overrides = {}) {
  return {
    id: 'test_enemy',
    name: 'Test Enemy',
    hp: 100,
    attack: 1,
    attackSpeed: 0.001, // practically disables auto attack during short test windows
    defense: 0,
    accuracy: 80,
    armorPen: 0,
    dot: null,
    regen: 0,
    enrage: null,
    thorns: 0,
    evasion: 0,
    armor: null,
    corruption: 0,
    summon: null,
    lootTable: [],
    goldDrop: 0,
    xpDrop: 0,
    ...overrides,
  };
}

function mkMember(slot, overrides = {}, opts = {}) {
  return CombatEngine._buildMember(mkEnemyData(overrides), slot, opts);
}

function startEncounter(members) {
  const template = {
    id: 'test_template',
    attackSpeedMult: 1,
    rewardMult: 1,
    lootBonus: { dropChanceMult: 1, rarityBoost: 0 },
  };
  const enc = CombatEngine._createEncounterRuntime(members, template, 'normal');
  CombatEngine._startEncounter(enc);
  return enc;
}

function setupHarness() {
  bus.removeAllListeners();
  CombatEngine.destroy();
  TimeEngine.destroy();
  Store.destroy();
  TimeEngine.init();
  Store.init();
}

function teardownHarness() {
  try {
    if (CombatEngine.getEncounter()) {
      CombatEngine._onEncounterEnd('zone_change');
    }
  } catch {}
  CombatEngine.destroy();
  TimeEngine.destroy();
  Store.destroy();
  bus.removeAllListeners();
}

function runTest(name, fn) {
  setupHarness();
  try {
    fn();
    console.log(`PASS: ${name}`);
  } finally {
    teardownHarness();
  }
}

function testPlayerMissEvent() {
  const missCap = captureEvent(EVENTS.COMBAT_PLAYER_MISSED);
  try {
    const target = mkMember(0, { id: 'miss_target', evasion: 1 });
    startEncounter([target]);
    const hpBefore = target.hp.toString();

    CombatEngine.playerAttack(false);

    assert.equal(missCap.payloads.length, 1, 'expected one COMBAT_PLAYER_MISSED event');
    assert.equal(target.hp.toString(), hpBefore, 'target HP changed on guaranteed miss');
    assertHasKeys(
      missCap.payloads[0],
      ['encounterId', 'instanceId', 'slot', 'enemyId', 'source'],
      'COMBAT_PLAYER_MISSED',
    );
  } finally {
    missCap.unsub();
  }
}

function testArmorBreakExpiry() {
  const brokenCap = captureEvent(EVENTS.COMBAT_ARMOR_BROKEN);
  const restoredCap = captureEvent(EVENTS.COMBAT_ARMOR_RESTORED);
  try {
    const target = mkMember(0, { id: 'armor_target', armor: { reduction: 0.4 } });
    startEncounter([target]);

    const applied = CombatEngine.armorBreakTarget(250);
    assert.equal(applied, true, 'armor break was not applied');
    assert.equal(target._armorBroken, true, 'target should be armor-broken immediately');
    assert.equal(brokenCap.payloads.length, 1, 'expected COMBAT_ARMOR_BROKEN');
    assertHasKeys(
      brokenCap.payloads[0],
      ['encounterId', 'instanceId', 'slot', 'enemyId'],
      'COMBAT_ARMOR_BROKEN',
    );

    TimeEngine.update(260);

    assert.equal(target._armorBroken, false, 'armor break should expire');
    assert.equal(restoredCap.payloads.length, 1, 'expected COMBAT_ARMOR_RESTORED');
    assertHasKeys(
      restoredCap.payloads[0],
      ['encounterId', 'instanceId', 'slot', 'enemyId'],
      'COMBAT_ARMOR_RESTORED',
    );
  } finally {
    brokenCap.unsub();
    restoredCap.unsub();
  }
}

function testSummonSlotCap() {
  Store.setAreaZone(3, 21);
  const castingCap = captureEvent(EVENTS.COMBAT_ENEMY_CASTING);
  const addedCap = captureEvent(EVENTS.COMBAT_MEMBER_ADDED);
  try {
    const summoner = mkMember(0, {
      id: 'slotcap_summoner',
      summon: {
        enemyId: 'a3_shade_remnant',
        count: 3,
        castTime: 200,
        maxAdds: 5,
        cooldownMs: 1000,
      },
    });
    const fillerA = mkMember(1, { id: 'filler_a' });
    const fillerB = mkMember(2, { id: 'filler_b' });
    const fillerC = mkMember(3, { id: 'filler_c' });
    startEncounter([summoner, fillerA, fillerB, fillerC]);

    CombatEngine._tryStartSummonCast(summoner.instanceId);
    assert.equal(castingCap.payloads.length, 1, 'summon casting should start');
    assertHasKeys(
      castingCap.payloads[0],
      ['encounterId', 'instanceId', 'slot', 'enemyId', 'castTime'],
      'COMBAT_ENEMY_CASTING',
    );

    TimeEngine.update(250);

    const adds = CombatEngine.getLivingMembers().filter(m => m.isAdd);
    assert.equal(adds.length, 1, 'slot cap should allow only one add with one free slot');
    assert.equal(adds[0].slot, 4, 'summoned add should occupy last free slot');
    assert.equal(addedCap.payloads.length, 1, 'expected one COMBAT_MEMBER_ADDED');
    assertHasKeys(addedCap.payloads[0], ['encounterId', 'memberCount', 'member'], 'COMBAT_MEMBER_ADDED');

    CombatEngine._tryStartSummonCast(summoner.instanceId);
    assert.equal(castingCap.payloads.length, 1, 'no casting should start when encounter is full');
  } finally {
    castingCap.unsub();
    addedCap.unsub();
  }
}

function testSummonMaxAddsCap() {
  Store.setAreaZone(3, 21);
  const addedCap = captureEvent(EVENTS.COMBAT_MEMBER_ADDED);
  try {
    const summoner = mkMember(0, {
      id: 'maxadd_summoner',
      summon: {
        enemyId: 'a3_shade_remnant',
        count: 2,
        castTime: 150,
        maxAdds: 2,
        cooldownMs: 1000,
      },
    });
    startEncounter([summoner]);

    CombatEngine._tryStartSummonCast(summoner.instanceId);
    TimeEngine.update(200);
    let adds = CombatEngine.getLivingMembers().filter(m => m.isAdd);
    assert.equal(adds.length, 2, 'first cast should spawn two adds');

    CombatEngine._tryStartSummonCast(summoner.instanceId);
    TimeEngine.update(200);
    adds = CombatEngine.getLivingMembers().filter(m => m.isAdd);
    assert.equal(adds.length, 2, 'maxAdds should prevent additional active summons');
    assert.equal(addedCap.payloads.length, 2, 'expected exactly two member-added events');
  } finally {
    addedCap.unsub();
  }
}

function testInterruptStopsSummon() {
  const interruptedCap = captureEvent(EVENTS.COMBAT_INTERRUPTED);
  const addedCap = captureEvent(EVENTS.COMBAT_MEMBER_ADDED);
  try {
    const summoner = mkMember(0, {
      id: 'interrupt_target',
      summon: {
        enemyId: 'a3_shade_remnant',
        count: 1,
        castTime: 400,
        maxAdds: 2,
        cooldownMs: 1000,
      },
    });
    startEncounter([summoner]);
    CombatEngine.setTarget(summoner.instanceId);

    CombatEngine._tryStartSummonCast(summoner.instanceId);
    const interrupted = CombatEngine.interruptTarget();
    assert.equal(interrupted, true, 'interruptTarget should return true during cast');
    assert.equal(interruptedCap.payloads.length, 1, 'expected COMBAT_INTERRUPTED event');
    assertHasKeys(
      interruptedCap.payloads[0],
      ['encounterId', 'instanceId', 'slot', 'enemyId', 'source'],
      'COMBAT_INTERRUPTED',
    );

    TimeEngine.update(450);
    const adds = CombatEngine.getLivingMembers().filter(m => m.isAdd);
    assert.equal(adds.length, 0, 'interrupt should prevent add spawn');
    assert.equal(addedCap.payloads.length, 0, 'no member should be added after interrupt');
  } finally {
    interruptedCap.unsub();
    addedCap.unsub();
  }
}

function testCorruptionClampAndCleanse() {
  const changedCap = captureEvent(EVENTS.CORRUPTION_CHANGED);
  const cleansedCap = captureEvent(EVENTS.CORRUPTION_CLEANSED);
  try {
    const member = mkMember(0, { id: 'corruption_source' });
    startEncounter([member]);

    const baseDamage = getBaseDamage();
    const baseRegen = getHpRegen().toNumber();

    CombatEngine._setCorruptionStacks(999, 'test_clamp');
    const enc = CombatEngine.getEncounter();
    const maxStacks = COMBAT_V2.corruption.maxStacks;
    assert.equal(enc.corruptionStacks, maxStacks, 'corruption stacks should clamp to max');

    const expectedAtkMult = Math.max(0.5, 1 - maxStacks * COMBAT_V2.corruption.perStackAtkReduction);
    const expectedRegenMult = Math.max(0.2, 1 - maxStacks * COMBAT_V2.corruption.perStackRegenReduction);
    const debuffedDamage = getBaseDamage();
    const debuffedRegen = getHpRegen().toNumber();
    assert.ok(Math.abs(debuffedDamage - (baseDamage * expectedAtkMult)) < 1e-9, 'attack multiplier mismatch');
    assert.ok(Math.abs(debuffedRegen - (baseRegen * expectedRegenMult)) < 1e-9, 'regen multiplier mismatch');

    const cleaned = CombatEngine.cleanseCorruption();
    assert.equal(cleaned, true, 'cleanseCorruption should return true with active stacks');
    assert.equal(enc.corruptionStacks, 0, 'corruption stacks should reset to zero on cleanse');
    assert.ok(Math.abs(getBaseDamage() - baseDamage) < 1e-9, 'base damage should restore after cleanse');
    assert.ok(Math.abs(getHpRegen().toNumber() - baseRegen) < 1e-9, 'regen should restore after cleanse');

    assert.ok(changedCap.payloads.length >= 1, 'expected at least one CORRUPTION_CHANGED');
    assertHasKeys(changedCap.payloads[0], ['encounterId', 'stacks', 'maxStacks', 'reason'], 'CORRUPTION_CHANGED');
    assert.equal(cleansedCap.payloads.length, 1, 'expected one CORRUPTION_CLEANSED');
    assertHasKeys(cleansedCap.payloads[0], ['encounterId', 'removedStacks', 'reason'], 'CORRUPTION_CLEANSED');
  } finally {
    changedCap.unsub();
    cleansedCap.unsub();
  }
}

function main() {
  const tests = [
    ['player miss event payload', testPlayerMissEvent],
    ['armor break expiry + restore event', testArmorBreakExpiry],
    ['summon slot cap + member added event', testSummonSlotCap],
    ['summon maxAdds cap', testSummonMaxAddsCap],
    ['interrupt cancels summon cast', testInterruptStopsSummon],
    ['corruption clamp + cleanse + stat restore', testCorruptionClampAndCleanse],
  ];

  for (const [name, fn] of tests) {
    runTest(name, fn);
  }

  console.log('\nALL PHASE-7 COMBAT CHECKS PASSED');
}

try {
  main();
  process.exit(0);
} catch (err) {
  console.error(`\nCOMBAT CHECK FAILED: ${err?.message || err}`);
  process.exit(1);
}
