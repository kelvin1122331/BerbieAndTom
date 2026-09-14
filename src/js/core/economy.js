/**
 * Level, XP, dan koin (murni).
 * Kurva XP dibuat landai di awal supaya pemain cepat merasakan progres.
 */

export const BASE_XP = 120;
export const XP_STEP = 80;
export const MAX_LEVEL = 50;

/** XP yang dibutuhkan untuk naik dari `level` ke `level+1`. */
export function xpToNext(level) {
  const l = Math.max(1, Math.floor(level));
  return Math.round(BASE_XP + (l - 1) * XP_STEP + Math.pow(l, 1.6) * 4);
}

/** Konversi total XP → { level, into, needed, progress }. */
export function levelFromXp(totalXp) {
  let xp = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  let need = xpToNext(level);
  while (xp >= need && level < MAX_LEVEL) {
    xp -= need;
    level += 1;
    need = xpToNext(level);
  }
  return { level, into: xp, needed: need, progress: Math.min(1, xp / need), maxed: level >= MAX_LEVEL };
}

/** Tambah XP, kembalikan status baru + informasi kenaikan level. */
export function addXp(totalXp, amount) {
  const before = levelFromXp(totalXp);
  const raw = Math.max(0, Math.round(amount));
  const total = Math.max(0, Math.floor(Number(totalXp) || 0)) + raw;
  const after = levelFromXp(total);
  return {
    xp: total,
    gained: raw,
    level: after.level,
    leveledUp: after.level > before.level,
    fromLevel: before.level,
    toLevel: after.level,
  };
}

/** Bonus koin tiap naik level. */
export function levelUpReward(level) {
  return 20 + level * 10;
}

export function clampCoins(coins) {
  return Math.max(0, Math.min(999999, Math.round(Number(coins) || 0)));
}
