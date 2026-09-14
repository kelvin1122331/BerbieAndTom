/**
 * Misi harian (murni).
 * Model: tiap misi punya `action` yang dicocokkan dengan aksi pemain (makan, minum, mandi, main, gaya, tidur),
 * atau `check` berupa fungsi kondisi yang dievaluasi saat selesai hari.
 */

export const MISSION_TEMPLATES = [
  {
    id: 'makan',
    action: 'makan',
    icon: '🍱',
    base: 2,
    max: 4,
    step: 1,
    reward: { coins: 12, xp: 30 },
    label: (n) => (n > 1 ? `Beri makan ${n} kali` : 'Beri makan 1 kali'),
    desc: 'Isi perut supaya status Kenyang selalu aman.',
  },
  {
    id: 'mandi',
    action: 'mandi',
    icon: '🛁',
    base: 1,
    max: 1,
    step: 1,
    reward: { coins: 14, xp: 35 },
    label: () => 'Mandi sampai kinclong',
    desc: 'Selesaikan satu sesi mandi: bersihkan semua noda lalu bilas.',
  },
  {
    id: 'main',
    action: 'main',
    icon: '🎈',
    base: 1,
    max: 3,
    step: 1,
    reward: { coins: 10, xp: 25 },
    label: (n) => (n > 1 ? `Menang mini-game ${n} kali` : 'Main 1 mini-game'),
    desc: 'Kumpulkan 8 item atau lebih dalam satu sesi bermain.',
  },
  {
    id: 'minum',
    action: 'minum',
    icon: '🥤',
    base: 2,
    max: 3,
    step: 1,
    reward: { coins: 9, xp: 22 },
    label: (n) => (n > 1 ? `Beri minum ${n} kali` : 'Beri minum 1 kali'),
    desc: 'Cegah dehidrasi, terutama saat matahari terik.',
  },
  {
    id: 'tidur',
    action: 'tidur',
    icon: '🌙',
    base: 1,
    max: 1,
    step: 1,
    reward: { coins: 15, xp: 40 },
    label: () => 'Tidur tepat waktu (jam 18:00)',
    desc: 'Begitu malam tiba, temani tidur sampai 30 detik.',
  },
  {
    id: 'gaya',
    action: 'gaya',
    icon: '🎀',
    base: 1,
    max: 1,
    step: 1,
    reward: { coins: 8, xp: 18 },
    label: () => 'Ganti 1 busana / aksesori',
    desc: 'Buka lemari dan pilih gaya baru hari ini.',
  },
  {
    id: 'rawat',
    action: 'rawat',
    icon: '🌿',
    base: 1,
    max: 1,
    step: 1,
    reward: { coins: 18, xp: 45 },
    label: () => 'Tidur dengan Sehat di atas 80',
    desc: 'Obati atau beri makanan sehat sebelum jam tidur.',
  },
  {
    id: 'belanja',
    action: 'belanja',
    icon: '🛍️',
    base: 1,
    max: 1,
    step: 1,
    reward: { coins: 6, xp: 15 },
    label: () => 'Beli 1 item di toko',
    desc: 'Tukar koin hasil perawatan dengan item baru.',
  },
];

const BY_ID = new Map(MISSION_TEMPLATES.map((m) => [m.id, m]));

/** Buat set misi untuk satu hari (deterministik berdasar hari + karakter). */
export function buildDailyMissions(dayIndex = 1, seed = '', level = 1) {
  const rng = mulberry32(hashString(`${seed}::${dayIndex}`));
  const fixedIds = ['makan', 'mandi', 'tidur'];
  const fixed = fixedIds.map((id) => BY_ID.get(id));
  const others = MISSION_TEMPLATES.filter((m) => !fixedIds.includes(m.id));
  for (let i = others.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const picked = [...fixed, ...others.slice(0, 1)];
  const extra = Math.floor(Math.max(0, level - 1) / 5);

  return picked.map((tpl) => {
    const target = Math.min(tpl.max, tpl.base + (tpl.id === 'makan' || tpl.id === 'main' || tpl.id === 'minum' ? extra : 0));
    return makeMission(tpl, target, extra);
  });
}

function makeMission(tpl, target, extra) {
  return {
    id: tpl.id,
    action: tpl.action,
    icon: tpl.icon,
    label: tpl.label(target),
    desc: tpl.desc,
    target,
    progress: 0,
    done: false,
    reward: { coins: tpl.reward.coins + extra * 3, xp: tpl.reward.xp + extra * 8 },
  };
}

/**
 * Catat sebuah aksi. Mengembalikan { missions, completed }.
 * `completed` berisi misi yang baru saja selesai (untuk memberi hadiah).
 */
export function recordAction(missions, action, amount = 1) {
  const completed = [];
  const next = (missions ?? []).map((m) => {
    if (m.action !== action || m.done) return m;
    const progress = Math.min(m.target, m.progress + Math.max(0, amount));
    const updated = { ...m, progress, done: progress >= m.target };
    if (updated.done) completed.push(updated);
    return updated;
  });
  return { missions: next, completed };
}

/** Evaluasi misi berbasis kondisi saat hari berakhir (mis. Sehat > 80). */
export function evaluateMissions(missions, stats) {
  const completed = [];
  const next = (missions ?? []).map((m) => {
    if (m.done) return m;
    let pass = false;
    if (m.id === 'rawat') pass = Number(stats?.sehat) > 80;
    if (m.id === 'main') pass = false; // sudah lewat skor mini-game
    if (pass) {
      const updated = { ...m, progress: m.target, done: true };
      completed.push(updated);
      return updated;
    }
    return m;
  });
  return { missions: next, completed };
}

export function missionsSummary(missions) {
  const total = (missions ?? []).length;
  const done = (missions ?? []).filter((m) => m.done).length;
  return { total, done, allDone: total > 0 && done === total, ratio: total ? done / total : 0 };
}

export function missionById(missions, id) {
  return (missions ?? []).find((m) => m.id === id) ?? null;
}

export function templateById(id) {
  return BY_ID.get(id) ?? null;
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text).length; i += 1) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
