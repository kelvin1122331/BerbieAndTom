/** Unit test logika inti (jam, status, misi, ekonomi, save) — `npm test`. */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advanceClock,
  createClock,
  phaseOf,
  formatTime,
  formatDuration,
  dayArc,
  isNight,
  sleepProgress,
  minutesUntilNight,
  gameMinutesToRealSeconds,
  WAKE_AT,
  NIGHT_AT,
  SLEEP_SECONDS,
  speedById,
} from '../../src/js/core/time.js';
import { defaultStats, decayStats, moodOf, careScore, starsFor, morningReward, applyDeltas, STAT_IDS } from '../../src/js/core/stats.js';
import { buildDailyMissions, recordAction, evaluateMissions, missionsSummary } from '../../src/js/core/missions.js';
import { levelFromXp, addXp, xpToNext, levelUpReward } from '../../src/js/core/economy.js';
import { createState, sanitizeState, cleanName } from '../../src/js/core/state.js';
import { saveState, loadFor, saveKey, clearFor, summaries, parseMeta } from '../../src/js/core/persistence.js';
import { availableFoods, foodById, foodEffects, canConsume, foodKey } from '../../src/js/data/foods.js';
import { OUTFITS, ACCESSORIES, THEMES, outfitKey, accessoryKey, themeKey, outfitsFor, accessoriesFor } from '../../src/js/data/cosmetics.js';
import { CHARACTER_LIST, getCharacter, randomLine, DIALOGUE } from '../../src/js/data/characters.js';

/* --------------------------------------------------------------- jam/fase */

test('fase hari sesuai jam', () => {
  assert.equal(phaseOf(WAKE_AT), 'pagi');
  assert.equal(phaseOf(10 * 60 + 59), 'pagi');
  assert.equal(phaseOf(11 * 60), 'siang');
  assert.equal(phaseOf(14 * 60 + 59), 'siang');
  assert.equal(phaseOf(15 * 60), 'sore');
  assert.equal(phaseOf(NIGHT_AT), 'malam');
  assert.equal(phaseOf(4 * 60), 'malam');
  assert.equal(phaseOf(23 * 60 + 30), 'malam');
  assert.equal(phaseOf(NaN), 'pagi');
});

test('format jam & durasi', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(675), '11:15');
  assert.equal(formatTime(1439.9), '23:59');
  assert.equal(formatTime(-10), '23:50');
  assert.equal(formatDuration(130), '2 j 10 mnt');
  assert.equal(formatDuration(45), '45 mnt');
});

test('jam berjalan realtime sesuai kecepatan', () => {
  const clock = createClock({ minutes: WAKE_AT });
  // 1 detik nyata = 4 menit game (kecepatan normal)
  const a = advanceClock(clock, 1);
  assert.ok(Math.abs(a.clock.minutes - (WAKE_AT + 4)) < 0.001);
  // kecepatan 2x
  const fast = advanceClock({ ...clock, speed: 2 }, 1);
  assert.ok(Math.abs(fast.clock.minutes - (WAKE_AT + 8)) < 0.001);
  // 1 hari aktif (05:00 → 18:00) ± 195 detik nyata
  assert.equal(Math.round(gameMinutesToRealSeconds(NIGHT_AT - WAKE_AT, 1)), 195);
  assert.equal(Math.round(gameMinutesToRealSeconds(NIGHT_AT - WAKE_AT, 4)), 49);
});

test('jam berhenti saat dijeda atau saat malam', () => {
  const paused = advanceClock({ ...createClock(), paused: true }, 5);
  assert.equal(paused.clock.minutes, WAKE_AT);
  assert.deepEqual(paused.events, []);
  const night = advanceClock({ ...createClock(), night: true }, 5);
  assert.equal(night.clock.minutes, WAKE_AT);
});

test('malam tiba tepat 18:00 dan ter-clamp', () => {
  const clock = createClock({ minutes: NIGHT_AT - 2 });
  const next = advanceClock(clock, 5);
  assert.equal(next.clock.minutes, NIGHT_AT);
  assert.equal(next.clock.night, true);
  assert.deepEqual(next.events, ['nightfall', 'phase:malam']);
});

test('perubahan fase memunculkan event', () => {
  const clock = createClock({ minutes: 11 * 60 - 1 });
  const next = advanceClock(clock, 1);
  assert.equal(next.phase, 'siang');
  assert.equal(next.phaseChanged, true);
  assert.ok(next.events.includes('phase:siang'));
});

test('isNight & sisa waktu', () => {
  assert.equal(isNight(NIGHT_AT), true);
  assert.equal(isNight(12 * 60), false);
  assert.equal(minutesUntilNight(17 * 60), 60);
  assert.equal(minutesUntilNight(NIGHT_AT + 30), 0);
});

test('dayArc 0..1 sepanjang hari aktif', () => {
  assert.equal(dayArc(WAKE_AT), 0);
  assert.equal(dayArc((WAKE_AT + NIGHT_AT) / 2), 0.5);
  assert.equal(dayArc(NIGHT_AT), 1);
  assert.equal(dayArc(2 * 60), 0); // sebelum pagi tidak negatif
});

test('tidur 30 detik lalu selesai', () => {
  assert.equal(SLEEP_SECONDS, 30);
  assert.equal(sleepProgress(0).done, false);
  assert.equal(sleepProgress(15).t, 0.5);
  assert.equal(sleepProgress(29).remaining, 1);
  assert.equal(sleepProgress(99).done, true);
});

test('id kecepatan', () => {
  assert.equal(speedById('turbo').mul, 4);
  assert.equal(speedById('tidak-ada').mul, 1);
});

/* ------------------------------------------------------------------ status */

test('defaultStats & clamp', () => {
  const stats = defaultStats({ kenyang: 240, bersih: -20, tidakJelas: 50 });
  assert.equal(stats.kenyang, 100);
  assert.equal(stats.bersih, 0);
  assert.equal(stats.tidakJelas, undefined);
  for (const id of STAT_IDS) assert.ok(stats[id] >= 0 && stats[id] <= 100);
});

test('status meluruh seiring menit, tidak pernah di luar 0..100', () => {
  const stats = defaultStats();
  const oneDay = decayStats(stats, 780);
  assert.ok(oneDay.stats.kenyang < stats.kenyang);
  assert.ok(oneDay.stats.bersih < stats.bersih);
  for (const id of STAT_IDS) {
    assert.ok(oneDay.stats[id] >= 0 && oneDay.stats[id] <= 100, `${id} di luar rentang`);
  }
  const zero = decayStats({ kenyang: 0, bersih: 0, bahagia: 0, energi: 0, sehat: 0 }, 120);
  assert.deepEqual(
    Object.fromEntries(STAT_IDS.map((id) => [id, zero.stats[id]])),
    { kenyang: 0, bersih: 0, bahagia: 0, energi: 0, sehat: 0 }
  );
});

test('kesehatan turun saat kelaparan & kotor, naik saat terawat', () => {
  const starving = decayStats({ kenyang: 10, bersih: 10, bahagia: 40, energi: 60, sehat: 80 }, 60);
  assert.ok(starving.stats.sehat < 80);
  const healthy = decayStats({ kenyang: 90, bersih: 90, bahagia: 90, energi: 90, sehat: 60 }, 60);
  assert.ok(healthy.stats.sehat > 60);
});

test('alert muncul saat menembus ambang', () => {
  const alerts = decayStats({ kenyang: 36, bersih: 90, bahagia: 90, energi: 90, sehat: 90 }, 30).alerts;
  assert.ok(alerts.some((a) => a.id === 'kenyang'));
});

test('mood mengikuti prioritas kebutuhan', () => {
  assert.equal(moodOf({ kenyang: 50, bersih: 50, bahagia: 50, energi: 50, sehat: 50 }, { sleeping: true }).id, 'tidur');
  assert.equal(moodOf({ kenyang: 50, bersih: 50, bahagia: 50, energi: 50, sehat: 10 }).id, 'sakit');
  assert.equal(moodOf({ kenyang: 5, bersih: 50, bahagia: 50, energi: 50, sehat: 90 }).id, 'lapar');
  assert.equal(moodOf({ kenyang: 90, bersih: 90, bahagia: 90, energi: 90, sehat: 95 }).id, 'senang');
});

test('careScore & bintang konsisten', () => {
  assert.equal(careScore(defaultStats({ kenyang: 100, bersih: 100, bahagia: 100, energi: 100, sehat: 100 })), 100);
  assert.equal(starsFor(100), 5);
  assert.equal(starsFor(91), 4);
  assert.equal(starsFor(10), 1);
  assert.ok(morningReward(5).coins > morningReward(1).coins);
  assert.ok(morningReward(3).xp > 0);
});

test('applyDeltas menolak key asing', () => {
  const next = applyDeltas(defaultStats({ kenyang: 50 }), { kenyang: 10, hantu: 90 });
  assert.equal(next.kenyang, 60);
  assert.equal(next.hantu, undefined);
});

/* -------------------------------------------------------------------- misi */

test('misi harian deterministik, berisi tidur, tanpa duplikat', () => {
  const a = buildDailyMissions(3, 'panda', 1);
  const b = buildDailyMissions(3, 'panda', 1);
  assert.deepEqual(a.map((m) => m.id), b.map((m) => m.id));
  assert.equal(a.length, 4);
  assert.ok(a.some((m) => m.id === 'tidur'));
  assert.equal(new Set(a.map((m) => m.id)).size, a.length);
  for (const m of a) assert.ok(m.target >= 1 && m.reward.coins > 0);
});

test('progres misi naik per aksi dan hadiah hanya sekali', () => {
  const missions = buildDailyMissions(1, 'barbie', 1);
  const makan = missions.find((m) => m.id === 'makan');
  assert.ok(makan, 'misi makan harus ada di hari 1');
  assert.equal(makan.target, 2);
  let step = recordAction(missions, 'makan', 1);
  assert.equal(step.missions.find((m) => m.id === 'makan').progress, 1);
  assert.equal(step.completed.length, 0);
  step = recordAction(step.missions, 'makan', 1);
  assert.equal(step.completed.length, 1);
  assert.equal(step.missions.find((m) => m.id === 'makan').done, true);
  step = recordAction(step.missions, 'makan', 5);
  assert.equal(step.completed.length, 0, 'tidak memberi hadiah ganda');
  assert.equal(step.missions.find((m) => m.id === 'makan').progress, 2);
  assert.equal(recordAction(missions, 'tidak-ada').missions.length, missions.length);
});

test('misi "rawat" lulus bila Sehat tinggi saat pagi', () => {
  const missions = [{ id: 'rawat', action: 'rawat', target: 1, progress: 0, done: false, reward: { coins: 1, xp: 1 } }];
  assert.equal(evaluateMissions(missions, { sehat: 90 }).completed.length, 1);
  assert.equal(evaluateMissions(missions, { sehat: 50 }).completed.length, 0);
});

test('ringkasan misi', () => {
  const done = missionsSummary([{ done: true }, { done: false }]);
  assert.deepEqual({ done: done.done, total: done.total, allDone: done.allDone }, { done: 1, total: 2, allDone: false });
  assert.equal(missionsSummary([{ done: true }]).allDone, true);
});

/* ---------------------------------------------------------- level & koin */

test('kurva XP naik terus', () => {
  assert.ok(xpToNext(5) > xpToNext(1));
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(-99).level, 1);
  const info = levelFromXp(xpToNext(1));
  assert.equal(info.level, 2);
  assert.equal(info.into, 0);
});

test('addXp menandai naik level', () => {
  const res = addXp(0, xpToNext(1) + 5);
  assert.equal(res.leveledUp, true);
  assert.equal(res.toLevel, 2);
  assert.equal(levelFromXp(res.xp).into, 5);
  assert.equal(addXp(100, 0).leveledUp, false);
  assert.ok(levelUpReward(3) > levelUpReward(1));
});

/* ------------------------------------------------------------------- state */

test('createState valid untuk karakter apa pun', () => {
  for (const id of ['panda', 'barbie']) {
    const s = createState({ character: id });
    assert.equal(s.character, id);
    assert.equal(s.name, getCharacter(id).defaultName);
    assert.equal(s.day, 1);
    assert.equal(s.clock.minutes, WAKE_AT);
    assert.equal(s.missions.length, 4);
    assert.equal(s.coins, 60);
  }
});

test('createState menolak karakter tak dikenal', () => {
  assert.equal(createState({ character: 'naga' }).character, 'panda');
});

test('sanitizeState memperbaiki data rusak', () => {
  const broken = {
    v: 999,
    character: 'panda',
  };
  assert.equal(sanitizeState(broken), null);
  assert.equal(sanitizeState(null), null);
  assert.equal(sanitizeState({}), null);

  const messy = sanitizeState({
    v: 3,
    character: 'barbie',
    name: '<b>Be$$ie</b> yang sangat panjang sekali',
    coins: '150.7',
    level: -4,
    day: '7',
    stats: { kenyang: 2000, bersih: 'x', bahagia: null, energi: 42, sehat: 0.5 },
    clock: { minutes: 5000, speed: 4 },
    unlocked: { items: ['food:kue-stroberi', 42, 'x', 'fit:hoodie-pink'] },
    dressing: { outfit: 'gaun-pink', accessory: 'tas-mini' },
    mode: 'sleeping',
    settings: { sound: false, motion: 'reduced', showRealClock: true },
    missions: [{ id: 'tidur', action: 'tidur', target: 1, progress: 1, done: true }],
    counts: { makan: 12 },
  });
  assert.equal(messy.character, 'barbie');
  assert.ok(!messy.name.includes('<'));
  assert.equal(messy.coins, 151); // dibulatkan
  assert.equal(messy.level, 1);
  assert.equal(messy.day, 7);
  assert.equal(messy.stats.kenyang, 100);
  assert.equal(messy.stats.bersih, 82); // fallback default
  assert.equal(messy.stats.energi, 42);
  assert.equal(messy.clock.speed, 4);
  assert.ok(messy.clock.minutes >= 0 && messy.clock.minutes < 1440);
  assert.deepEqual(messy.unlocked.items, ['food:kue-stroberi', 'fit:hoodie-pink']);
  assert.equal(messy.mode, 'idle'); // mode tidur tidak dipulihkan
  assert.equal(messy.settings.motion, 'reduced');
  assert.equal(messy.missions.length, 1);
  assert.equal(messy.counts.makan, 12);
  assert.equal(messy.counts.mandi, 0);

  assert.equal(messy.counts.playsToday, 0);
  assert.equal(messy.counts.bestGame, 0);
});

test('sanitizeState mempertahankan mode aktif selain tidur', () => {
  const ok = sanitizeState({ v: 3, character: 'panda', mode: 'bathing' });
  assert.equal(ok.mode, 'bathing');
});

test('cleanName membatasi panjang & karakter berbahaya', () => {
  assert.equal(cleanName('   Bali   '), 'Bali');
  assert.equal(cleanName('x'.repeat(40)).length, 14);
  assert.equal(cleanName('   '), null);
  assert.equal(cleanName(undefined), null);
  assert.ok(!/["'<>]/.test(cleanName('<img src=x onerror=1>')));
});

/* --------------------------------------------------------------- storage */

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

test('save/load per karakter, tanpa saling menimpa', () => {
  const storage = memoryStorage();
  const panda = createState({ character: 'panda' });
  const barbie = createState({ character: 'barbie', name: 'Beb' });
  barbie.coins = 300;

  assert.equal(saveState(storage, panda), true);
  assert.equal(saveState(storage, barbie), true);
  const loaded = loadFor(storage, 'barbie');
  assert.equal(loaded.coins, 300);
  assert.equal(loaded.name, 'Beb');
  assert.equal(loadFor(storage, 'panda').character, 'panda');
  assert.equal(summaries(storage).panda.day, 1);
  assert.equal(summaries(storage).barbie.level, 1);
  clearFor(storage, 'barbie');
  assert.equal(loadFor(storage, 'barbie'), null);
  assert.notEqual(loadFor(storage, 'panda'), null);
});

test('save rusak/tidak lengkap tidak membuat error', () => {
  const storage = memoryStorage();
  storage.setItem(saveKey('panda'), '{bukan json');
  assert.equal(loadFor(storage, 'panda'), null);
  storage.setItem(saveKey('panda'), JSON.stringify({ v: 1 }));
  assert.equal(loadFor(storage, 'panda'), null);
  assert.equal(parseMeta('nope'), null);
  assert.equal(parseMeta(JSON.stringify({ character: 'barbie' })), null, 'tanpa versi = tidak dipakai');
  assert.equal(parseMeta(JSON.stringify({ v: 3, character: 'naga' })), null);
  assert.equal(parseMeta(JSON.stringify({ v: 3, character: 'barbie', name: 'Be', day: 4 })).name, 'Be');
  assert.equal(summaries(storage).panda, null);
});

test('storage yang error tidak menjatuhkan game', () => {
  const boom = {
    getItem() {
      throw new Error('diblokir');
    },
    setItem() {
      throw new Error('penuh');
    },
    removeItem() {
      throw new Error('diblokir');
    },
  };
  assert.equal(loadFor(boom, 'panda'), null);
  assert.equal(saveState(boom, createState({ character: 'panda' })), false);
  assert.equal(clearFor(boom, 'panda'), false);
});

/* ------------------------------------------------------------ data konsistensi */

test('setiap makanan punya efek valid & id unik', () => {
  const ids = new Set();
  for (const food of availableFoods('panda', ['food:bambu-emas'])) {
    assert.ok(!ids.has(food.id), `duplikat id ${food.id}`);
    ids.add(food.id);
    assert.ok(food.name.length > 2);
    assert.ok(food.emoji);
    assert.ok(['makan', 'minum', 'obat'].includes(food.kind));
    for (const [key, value] of Object.entries(food.effects)) {
      assert.ok(STAT_IDS.includes(key), `efek asing ${key}`);
      assert.ok(Number.isFinite(value));
    }
    if (!food.pantry) assert.ok(food.price > 0);
  }
});

test('favorit/dislike merujuk makanan yang ada', () => {
  for (const char of CHARACTER_LIST) {
    for (const id of [...char.favorits, ...char.dislikes]) assert.ok(foodById(id), `${char.id}: ${id} tidak ada`);
      for (const key of ['pagi', 'siang', 'sore', 'malam', 'makan', 'minum', 'mandi', 'main', 'tidur', 'bangun', 'beli', 'tolak', 'senang', 'sedih', 'lapar', 'kotor', 'sakit', 'ngantuk', 'bosan']) {
      assert.ok(Array.isArray(DIALOGUE[char.id][key]), `${char.id} dialog ${key}`);
      assert.ok(DIALOGUE[char.id][key].length > 0);
    }
    assert.ok(randomLine(char.id, 'pagi') !== '...');
    assert.equal(randomLine(char.id, 'tidak-ada', 'cadangan'), 'cadangan');
  }
});

test('busana & aksesori cocok dengan karakter + key toko', () => {
  for (const id of ['panda', 'barbie']) {
    assert.ok(outfitsFor(id).some((o) => o.price === 0), `karakter ${id} tanpa busana default`);
    assert.equal(new Set(outfitsFor(id).map((o) => o.id)).size, outfitsFor(id).length);
    assert.equal(new Set(accessoriesFor(id).map((a) => a.id)).size, accessoriesFor(id).length);
    for (const o of outfitsFor(id)) assert.equal(outfitKey(o.id), `fit:${o.id}`);
    for (const a of accessoriesFor(id)) assert.ok(accessoryKey(a.id).startsWith('acc:'));
  }
  assert.ok(THEMES[0].price === 0);
  assert.equal(themeKey('noir'), 'theme:noir');
  for (const item of [...OUTFITS, ...ACCESSORIES]) assert.ok(item.swatch.startsWith('#'));
});

test('makanan hanya ditolak saat terlalu kenyang', () => {
  const food = foodById('nasi-lauk');
  assert.equal(canConsume(food, { kenyang: 99 }).ok, false);
  assert.equal(canConsume(food, { kenyang: 50 }).ok, true);
  assert.equal(canConsume(foodById('vitamin-pink'), { kenyang: 99 }).ok, true);
  assert.equal(canConsume(foodById('air-putih'), { kenyang: 99 }).ok, true);
});

test('preferensi karakter mengubah efek makanan', () => {
  const panda = getCharacter('panda');
  const barbie = getCharacter('barbie');
  const favoritPanda = foodEffects(foodById('bambu-emas'), panda);
  const favoritBarbie = foodEffects(foodById('bambu-emas'), barbie);
  assert.equal(favoritPanda.tag, 'favorit-panda');
  assert.equal(favoritBarbie.tag, 'hindari-barbie');
  assert.ok(favoritPanda.effects.bahagia > favoritBarbie.effects.bahagia);
  assert.equal(foodEffects(foodById('nasi-lauk'), panda).tag, null);
  assert.equal(foodKey('kue-stroberi'), 'food:kue-stroberi');
});
