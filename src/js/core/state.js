/**
 * Bentuk state permainan + validasi data simpanan (murni, tanpa DOM).
 * Semua angka yang datang dari localStorage/dialog pengguna melewati `sanitizeState`
 * supaya save lama atau rusak tidak pernah membuat game error.
 */

import { defaultStats, clamp, STAT_IDS } from './stats.js';
import { createClock, normalizeMinutes, phaseOf, speedById, WAKE_AT, NIGHT_AT } from './time.js';
import { buildDailyMissions } from './missions.js';
import { levelFromXp, clampCoins } from './economy.js';

export const SAVE_VERSION = 3;

export const CHARACTERS = ['panda', 'barbie'];
export const MODES = ['idle', 'eating', 'bathing', 'playing', 'sleeping', 'winding'];
export const THEMES = ['pink', 'noir'];

export function num(value, fallback, lo, hi) {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const v = lo == null ? n : clamp(n, lo, hi);
  return Number.isFinite(v) ? v : fallback;
}

export function createState({ character = 'panda', name = null, speed = 'normal' } = {}) {
  const char = CHARACTERS.includes(character) ? character : 'panda';
  const clock = createClock({ minutes: WAKE_AT, speed: speedById(speed).mul });
  return {
    v: SAVE_VERSION,
    character: char,
    name: name ?? defaultName(char),
    day: 1,
    clock,
    stats: defaultStats(),
    mode: 'idle',
    sleep: { phase: 'none', elapsed: 0, total: 30 },
    dressing: { outfit: 'default', accessory: null, theme: 'pink' },
    unlocked: { items: [], missionsPerfect: 0 },
    coins: 60,
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    missions: buildDailyMissions(1, char, 1),
    dailyReport: null,
    counts: {
      makan: 0,
      minum: 0,
      mandi: 0,
      main: 0,
      gaya: 0,
      belanja: 0,
      playsToday: 0,
      bestGame: 0,
      totalDays: 0,
      totalCoins: 60,
      perfectDays: 0,
    },
    settings: { sound: true, motion: 'full', showRealClock: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function defaultName(character) {
  return character === 'panda' ? 'Tom' : 'Berbie';
}

export function cleanName(input) {
  const raw = String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/["'<>`\\;&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = raw.slice(0, 14).trim();
  return cut.length ? cut : null;
}

/** Bersihkan data apa pun menjadi state yang sah. Return null jika benar-benar tidak bisa dipakai. */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Number(raw.v) !== SAVE_VERSION) return null;
  if (!CHARACTERS.includes(raw.character)) return null;

  const stats = {};
  for (const id of STAT_IDS) stats[id] = clamp(num(raw.stats?.[id], defaultStats()[id], 0, 100));

  const speedId = speedById(raw.clock?.speed != null ? mulToId(raw.clock.speed) : 'normal').id;
  const mins = normalizeMinutes(num(raw.clock?.minutes, WAKE_AT, 0, 1439.99));
  const night = Boolean(raw.clock?.night);
  const safeMinutes = mins >= WAKE_AT && mins < NIGHT_AT ? mins : night ? NIGHT_AT : WAKE_AT;
  const clock = {
    ...createClock({ minutes: safeMinutes, speed: speedById(speedId).mul, paused: night, night }),
    speedId,
    phase: phaseOf(safeMinutes),
  };

  const level = Math.max(1, Math.round(num(raw.level, 1, 1, 999)));
  const xp = Math.max(0, Math.round(num(raw.xp, 0, 0, 1e7)));
  const levelInfo = levelFromXp(xp);

  const day = Math.max(1, Math.round(num(raw.day, 1, 1, 99999)));
  const missions = Array.isArray(raw.missions) && raw.missions.length
    ? raw.missions
        .filter((m) => m && typeof m.id === 'string' && typeof m.action === 'string')
        .map((m) => ({
          id: m.id,
          action: String(m.action),
          icon: typeof m.icon === 'string' ? m.icon.slice(0, 4) : '⭐',
          label: String(m.label ?? m.id).slice(0, 60),
          desc: String(m.desc ?? '').slice(0, 160),
          target: Math.max(1, Math.round(num(m.target, 1, 1, 99))),
          progress: Math.max(0, num(m.progress, 0, 0, 99)),
          done: Boolean(m.done),
          reward: {
            coins: Math.round(num(m.reward?.coins, 8, 0, 9999)),
            xp: Math.round(num(m.reward?.xp, 10, 0, 9999)),
          },
        }))
        .slice(0, 8)
    : buildDailyMissions(day, String(raw.character), level);

  const unlockedItems = Array.isArray(raw.unlocked?.items)
    ? [...new Set(raw.unlocked.items.filter((id) => typeof id === 'string' && /^[a-z0-9:-]{2,40}$/.test(id)))]
    : [];

  const counts = {};
  for (const [key, value] of Object.entries(createState({ character: raw.character }).counts)) {
    counts[key] = Math.max(0, Math.round(num(raw.counts?.[key], value, 0, 1e7)));
  }

  const report =
    raw.dailyReport && typeof raw.dailyReport === 'object'
      ? {
          day: Math.round(num(raw.dailyReport.day, day, 1, 99999)),
          score: Math.round(num(raw.dailyReport.score, 0, 0, 100)),
          stars: Math.round(num(raw.dailyReport.stars, 1, 1, 5)),
          coins: Math.round(num(raw.dailyReport.coins, 0, 0, 9999)),
        }
      : null;

  return {
    v: SAVE_VERSION,
    character: raw.character,
    name: cleanName(raw.name) ?? defaultName(raw.character),
    day,
    clock,
    stats,
    mode: MODES.includes(raw.mode) && raw.mode !== 'sleeping' && raw.mode !== 'winding' ? raw.mode : 'idle',
    dressing: {
      outfit: typeof raw.dressing?.outfit === 'string' ? raw.dressing.outfit.slice(0, 24) : 'default',
      accessory:
        typeof raw.dressing?.accessory === 'string' ? raw.dressing.accessory.slice(0, 24) : null,
      theme: THEMES.includes(raw.dressing?.theme) ? raw.dressing.theme : 'pink',
    },
    unlocked: {
      items: unlockedItems,
      missionsPerfect: Math.max(0, Math.round(num(raw.unlocked?.missionsPerfect, 0, 0, 1e6))),
    },
    coins: clampCoins(raw.coins),
    xp,
    level: Math.max(level, levelInfo.level),
    streak: Math.max(0, Math.round(num(raw.streak, 0, 0, 9999))),
    bestStreak: Math.max(0, Math.round(num(raw.bestStreak, 0, 0, 9999))),
    missions,
    dailyReport: report,
    sleep: sanitizeSleep(raw.sleep),
    counts,
    settings: {
      sound: raw.settings?.sound === undefined ? true : Boolean(raw.settings.sound),
      motion: raw.settings?.motion === 'reduced' ? 'reduced' : 'full',
      showRealClock: Boolean(raw.settings?.showRealClock),
    },
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mulToId(mul) {
  const found = ['lambat', 'normal', 'cepat', 'turbo'].find((id) => speedById(id).mul === Number(mul));
  return found ?? 'normal';
}

function sanitizeSleep(raw) {
  const total = Math.max(5, Math.round(num(raw?.total, 30, 5, 120)));
  return {
    phase: ['none', 'wind', 'sleep'].includes(raw?.phase) ? raw.phase : 'none',
    elapsed: Math.max(0, num(raw?.elapsed, 0, 0, 600)),
    total,
  };
}

/** Statistik bersih untuk tampilan (pembulatan). */
export function displayStats(stats) {
  return Object.fromEntries(STAT_IDS.map((id) => [id, Math.round(num(stats[id], 0, 0, 100))]));
}
