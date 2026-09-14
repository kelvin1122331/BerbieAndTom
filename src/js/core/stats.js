/**
 * Sistem status kebutuhan karakter (murni, tanpa DOM).
 * Semua nilai 0..100; makin tinggi makin sehat/bahagia.
 */

export const STAT_LIST = [
  {
    id: 'kenyang',
    label: 'Kenyang',
    icon: '🍚',
    hint: 'Perut terisi. Beri makan tiap beberapa jam.',
    decay: 0.085,
    warn: 35,
    color: '#ff9ec4',
  },
  {
    id: 'bersih',
    label: 'Kebersihan',
    icon: '🫧',
    hint: 'Tubuh & baju wangi. Mandi bila mulai tampak kotor.',
    decay: 0.055,
    warn: 35,
    color: '#8fd8ff',
  },
  {
    id: 'bahagia',
    label: 'Kebahagiaan',
    icon: '💖',
    hint: 'Butuh main, pujian, dan camilan favorit.',
    decay: 0.05,
    warn: 35,
    color: '#ff7ae0',
  },
  {
    id: 'energi',
    label: 'Energi',
    icon: '⚡',
    hint: 'Habis beraktivitas, pulih total hanya saat tidur malam.',
    decay: 0.05,
    warn: 30,
    color: '#ffd166',
  },
  {
    id: 'sehat',
    label: 'Kesehatan',
    icon: '🌿',
    hint: 'Turun kalau lapar/kotor lama-lama. Obati di Toko.',
    decay: 0,
    warn: 45,
    color: '#8be6b0',
  },
];

export const STAT_IDS = STAT_LIST.map((s) => s.id);
export const MAX = 100;
export const MIN = 0;

export const clamp = (v, lo = MIN, hi = MAX) => (v < lo ? lo : v > hi ? hi : v);

export function defaultStats(overrides = {}) {
  const base = { kenyang: 78, bersih: 82, bahagia: 74, energi: 88, sehat: 90 };
  const out = { ...base };
  for (const key of STAT_IDS) {
    const v = overrides?.[key];
    out[key] = Number.isFinite(v) ? clamp(v) : base[key];
  }
  return out;
}

export function statMeta(id) {
  return STAT_LIST.find((s) => s.id === id) ?? null;
}

/**
 * Terapkan peluruhan status sesuai berjalannya waktu game.
 * @param {object} stats status saat ini
 * @param {number} gameMinutes menit game yang telah lewat
 * @param {{wet?:boolean, dirtyDress?:boolean, mode?:string}} [ctx] konteks (mode mandi mengurangi energi sedikit)
 * @returns {{stats:object, alerts:Array<{id:string, level:string, message:string}>, deltas:object}}
 */
export function decayStats(stats, gameMinutes, ctx = {}) {
  const mins = Math.max(0, Math.min(Number(gameMinutes) || 0, 24 * 60));
  const next = { ...stats };
  const alerts = [];
  const deltas = {};

  const kelaparan = stats.kenyang < 25 ? 1.5 : stats.kenyang < 45 ? 1.15 : 1;
  const kotorEkstra = ctx.dirtyDress ? 1.3 : 1;
  const capekEkstra = stats.kenyang < 20 ? 1.6 : 1;

  const apply = (id, amount) => {
    const before = stats[id];
    const after = clamp(before + amount);
    next[id] = after;
    deltas[id] = Math.round((after - before) * 10) / 10;
    if (before >= statMeta(id).warn && after < statMeta(id).warn) {
      alerts.push({ id, level: 'warn', message: warnMessage(id) });
    }
    if (before >= 15 && after < 15) {
      alerts.push({ id, level: 'danger', message: dangerMessage(id) });
    }
  };

  apply('kenyang', -0.085 * mins * kelaparan);
  apply('bersih', -0.055 * mins * kotorEkstra);
  apply('bahagia', -0.05 * mins * (stats.sehat < 40 ? 1.6 : 1) * (stats.kenyang < 20 ? 1.3 : 1));
  apply('energi', -0.05 * mins * capekEkstra);

  // Kesehatan: turun bila kebutuhan pokok diabaikan, pulih bila semua terjaga.
  const buruk = (stats.kenyang < 18 ? 1 : 0) + (stats.bersih < 18 ? 1 : 0) + (stats.bahagia < 18 ? 0.6 : 0);
  const baik = stats.kenyang > 60 && stats.bersih > 60 && stats.bahagia > 55 ? 1 : 0;
  apply('sehat', (-0.075 * buruk + 0.03 * baik) * mins);

  return { stats: next, alerts, deltas };
}

function warnMessage(id) {
  return (
    {
      kenyang: 'Perut mulai keroncongan, saatnya ngemil.',
      bersih: 'Mulai lengket dan kotor, ayo mandi!',
      bahagia: 'Sedikit bosan nih, ajak main sebentar.',
      energi: 'Mulai ngantuk dan lemas.',
      sehat: 'Daya tahan tubuh menurun, jaga pola makan ya.',
    }[id] ?? 'Kebutuhanmu mulai menurun.'
  );
}

function dangerMessage(id) {
  return (
    {
      kenyang: 'Lapar sekali! Kasihan, cepat beri makan.',
      bersih: 'Kotor banget, badan gatal. Mandi sekarang!',
      bahagia: 'Sedih berat... butuh pelukan dan permainan.',
      energi: 'Nyaris pingsan saking capeknya.',
      sehat: 'Kamu terlihat sakit, butuh obat dari Toko.',
    }[id] ?? 'Ada yang tidak enak badan.'
  );
}

/** Prioritas suasana hati → dipakai untuk ekspresi wajah & dialog. */
export function moodOf(stats, ctx = {}) {
  const s = stats;
  if (ctx.sleeping) return { id: 'tidur', label: 'Tidur nyenyak', tone: 'sleep', line: 'Mmm... lima menit lagi ya...' };
  if (s.sehat < 30) return { id: 'sakit', label: 'Sakit', tone: 'sick', line: 'Kepalaku pusing... butuh obat.' };
  if (s.energi < 20) return { id: 'ngantuk', label: 'Mengantuk', tone: 'tired', line: 'Matamu berat sekali.' };
  if (s.kenyang < 20) return { id: 'lapar', label: 'Lapar', tone: 'hungry', line: 'Perut berbunyi kerooon...' };
  if (s.bersih < 22) return { id: 'kotor', label: 'Kotor', tone: 'dirty', line: 'Badanmu penuh lumpur nih.' };
  if (s.bahagia < 28) return { id: 'sedih', label: 'Sedih', tone: 'sad', line: 'Sendirian terus, sepi ya.' };
  if (s.kenyang < 45 || s.bersih < 45) return { id: 'gelisah', label: 'Gelisah', tone: 'meh', line: 'Agak tidak nyaman, tapi masih oke.' };
  if (s.kenyang > 70 && s.bersih > 70 && s.bahagia > 70 && s.sehat > 70)
    return { id: 'senang', label: 'Senang', tone: 'happy', line: 'Hari ini terasa sempurna!' };
  return { id: 'biasa', label: 'Biasa saja', tone: 'ok', line: 'Ayo lakukan sesuatu yang seru.' };
}

/** Ekspresi SVG yang dipakai renderer. */
export function expressionOf(moodId) {
  switch (moodId) {
    case 'tidur':
      return 'sleep';
    case 'sakit':
      return 'sick';
    case 'ngantuk':
      return 'tired';
    case 'lapar':
      return 'hungry';
    case 'kotor':
      return 'dirty';
    case 'sedih':
      return 'sad';
    case 'senang':
      return 'joy';
    default:
      return 'calm';
  }
}

/** Rata-rata berbobot untuk skor perawatan harian (0..100). */
export function careScore(stats) {
  const w = { kenyang: 0.26, bersih: 0.24, bahagia: 0.22, energi: 0.13, sehat: 0.15 };
  let sum = 0;
  for (const [id, weight] of Object.entries(w)) sum += clamp(stats[id]) * weight;
  return Math.round(sum);
}

export function starsFor(score) {
  if (score >= 92) return 5;
  if (score >= 80) return 4;
  if (score >= 66) return 3;
  if (score >= 45) return 2;
  return 1;
}

/** Hadiah koin & XP dari hasil tidur malam sesuai bintang. */
export function morningReward(stars) {
  const table = { 1: { coins: 6, xp: 10 }, 2: { coins: 14, xp: 25 }, 3: { coins: 24, xp: 45 }, 4: { coins: 38, xp: 70 }, 5: { coins: 55, xp: 100 } };
  return table[stars] ?? table[1];
}

/** Efek kumulatif dari satu aksi (makan, mandi, main...) ke status. */
export function applyDeltas(stats, deltas) {
  const next = { ...stats };
  for (const [id, raw] of Object.entries(deltas ?? {})) {
    if (!STAT_IDS.includes(id)) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    next[id] = clamp(next[id] + value);
  }
  return next;
}

/** Ringkasan angka untuk tooltip/log. */
export function statsSummary(stats) {
  const list = STAT_IDS.map((id) => Math.round(stats[id] ?? 0));
  const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
  const lowest = STAT_IDS[list.indexOf(Math.min(...list))];
  return { avg, lowest, values: Object.fromEntries(STAT_IDS.map((id, i) => [id, list[i]])) };
}
