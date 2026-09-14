/**
 * Mesin permainan: jam realtime, peluruhan status, aksi perawatan, misi harian,
 * ekonomi (koin/XP/level), tidur wajib 30 detik, dan penyimpanan otomatis.
 *
 * Aturan desain:
 * - state hanya diubah lewat `mutate` (biar render + autosave konsisten);
 * - loop rAF memakai `store.update` langsung supaya tidak menumpuk timer simpan;
 * - semua sistem UI (bath/minigame/panels/sleep) berkomunikasi lewat `api`.
 */

import { createStore } from './core/store.js';
import { cleanName, MODES } from './core/state.js';
import { saveState, safeStorage, clearFor } from './core/persistence.js';
import {
  advanceClock,
  createClock,
  phaseOf,
  phaseMeta,
  speedById,
  speedByMul,
  WAKE_AT,
  NIGHT_AT,
  SLEEP_SECONDS,
  WIND_DOWN_SECONDS,
  formatTime,
  formatDuration,
  minutesUntilNight,
  dayArc,
} from './core/time.js';
import { decayStats, moodOf, careScore, starsFor, morningReward, applyDeltas, STAT_IDS, statMeta } from './core/stats.js';
import { recordAction, buildDailyMissions, evaluateMissions, missionsSummary } from './core/missions.js';
import { addXp, levelUpReward } from './core/economy.js';
import { getCharacter, randomLine, PHASE_TO_DIALOGUE, MOOD_TO_DIALOGUE } from './data/characters.js';
import { foodById, foodEffects, canConsume, foodKey, xpForFood } from './data/foods.js';
import { outfitById, accessoryById, outfitKey, accessoryKey, themeKey, OUTFITS, ACCESSORIES } from './data/cosmetics.js';
import { createAudio } from './ui/audio.js';
import { createToast } from './ui/toast.js';
import { createFx } from './ui/fx.js';
import { createModal } from './ui/modal.js';
import { createScene } from './render/scene.js';
import { createActor } from './render/actor.js';
import { createHud } from './render/hud.js';
import { createPanels } from './ui/panels.js';
import { createBath } from './systems/bath.js';
import { createMinigame } from './systems/minigame.js';
import { createSleep } from './systems/sleep.js';
import { raf, $ } from './ui/dom.js';

const RENDER_INTERVAL = 130; // ms: render penuh tidak perlu 60 fps
const AUTOSAVE_INTERVAL = 9000; // ms
const CHAT_INTERVAL = 26000; // ms: karakter mengobrol sendiri

export function createGame({ initial, hooks = {} }) {
  const storage = hooks.storage ?? safeStorage();
  const store = createStore(initial);
  const audio = createAudio({ enabled: initial.settings?.sound !== false });
  const toast = createToast($('#toast-root'));
  const modal = createModal($('#modal-root'));
  const scene = createScene(document);
  const actor = createActor({ root: document });
  const fx = createFx($('#fx-layer'), scene.stage);
  const hud = createHud({ root: document });
  const batch = raf();

  const runtime = {
    running: false,
    lastFrame: 0,
    lastRender: 0,
    deltas: {},
    deltaTimer: 0,
    dirtySave: false,
    saveTimer: 0,
    autosaveTimer: 0,
    sparkleUntil: 0,
    wetUntil: 0,
    heartsUntil: 0,
    lastChatAt: Date.now(),
    lastPetAt: 0,
    sleepBase: null,
    dayScore: null,
    eatTimer: 0,
    modeTimer: 0,
    wakeTimer: 0,
  };

  const pendingAlerts = [];

  const MOOD_EMOJI = {
    senang: '😄',
    biasa: '🙂',
    gelisah: '😕',
    sedih: '😟',
    lapar: '🍽️',
    kotor: '🧼',
    sakit: '🤒',
    ngantuk: '😪',
    tidur: '😴',
  };

  /* ---------------------------------------------------------------- utils */

  const state = () => store.state;
  const character = () => getCharacter(state().character);
  const characterName = () => state().name;

  function mutate(mutator, ...keys) {
    store.update(mutator, ...keys);
    runtime.dirtySave = true;
    scheduleRender();
    scheduleSave();
  }

  function scheduleRender() {
    batch.once(() => render(true));
  }

  function scheduleSave() {
    clearTimeout(runtime.saveTimer);
    runtime.saveTimer = setTimeout(saveNow, 1500);
  }

  function saveNow() {
    runtime.dirtySave = false;
    return saveState(storage, state());
  }

  function log(text, icon = '•', tone = '') {
    hud.log({ time: formatTime(state().clock.minutes), icon, text, tone });
  }

  function say(line, ms) {
    scene.say(line, ms);
  }

  function isSleeping() {
    const mode = state().mode;
    return mode === 'sleeping' || mode === 'winding';
  }

  function modeIsFree() {
    const mode = state().mode;
    return mode === 'idle' || mode === 'eating';
  }

  function canAct() {
    return modeIsFree() && !isSleeping() && !state().clock.night;
  }

  function isBusy() {
    return !modeIsFree() || isSleeping() || Boolean(state().clock.night);
  }

  function setMode(mode, opts = {}) {
    if (!MODES.includes(mode)) return false;
    mutate((s) => ({ ...s, mode }), 'mode');
    if (opts.holdMs) {
      clearTimeout(runtime.modeTimer);
      runtime.modeTimer = setTimeout(() => {
        if (state().mode === mode) mutate((s) => ({ ...s, mode: 'idle' }), 'mode');
      }, opts.holdMs);
    }
    return true;
  }

  /* ------------------------------------------------------------- ekonomi */

  function awardXp(amount, reason = '') {
    const gained = Math.max(0, Math.round(amount));
    if (!gained) return { leveledUp: false };
    let leveled = null;
    mutate((s) => {
      const info = addXp(s.xp, gained);
      if (!info.leveledUp) return { ...s, xp: info.xp, level: info.level };
      const bonus = levelUpReward(info.toLevel);
      leveled = { level: info.toLevel, bonus };
      return { ...s, xp: info.xp, level: info.toLevel, coins: s.coins + bonus };
    }, 'xp');
    if (leveled) {
      audio.play('levelup');
      toast.show(`Level ${leveled.level} tercapai! Hadiah ${leveled.bonus} koin.`, { icon: '🏆', tone: 'coin', ttl: 5200 });
      fx.confetti({ count: 22 });
      log(`Naik ke level ${leveled.level}${reason ? ` (${reason})` : ''}`, '🏆', 'good');
    }
    return { leveledUp: Boolean(leveled) };
  }

  function awardCoins(amount, reason = '') {
    const gained = Math.round(amount);
    if (!gained) return 0;
    mutate((s) => ({ ...s, coins: Math.max(0, s.coins + gained), counts: { ...s.counts, totalCoins: s.counts.totalCoins + Math.max(0, gained) } }), 'coins');
    if (gained > 0 && reason) log(`+${gained} koin · ${reason}`, '🪙');
    return gained;
  }

  function applyMissions(action, amount = 1) {
    let completed = [];
    mutate((s) => {
      const result = recordAction(s.missions, action, amount);
      completed = result.completed;
      return completed.length ? { ...s, missions: result.missions } : s;
    }, 'missions');

    if (!completed.length) return;
    for (const mission of completed) {
      audio.play('coin');
      toast.show(`Misi selesai: ${mission.label}`, {
        icon: '✅',
        tone: 'good',
        sub: `+${mission.reward.coins} koin · +${mission.reward.xp} XP`,
      });
      mutate(
        (s) => ({ ...s, coins: s.coins + mission.reward.coins, counts: { ...s.counts, totalCoins: s.counts.totalCoins + mission.reward.coins } }),
        'coins'
      );
      awardXp(mission.reward.xp, 'misi');
      log(`Misi selesai: ${mission.label}`, '✅', 'good');
    }
    const summary = missionsSummary(state().missions);
    if (summary.allDone) {
      fx.confetti({ count: 26 });
      audio.play('chime');
      toast.show('Semua misi harian selesai! Kamu perawat hebat.', { icon: '🌟', tone: 'coin', ttl: 6000 });
      mutate((s) => ({
        ...s,
        coins: s.coins + 25,
        unlocked: { ...s.unlocked, missionsPerfect: (s.unlocked.missionsPerfect ?? 0) + 1 },
        counts: { ...s.counts, perfectDays: (s.counts.perfectDays ?? 0) + 1, totalCoins: s.counts.totalCoins + 25 },
      }));
      awardXp(60, 'misi lengkap');
      log('Semua misi harian selesai (+25 koin bonus)', '🌟', 'good');
    }
  }

  /* ------------------------------------------------------------ interaksi */

  function feed(foodId) {
    const st = state();
    const food = foodById(foodId);
    if (!food) return false;
    if (isSleeping()) {
      toast.show('Jangan bangunkan, ya — lagi tidur.', { icon: '🤫', tone: 'bad' });
      return false;
    }
    if (!modeIsFree()) {
      toast.show('Tunggu aktivitas sekarang selesai.', { icon: '⏳', tone: 'bad' });
      return false;
    }
    if (!food.pantry && !st.unlocked.items.includes(foodKey(food.id))) {
      toast.show('Menu itu belum dibuka. Beli dulu di Toko Makanan.', { icon: '🔒', tone: 'bad' });
      return false;
    }
    const check = canConsume(food, st.stats);
    if (!check.ok) {
      audio.play('error');
      toast.show(`${characterName()} menolak: ${check.reason}`, { icon: '🙅', tone: 'bad' });
      say(randomLine(st.character, 'tolak'), 2600);
      return false;
    }

    const char = character();
    const { effects, tag } = foodEffects(food, char);
    runtime.deltas = { ...effects };

    mutate((s) => ({
      ...s,
      stats: applyDeltas(s.stats, effects),
      mode: 'eating',
      counts: {
        ...s.counts,
        makan: s.counts.makan + (food.kind === 'minum' ? 0 : 1),
        minum: s.counts.minum + (food.kind === 'minum' ? 1 : 0),
      },
    }), 'stats', 'mode');

    clearTimeout(runtime.eatTimer);
    runtime.eatTimer = setTimeout(() => {
      if (state().mode === 'eating') mutate((s) => ({ ...s, mode: 'idle' }), 'mode');
    }, 1900);

    actor.pulse('eating', 1800);
    actor.pulse('happy', 900);
    const mouth = actor.el?.querySelector('.mouth');
    fx.burst({ at: mouth ?? actor.el, emojis: [food.emoji, '✨'], count: 4, spread: 44, duration: 900, size: 24 });
    if (food.crumbs > 0.5) {
      fx.burst({ at: actor.el, emojis: ['✨', '🍂'], count: 3, spread: 120, duration: 1200, kind: 'fall', size: 16 });
    }
    audio.play(food.kind === 'minum' ? 'sip' : 'eat');
    say(`${food.name}! ${randomLine(st.character, food.kind === 'minum' ? 'minum' : 'makan')}`, 3200);

    awardXp(xpForFood(food), food.name);
    applyMissions(food.kind === 'minum' ? 'minum' : 'makan', 1);

    const summary = Object.entries(effects)
      .filter(([, value]) => Number(value) !== 0)
      .map(([key, value]) => `${statMeta(key)?.label ?? key} ${value > 0 ? '+' : ''}${Math.round(value)}`)
      .join(', ');
    log(`${food.emoji} ${food.name} — ${summary}`, food.emoji, tag === `hindari-${char.id}` ? 'bad' : '');

    if (tag === `hindari-${char.id}`) {
      toast.show(`${characterName()} kurang suka ${food.name}.`, { icon: '😝', tone: 'bad', sub: 'Lihat kartu karakter untuk menu favoritnya.' });
    } else if (tag === `favorit-${char.id}`) {
      toast.show(`${characterName()} suka sekali ${food.name}!`, { icon: '💖', tone: 'good' });
      runtime.heartsUntil = Date.now() + 4200;
      fx.burst({ at: actor.el, emojis: ['💖', '💕'], count: 6, spread: 120, duration: 1500 });
    }
    return true;
  }

  function buy(key, price, label, onDone) {
    const st = state();
    if (st.unlocked.items.includes(key)) {
      toast.show('Barang itu sudah kamu miliki.', { icon: 'ℹ️' });
      return false;
    }
    if (st.coins < price) {
      audio.play('error');
      toast.show(`Koin kurang ${price - st.coins}.`, { icon: '🪙', tone: 'bad', sub: 'Selesaikan misi harian atau menangkan mini-game.' });
      return false;
    }
    mutate(
      (s) => ({
        ...s,
        coins: Math.max(0, s.coins - price),
        unlocked: { ...s.unlocked, items: [...s.unlocked.items, key] },
        counts: { ...s.counts, belanja: s.counts.belanja + 1 },
      }),
      'unlocked',
      'coins'
    );
    audio.play('coin');
    fx.burst({ at: scene.stage, emojis: ['🪙', '✨'], count: 7, spread: 140, duration: 1000 });
    toast.show(`${label} terbuka!`, { icon: '🛍️', tone: 'good', sub: `-${price} koin` });
    log(`Membeli ${label} (-${price} koin)`, '🛍️');
    awardXp(12, 'belanja');
    applyMissions('belanja', 1);
    say(`${characterName()}: ${randomLine(state().character, 'beli')}`, 3000);
    if (typeof onDone === 'function') onDone();
    return true;
  }

  function equip(kind, id) {
    const st = state();
    if (kind === 'outfit') {
      const item = outfitById(id);
      if (!item || item.character !== st.character) return false;
      if (item.price > 0 && !st.unlocked.items.includes(outfitKey(id))) {
        toast.show('Busana itu masih terkunci.', { icon: '🔒', tone: 'bad' });
        return false;
      }
      if (st.dressing.outfit === id) return true;
      mutate((s) => ({
        ...s,
        dressing: { ...s.dressing, outfit: id },
        stats: applyDeltas(s.stats, { bahagia: 3 }),
        counts: { ...s.counts, gaya: s.counts.gaya + 1 },
      }));
      runtime.deltas = { bahagia: 3 };
      actor.pulse('happy', 800);
      fx.burst({ at: actor.el, emojis: ['✨', st.character === 'barbie' ? '👗' : '🧸'], count: 5, spread: 120, duration: 1100 });
      audio.play('pop');
      say(`Gimana, cocok nggak? (${item.name})`, 2800);
      log(`Memakai ${item.name}`, '👗');
      awardXp(6, 'gaya');
      applyMissions('gaya', 1);
      return true;
    }
    if (kind === 'accessory') {
      if (!id) {
        mutate((s) => ({ ...s, dressing: { ...s.dressing, accessory: null } }), 'dressing');
        log('Aksesori dilepas', '🎀');
        return true;
      }
      const item = accessoryById(id);
      if (!item || item.character !== st.character) return false;
      if (!st.unlocked.items.includes(accessoryKey(id))) {
        toast.show('Aksesori itu masih terkunci.', { icon: '🔒', tone: 'bad' });
        return false;
      }
      if (st.dressing.accessory === id) return equip('accessory', null);
      mutate((s) => ({
        ...s,
        dressing: { ...s.dressing, accessory: id },
        stats: applyDeltas(s.stats, { bahagia: 2 }),
        counts: { ...s.counts, gaya: s.counts.gaya + 1 },
      }));
      runtime.deltas = { bahagia: 2 };
      actor.pulse('happy', 700);
      audio.play('pop');
      log(`Memakai ${item.name}`, '🎀');
      awardXp(5, 'aksesori');
      applyMissions('gaya', 1);
      return true;
    }
    return false;
  }

  function applyTheme(id) {
    const st = state();
    if (id !== 'pink' && !st.unlocked.items.includes(themeKey(id))) {
      toast.show('Tema kamar itu belum dibeli.', { icon: '🔒', tone: 'bad' });
      return false;
    }
    mutate((s) => ({ ...s, dressing: { ...s.dressing, theme: id } }), 'dressing');
    scene.setTheme(id);
    audio.play('chime');
    log(`Tema kamar: ${id === 'noir' ? 'Noir Elegan' : 'Pink Manis'}`, '🛏️');
    return true;
  }

  function completeBath({ ratio = 1, cancelled = false } = {}) {
    const st = state();
    const clean = Math.max(0, Math.min(1, Number(ratio) || 0));
    const full = !cancelled && clean >= 0.99;
    const gain = Math.round((cancelled ? 22 * clean : 46) * (0.45 + 0.55 * clean));
    const effects = {
      bersih: gain,
      bahagia: full ? 9 : Math.round(5 * clean),
      energi: -(full ? 9 : Math.round(6 * clean)),
      sehat: full ? 5 : Math.round(2 * clean),
    };
    runtime.deltas = effects;
    runtime.wetUntil = Date.now() + 6000;
    runtime.sparkleUntil = full ? Date.now() + 6500 : Date.now() + 1800;

    mutate((s) => ({
      ...s,
      stats: applyDeltas(s.stats, effects),
      mode: 'idle',
      counts: { ...s.counts, mandi: s.counts.mandi + (full ? 1 : 0) },
    }), 'stats', 'mode');

    audio.play(full ? 'chime' : 'splash');
    if (full) {
      fx.burst({ at: actor.el, emojis: ['✨', '🫧', '💖'], count: 10, spread: 190, duration: 1600 });
      actor.pulse('happy', 900);
      say(randomLine(st.character, 'mandi'), 3200);
      log('Mandi selesai — wangi dan kinclong', '🫧', 'good');
      awardXp(20, 'mandi');
      applyMissions('mandi', 1);
    } else {
      toast.show(clean > 0 ? 'Mandi berhenti di tengah jalan.' : 'Mandi dibatalkan.', {
        icon: '🧼',
        tone: 'bad',
        sub: `Kebersihan +${effects.bersih}`,
      });
      log(`Mandi berhenti (kemajuan ${Math.round(clean * 100)}%)`, '🧼');
      awardXp(Math.round(6 * clean), 'mandi');
    }
    return { full, gain };
  }

  function minigameFinish({ score = 0, misses = 0, finished = false } = {}) {
    const st = state();
    const points = Math.max(0, Math.round(Number(score) || 0));
    const plays = st.counts.playsToday ?? 0;
    const mult = [1, 0.7, 0.5, 0.35][Math.min(3, plays)] ?? 0.3;
    const happy = Math.round(Math.max(0, 4 + points * 1.6) * mult);
    const coins = Math.round(Math.max(0, points * 1.6) * mult);
    const xp = Math.round(Math.max(0, 6 + points * 2.4) * mult);
    const effects = {
      bahagia: happy,
      energi: -Math.round(9 + Math.min(8, points) * 0.5),
      kenyang: -Math.round(4 + points * 0.4),
      bersih: -Math.round(2 + misses * 0.6),
    };
    runtime.deltas = effects;
    mutate(
      (s) => ({
        ...s,
        stats: applyDeltas(s.stats, effects),
        coins: s.coins + coins,
        counts: {
          ...s.counts,
          main: s.counts.main + 1,
          playsToday: (s.counts.playsToday ?? 0) + 1,
          bestGame: Math.max(s.counts.bestGame ?? 0, points),
          totalCoins: s.counts.totalCoins + coins,
        },
      }),
      'stats',
      'coins'
    );
    if (points >= 5) applyMissions('main', 1);
    awardXp(xp, 'main');
    actor.pulse('happy', 1100);
    if (points > 0) fx.burst({ at: actor.el, emojis: ['💖', '⭐'], count: 6, spread: 150, duration: 1400 });
    say(points >= 8 ? randomLine(st.character, 'main') : randomLine(st.character, 'bosan'), 3000);
    log(`Mini-game selesai — skor ${points}${misses ? `, meleset ${misses}` : ''} (+${happy} Bahagia, +${coins} koin)`, '🎈', points >= 8 ? 'good' : '');
    return {
      score: points,
      coins,
      xp,
      bahagia: happy,
      finished: Boolean(finished),
      note: plays > 0 ? `Hadiah menyusut kalau bermain berulang di hari yang sama (×${mult}).` : 'Koin dari mini-game masuk ke tabunganmu.',
    };
  }

  /* ---------------------------------------------------------------- tidur */

  function beginSleep({ label = 'malam tiba' } = {}) {
    const st = state();
    if (isSleeping()) return false;
    runtime.dayScore = careScore(st.stats);
    runtime.sleepBase = { ...st.stats };
    mutate((s) => ({
      ...s,
      mode: 'winding',
      clock: { ...s.clock, minutes: NIGHT_AT, night: true, paused: true, phase: 'malam' },
      sleep: { phase: 'wind', elapsed: 0, total: SLEEP_SECONDS },
    }), 'mode', 'clock');
    log(`Waktunya tidur — ${label}`, '🌙');
    applyMissions('tidur', 1);
    scene.setPhase('malam');
    scene.say(`${characterName()} mengantuk...`, 2600);
    audio.unlock();
    return true;
  }

  /** Dipanggil tiap 100ms selama tidur: memulihkan energi secara bertahap. */
  function sleepTick(phase, t) {
    const base = runtime.sleepBase;
    if (!base) return;
    const ratio = Math.max(0, Math.min(1, Number(t) || 0));
    store.update((s) => {
      const next = { ...s.stats };
      if (phase === 'wind') {
        next.energi = base.energi - 2 * ratio;
        next.kenyang = base.kenyang - 1.5 * ratio;
        next.bahagia = base.bahagia - ratio;
      } else {
        next.energi = base.energi + (100 - base.energi) * ratio;
        next.kenyang = Math.max(6, base.kenyang - 6 * ratio);
        next.bersih = Math.max(6, base.bersih - 4 * ratio);
        next.bahagia = Math.min(100, base.bahagia + 6 * ratio);
        next.sehat = Math.min(100, base.sehat + ((runtime.dayScore ?? 0) > 60 ? 8 : 2) * ratio);
      }
      return {
        ...s,
        stats: Object.fromEntries(STAT_IDS.map((id) => [id, Math.max(0, Math.min(100, next[id] ?? 0))])),
        sleep: { ...s.sleep, phase, elapsed: phase === 'wind' ? ratio * WIND_DOWN_SECONDS : ratio * SLEEP_SECONDS },
      };
    }, 'stats');
    runtime.dirtySave = true;
    scheduleRender();
  }

  function completeSleep() {
    const st = state();
    const score = runtime.dayScore ?? careScore(st.stats);
    const stars = starsFor(score);
    const reward = morningReward(stars);
    const evaluated = evaluateMissions(st.missions, st.stats);
    const bonusCoins = evaluated.completed.reduce((sum, m) => sum + m.reward.coins, 0);
    const streak = stars >= 3 ? st.streak + 1 : 0;

    mutate((s) => ({
      ...s,
      stats: { ...s.stats, energi: 100 },
      mode: 'idle',
      clock: { ...createClock({ minutes: WAKE_AT, speed: s.clock.speed }), speedId: s.clock.speedId ?? speedByMul(s.clock.speed).id },
      day: s.day + 1,
      sleep: { phase: 'none', elapsed: 0, total: SLEEP_SECONDS },
      coins: s.coins + reward.coins + bonusCoins,
      streak,
      bestStreak: Math.max(s.bestStreak, streak),
      dailyReport: { day: s.day, score, stars, coins: reward.coins + bonusCoins },
      missions: buildDailyMissions(s.day + 1, s.character, s.level),
      counts: {
        ...s.counts,
        totalDays: s.counts.totalDays + 1,
        playsToday: 0,
        totalCoins: s.counts.totalCoins + reward.coins + bonusCoins,
      },
    }));

    for (const mission of evaluated.completed) {
      awardXp(mission.reward.xp, 'misi pagi');
      log(`Misi selesai saat pagi: ${mission.label}`, '✅', 'good');
    }

    awardXp(reward.xp, 'perawatan harian');
    audio.play('morning');
    const greeting = randomLine(state().character, 'bangun');
    say(greeting, 3600);
    log(
      `Hari ${st.day} selesai — skor ${score} (${'★'.repeat(stars)}), bonus ${reward.coins + bonusCoins} koin${
        streak >= 2 ? `, runtutan ${streak} hari` : ''
      }`,
      '🌅',
      'good'
    );
    if (streak >= 3 && streak % 3 === 0) {
      toast.show(`Runtutan ${streak} hari berturut-turut!`, { icon: '🔥', tone: 'coin', sub: 'Konsistensi adalah kunci perawatan.' });
      fx.confetti({ count: 24 });
    }
    runtime.sleepBase = null;
    clearTimeout(runtime.wakeTimer);
    runtime.wakeTimer = setTimeout(() => render(true), 400);
    return { score, stars, coins: reward.coins + bonusCoins, name: characterName(), greeting };
  }

  /** Tombol Tidur: hanya berhasil bila jam kamar sudah malam. */
  function requestSleep() {
    const st = state();
    if (isSleeping()) return false;
    if (!st.clock.night) {
      const left = minutesUntilNight(st.clock.minutes);
      toast.show(`Belum waktunya tidur. Malam tiba ${formatDuration(left)} lagi.`, {
        icon: '⏰',
        sub: `Sekarang jam ${formatTime(st.clock.minutes)} — tidur wajib mulai 18:00.`,
      });
      return false;
    }
    sleep.begin({ label: `jam ${formatTime(st.clock.minutes)}` });
    return true;
  }

  /* ------------------------------------------------------- loop & render */

  function attentionFor(st) {
    if (st.clock.night || isSleeping()) return [];
    const list = [];
    if (st.stats.kenyang < 42) list.push('makan');
    if (st.stats.bersih < 40) list.push('mandi');
    if (st.stats.bahagia < 42) list.push('main');
    return list;
  }

  function render(force = false) {
    const st = state();
    const now = Date.now();
    if (!force && now - runtime.lastRender < RENDER_INTERVAL) return;
    runtime.lastRender = now;

    const phase = phaseOf(st.clock.minutes);
    scene.setPhase(phase);
    scene.setTheme(st.dressing.theme);
    scene.setMotion(st.settings.motion);
    scene.setCelestial(st.clock.minutes, dayArc(st.clock.minutes));

    const mood = moodOf(st.stats, { sleeping: isSleeping() });
    hud.render(st, {
      mood,
      deltas: runtime.deltas,
      busy: isBusy(),
      sleepReady: Boolean(st.clock.night) && !isSleeping(),
      sleepHint: isSleeping()
        ? 'Sedang tidur...'
        : st.clock.night
          ? 'Sudah malam — tidur sekarang'
          : `Mulai 18:00 · sisa ${formatDuration(minutesUntilNight(st.clock.minutes))}`,
      attention: attentionFor(st),
    });
    scene.setMood(MOOD_EMOJI[mood.id] ?? '🙂', isSleeping() ? null : mood.label);

    actor.update(st, {
      moodId: isSleeping() ? 'tidur' : mood.id,
      sparkle: now < runtime.sparkleUntil ? 1 : undefined,
      wet: st.mode === 'bathing' || now < runtime.wetUntil ? 1 : 0,
      hearts: now < runtime.heartsUntil ? 1 : undefined,
    });
    scene.setSleeping(isSleeping());

    if (Object.keys(runtime.deltas).length) {
      clearTimeout(runtime.deltaTimer);
      runtime.deltaTimer = setTimeout(() => {
        runtime.deltas = {};
        scheduleRender();
      }, 1600);
    }

    document.title = `${formatTime(st.clock.minutes)} · ${characterName()} — Berbie & Tom`;
  }

  function frame(now) {
    if (!runtime.running) return;
    const dt = runtime.lastFrame ? Math.min(0.25, Math.max(0, (now - runtime.lastFrame) / 1000)) : 0;
    runtime.lastFrame = now;
    const st = state();

    if (!st.clock.paused && !st.clock.night && dt > 0) {
      const before = st.clock.minutes;
      const advanced = advanceClock(st.clock, dt);
      const gainedMinutes = Math.max(0, advanced.clock.minutes - before);
      const decayed = decayStats(st.stats, gainedMinutes, { mode: st.mode });

      store.update(
        (s) => ({
          ...s,
          clock: { ...advanced.clock, phase: advanced.phase, speedId: s.clock.speedId },
          stats: decayed.stats,
        }),
        'clock',
        'stats'
      );
      runtime.dirtySave = true;

      for (const alert of decayed.alerts) queueAlert(alert);
      for (const event of advanced.events) {
        if (event === 'nightfall') onNightfall();
        else if (event.startsWith('phase:')) onPhaseChange(event.slice(6));
      }
    }

    maybeChat(now, st);
    render(false);
    requestAnimationFrame(frame);
  }

  function queueAlert(alert) {
    pendingAlerts.push(alert);
    if (pendingAlerts.length > 4) pendingAlerts.shift();
  }

  function flushAlerts() {
    if (!pendingAlerts.length) return;
    const alert = pendingAlerts.shift();
    const meta = statMeta(alert.id);
    toast.show(`${meta?.icon ?? '⚠️'} ${alert.message}`, {
      icon: alert.level === 'danger' ? '🚨' : '⚠️',
      tone: alert.level === 'danger' ? 'bad' : 'info',
      ttl: 5200,
      onAction:
        alert.id === 'kenyang' ? () => panels.openKitchen('makan') : alert.id === 'bersih' ? () => bath.start() : undefined,
      actionLabel: alert.id === 'kenyang' ? 'Buka Dapur' : alert.id === 'bersih' ? 'Mandi' : '',
    });
    audio.play('soft');
    log(alert.message, alert.level === 'danger' ? '🚨' : '⚠️', alert.level === 'danger' ? 'bad' : '');
  }

  function maybeChat(now, st) {
    if (isSleeping() || st.mode !== 'idle') return;
    if (now - runtime.lastChatAt < CHAT_INTERVAL) return;
    runtime.lastChatAt = now;
    const mood = moodOf(st.stats);
    const key = MOOD_TO_DIALOGUE[mood.id] ?? PHASE_TO_DIALOGUE[phaseOf(st.clock.minutes)];
    say(randomLine(st.character, key, mood.line), 3400);
  }

  function onNightfall() {
    modal.closeAll();
    if (bath.active) bath.forceStop();
    minigame.abort();
    minigame.close();
    toast.show(`Jam 18:00 — ${characterName()} wajib tidur ${SLEEP_SECONDS} detik.`, { icon: '🌙', tone: 'night', ttl: 5000 });
    sleep.begin({ label: 'jam 18:00' });
  }

  function onPhaseChange(phase) {
    const meta = phaseMeta(phase);
    if (phase === 'malam') return; // sudah ditangani nightfall
    audio.play('chime');
    toast.show(`${meta.label}: ${meta.greeting}`, { icon: meta.icon, ttl: 4200, sub: meta.note });
    log(`Fase berganti: ${meta.label}`, meta.icon);
    say(randomLine(state().character, PHASE_TO_DIALOGUE[phase] ?? 'senang'), 3400);
  }

  /* -------------------------------------------------------------- kontrol */

  function setPaused(value) {
    const next = Boolean(value);
    if (isSleeping()) return false;
    mutate((s) => ({ ...s, clock: { ...s.clock, paused: next } }), 'clock');
    log(next ? 'Waktu kamar dijeda' : 'Waktu kamar berjalan lagi', '⏸');
    return next;
  }

  function togglePause() {
    if (isSleeping()) {
      toast.show('Lagi tidur, tidak bisa dijeda.', { icon: '🤫' });
      return false;
    }
    const next = setPaused(!state().clock.paused);
    toast.show(next ? 'Waktu dijeda — status tidak berubah.' : 'Waktu berjalan lagi.', { icon: next ? '⏸' : '▶️' });
    return next;
  }

  /** Elus/belai karakter (klik pada figur di panggung). */
  function pet() {
    const st = state();
    if (st.mode !== 'idle' || isSleeping() || st.clock.night) return false;
    const now = Date.now();
    const cool = 12000;
    const left = Math.max(0, cool - (now - (runtime.lastPetAt ?? 0)));
    if (left > 0) {
      runtime.heartsUntil = now + 1800;
      actor.pulse('happy', 500);
      fx.burst({ at: actor.el, emojis: ['💗'], count: 2, spread: 70, duration: 900, size: 22 });
      return false;
    }
    runtime.lastPetAt = now;
    runtime.heartsUntil = now + 4000;
    runtime.deltas = { bahagia: 2 };
    mutate((s) => ({ ...s, stats: applyDeltas(s.stats, { bahagia: 2, bersih: -1 }) }), 'stats');
    actor.pulse('happy', 900);
    fx.burst({ at: actor.el, emojis: ['💖', '💕', '✨'], count: 6, spread: 130, duration: 1400 });
    audio.play('pop');
    say(randomLine(st.character, MOOD_TO_DIALOGUE[moodOf(st.stats).id] ?? 'senang'), 2600);
    awardXp(2, 'dibelai');
    return true;
  }

  function setSetting(key, value) {
    mutate((s) => ({ ...s, settings: { ...s.settings, [key]: value } }), 'settings');
    if (key === 'sound') audio.setEnabled(Boolean(value));
    if (key === 'motion') fx.setReduced(value === 'reduced');
    return true;
  }

  function setSound(next) {
    audio.unlock();
    audio.setEnabled(Boolean(next));
    setSetting('sound', Boolean(next));
    const btn = $('#btn-sound');
    if (btn) btn.setAttribute('aria-pressed', next ? 'true' : 'false');
    if (next) audio.play('click');
    return Boolean(next);
  }

  function setMotion(mode) {
    const next = mode === 'reduced' ? 'reduced' : 'full';
    setSetting('motion', next);
    scene.setMotion(next);
    fx.setReduced(next === 'reduced');
    return next;
  }

  function setSpeed(id) {
    const speed = speedById(id);
    mutate((s) => ({ ...s, clock: { ...s.clock, speed: speed.mul, speedId: speed.id } }), 'clock');
    log(`Kecepatan waktu: ${speed.label} (${speed.hint})`, '⏱');
    toast.show(`Waktu kamar ${speed.label} — ${speed.hint}.`, { icon: '⏱' });
    return speed;
  }

  function rename(input) {
    const next = cleanName(input);
    if (!next) return false;
    mutate((s) => ({ ...s, name: next }), 'name');
    log(`Ganti nama menjadi ${next}`, '🏷️');
    say(`${next}? Aku suka nama baru ini!`, 3200);
    return true;
  }

  function resetDay() {
    sleep.hardStop();
    mutate((s) => ({
      ...s,
      clock: { ...createClock({ minutes: WAKE_AT, speed: s.clock.speed }), speedId: s.clock.speedId ?? speedByMul(s.clock.speed).id },
      mode: 'idle',
      sleep: { phase: 'none', elapsed: 0, total: SLEEP_SECONDS },
      missions: buildDailyMissions(s.day, s.character, s.level),
      counts: { ...s.counts, playsToday: 0 },
    }));
    scene.setSleeping(false);
    scene.setPhase('pagi');
    actor.hold('sleeping', false);
    log('Hari direset ke 05:00', '⏱');
    toast.show('Hari diulang dari pagi.', { icon: '🌅', tone: 'good' });
    render(true);
  }

  function wipe() {
    saveNow();
    clearFor(storage, state().character);
    hooks.onWipe?.(state().character);
  }

  function normalizeDressing() {
    const st = state();
    const outfit = OUTFITS.find((o) => o.id === st.dressing.outfit && o.character === st.character);
    const accessory = ACCESSORIES.find((a) => a.id === st.dressing.accessory && a.character === st.character);
    const fallback = OUTFITS.find((o) => o.character === st.character && o.price === 0);
    if (!outfit || !accessory) {
      mutate((s) => {
        const safeOutfit = outfit ?? fallback;
        return {
          ...s,
          dressing: {
            ...s.dressing,
            outfit: safeOutfit?.id ?? OUTFITS[0].id,
            accessory: accessory ? accessory.id : null,
          },
        };
      }, 'dressing');
    }
    scene.setTheme(state().dressing.theme);
  }

  /* ------------------------------------------------------------- subsistem */

  const modeBar = {
    bar: $('#mode-bar'),
    icon: $('#mode-icon'),
    label: $('#mode-label'),
    fill: $('#mode-fill'),
    value: $('#mode-value'),
    action: $('#mode-action'),
    exit: $('#mode-exit'),
  };

  const api = {
    getState: state,
    store,
    character,
    actor,
    scene,
    hud,
    fx,
    toast,
    audio,
    modal,
    isBusy,
    canAct,
    isSleeping,
    setMode,
    log,
    say,
    feed,
    buy,
    equip,
    applyTheme,
    completeBath,
    minigameFinish,
    sleepTick,
    completeSleep,
    requestSleep,
    setSpeed,
    setSound,
    setMotion,
    setSetting,
    rename,
    resetDay,
    wipe,
    render: () => render(true),
    setPaused,
    togglePause,
    pet,
    beginSleep: () => beginSleep({ label: 'malam tiba' }),
    switchCharacter() {
      saveNow();
      hooks.onSwitch?.(state().character);
    },
    openKitchen: (...args) => panels.openKitchen(...args),
    openWardrobe: (...args) => panels.openWardrobe(...args),
    openReport: (...args) => panels.openReport(...args),
    openSettings: (...args) => panels.openSettings(...args),
    openHelp: (...args) => panels.openHelp(...args),
    startBath: () => bath.start(),
    openMinigame: () => minigame.open(),
  };

  const bath = createBath({ api, modeBar, toast, audio, fx });
  const minigame = createMinigame({ api, toast, audio, fx });
  const sleep = createSleep({ api, toast, audio, fx, modal });
  const panels = createPanels({ api, modal, toast, audio });

  api.bath = bath;
  api.minigame = minigame;
  api.sleep = sleep;
  api.panels = panels;

  function start() {
    if (runtime.running) return api;
    runtime.running = true;
    runtime.lastFrame = 0;
    actor.mount(state().character);
    normalizeDressing();
    hud.buildStats(character());
    scene.setTheme(state().dressing.theme);
    scene.setMotion(state().settings.motion);
    fx.setReduced(state().settings.motion === 'reduced');
    audio.setEnabled(state().settings.sound !== false);
    document.getElementById('btn-sound')?.setAttribute('aria-pressed', state().settings.sound !== false ? 'true' : 'false');
    requestAnimationFrame(frame);
    setInterval(flushAlerts, 800);
    runtime.autosaveTimer = setInterval(() => {
      if (runtime.dirtySave) saveNow();
    }, AUTOSAVE_INTERVAL);
    document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
    const anchor = document.getElementById('char-anchor');
    anchor?.addEventListener('pointerdown', () => pet());
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveNow();
      else {
        runtime.lastFrame = 0;
        render(true);
      }
    });
    render(true);
    say(randomLine(state().character, PHASE_TO_DIALOGUE[phaseOf(state().clock.minutes)] ?? 'senang'), 4200);
    log(`Perawatan ${characterName()} dimulai · hari ${state().day}`, '🎀', 'good');
    if (state().clock.night) {
      toast.show('Kamu kembali saat malam — tidur dulu, ya.', { icon: '🌙', tone: 'night' });
      sleep.begin({ label: 'kamu baru kembali' });
    }
    return api;
  }

  function stop() {
    runtime.running = false;
    clearInterval(runtime.autosaveTimer);
    saveNow();
  }

  api.start = start;
  api.stop = stop;
  api.save = saveNow;

  return api;
}
