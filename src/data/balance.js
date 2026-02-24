// Per-entity stat multipliers applied on top of zone scaling.
// Sparse map format: { entityId: { stat: multiplier } }
// Missing entity/stat defaults to 1.0.

export const ENEMY_BALANCE = {};
export const BOSS_BALANCE = {};

export function getEnemyBias(enemyId, stat) {
  return ENEMY_BALANCE[enemyId]?.[stat] ?? 1.0;
}

export function getBossBias(bossId, stat) {
  return BOSS_BALANCE[bossId]?.[stat] ?? 1.0;
}
