/**
 * Daftar makanan & minuman. Item `pantry` gratis dan selalu ada,
 * sisanya dibuka permanen dengan koin di Toko.
 *
 * effects: delta ke status (kenyang, bersih, bahagia, energi, sehat)
 * `key` dipakai untuk pencocokan item terbuka di state.unlocked.items
 */

export const FOODS = [
  // ---------- pantry (gratis) ----------
  {
    id: 'nasi-lauk',
    name: 'Nasi & Lauk',
    emoji: '🍚',
    kind: 'makan',
    pantry: true,
    price: 0,
    desc: 'Porsi lengkap: nasi pink, telur, dan sayur.',
    color: '#ffd9e8',
    anim: 'chew',
    crumbs: 0.7,
    effects: { kenyang: 26, bahagia: 5, bersih: -2, sehat: 5 },
  },
  {
    id: 'bubur-jagung',
    name: 'Bubur Jagung Hangat',
    emoji: '🥣',
    kind: 'makan',
    pantry: true,
    price: 0,
    desc: 'Lembut di perut, bagus untuk yang sedang tidak enak badan.',
    color: '#ffe9b8',
    anim: 'spoon',
    crumbs: 0.3,
    effects: { kenyang: 20, bahagia: 3, bersih: -1, sehat: 9 },
  },
  {
    id: 'apel-pink',
    name: 'Apel Pink',
    emoji: '🍎',
    kind: 'makan',
    pantry: true,
    price: 0,
    desc: 'Kres-kres, segar, dan bikin gigi bersih.',
    color: '#ff9ec4',
    anim: 'chomp',
    crumbs: 0.25,
    effects: { kenyang: 12, bahagia: 5, bersih: -1, sehat: 10 },
  },
  {
    id: 'sayur-hijau',
    name: 'Sayur Hijau',
    emoji: '🥬',
    kind: 'makan',
    pantry: true,
    price: 0,
    desc: 'Tidak terlalu enak, tapi daya tahan tubuh naik jauh.',
    color: '#b7f0c8',
    anim: 'chew',
    crumbs: 0.2,
    effects: { kenyang: 10, bahagia: -4, bersih: 0, sehat: 15 },
  },
  {
    id: 'roti-bakar',
    name: 'Roti Bakar Mentega',
    emoji: '🍞',
    kind: 'makan',
    pantry: true,
    price: 0,
    desc: 'Cepat, empuk, bikin remah di mana-mana.',
    color: '#ffd9a8',
    anim: 'chew',
    crumbs: 0.9,
    effects: { kenyang: 18, bahagia: 6, bersih: -3, sehat: 1 },
  },
  {
    id: 'air-putih',
    name: 'Air Putih',
    emoji: '💧',
    kind: 'minum',
    pantry: true,
    price: 0,
    desc: 'Minum rutin bikin badan segar dan tidak pusing.',
    color: '#bfe9ff',
    anim: 'sip',
    crumbs: 0,
    effects: { kenyang: 5, bahagia: 1, energi: 4, sehat: 7 },
  },
  // ---------- toko ----------
  {
    id: 'bambu-emas',
    name: 'Bambu Emas Renyah',
    emoji: '🎋',
    kind: 'makan',
    pantry: false,
    price: 34,
    desc: 'Menu spesial: renyah, wangi, favorit panda sejati.',
    color: '#9ff0c0',
    anim: 'chomp',
    crumbs: 0.4,
    effects: { kenyang: 34, bahagia: 18, bersih: -2, sehat: 9 },
  },
  {
    id: 'kue-stroberi',
    name: 'Kue Stroberi',
    emoji: '🍰',
    kind: 'makan',
    pantry: false,
    price: 26,
    desc: 'Lapisan pink, manis, dan bikin bahagia seketika.',
    color: '#ffb6d5',
    anim: 'spoon',
    crumbs: 1,
    effects: { kenyang: 16, bahagia: 24, bersih: -7, sehat: -4 },
  },
  {
    id: 'salad-berry',
    name: 'Salad Berry',
    emoji: '🥗',
    kind: 'makan',
    pantry: false,
    price: 24,
    desc: 'Sehat dan cantik — porsi pas untuk si boneka.',
    color: '#d8f7c9',
    anim: 'fork',
    crumbs: 0.2,
    effects: { kenyang: 14, bahagia: 9, bersih: -1, sehat: 17 },
  },
  {
    id: 'jus-lemon',
    name: 'Jus Lemon Madu',
    emoji: '🍹',
    kind: 'minum',
    pantry: false,
    price: 18,
    desc: 'Asam manis, vitamin C naik, tenggorokan lega.',
    color: '#ffe98a',
    anim: 'sip',
    crumbs: 0,
    effects: { kenyang: 8, bahagia: 9, energi: 7, sehat: 11 },
  },
  {
    id: 'susu-hangat',
    name: 'Susu Hangat',
    emoji: '🥛',
    kind: 'minum',
    pantry: false,
    price: 16,
    desc: 'Enak diminum sebelum tidur, bikin nyenyak.',
    color: '#f2f6ff',
    anim: 'sip',
    crumbs: 0,
    effects: { kenyang: 10, bahagia: 7, energi: 5, sehat: 9 },
  },
  {
    id: 'smoothie-berry',
    name: 'Smoothie Berry',
    emoji: '🍓',
    kind: 'minum',
    pantry: false,
    price: 22,
    desc: 'Dingin, kental, wajib diseruput cepat sebelum meleleh.',
    color: '#ff8fc7',
    anim: 'sip',
    crumbs: 0.3,
    effects: { kenyang: 13, bahagia: 15, bersih: -3, energi: 6, sehat: 10 },
  },
  {
    id: 'soda-berry',
    name: 'Soda Manis',
    emoji: '🥤',
    kind: 'minum',
    pantry: false,
    price: 14,
    desc: 'Bersenang-senang sesaat, tapi gula berlebih bikin cepat kotor.',
    color: '#ff7ae0',
    anim: 'fizz',
    crumbs: 0,
    effects: { kenyang: 6, bahagia: 16, energi: 10, bersih: -6, sehat: -7 },
  },
  {
    id: 'kopi-hitam',
    name: 'Kopi Hitam',
    emoji: '☕',
    kind: 'minum',
    pantry: false,
    price: 15,
    desc: 'Bikin melek sebentar, tapi nanti malam susah tidur.',
    color: '#4a3b36',
    anim: 'sip',
    crumbs: 0,
    effects: { kenyang: 2, bahagia: 4, energi: 20, bersih: -1, sehat: -6 },
  },
  {
    id: 'gorengan',
    name: 'Gorengan Hangat',
    emoji: '🍟',
    kind: 'makan',
    pantry: false,
    price: 12,
    desc: 'Gurih, berminyak, dan meninggalkan bau di bulu.',
    color: '#ffcb7a',
    anim: 'chomp',
    crumbs: 0.8,
    effects: { kenyang: 22, bahagia: 11, bersih: -8, sehat: -6 },
  },
  {
    id: 'sup-obat',
    name: 'Sup Obat Hangat',
    emoji: '🍲',
    kind: 'obat',
    pantry: false,
    price: 20,
    desc: 'Pahit sedikit, tapi badan cepat pulih.',
    color: '#c9f5df',
    anim: 'spoon',
    crumbs: 0.2,
    effects: { kenyang: 7, bahagia: -5, sehat: 32 },
  },
  {
    id: 'vitamin-pink',
    name: 'Vitamin Pink',
    emoji: '💊',
    kind: 'obat',
    pantry: false,
    price: 36,
    desc: 'Dosis lengkap: sehat pulih cepat, rasa tidak enak.',
    color: '#ffc2e2',
    anim: 'swallow',
    crumbs: 0,
    effects: { kenyang: 1, bahagia: -6, sehat: 46 },
  },
  {
    id: 'kue-ultah',
    name: 'Kue Ulang Tahun Deluxe',
    emoji: '🎂',
    kind: 'makan',
    pantry: false,
    price: 44,
    desc: 'Mewah, berlilin, penuh cokelat. Pesta kecil di kamar.',
    color: '#ffd6ef',
    anim: 'spoon',
    crumbs: 1.2,
    effects: { kenyang: 20, bahagia: 34, bersih: -9, sehat: -5 },
  },
];

export function foodById(id) {
  return FOODS.find((f) => f.id === id) ?? null;
}

export function foodKey(id) {
  return `food:${id}`;
}

export function pantryFoods() {
  return FOODS.filter((f) => f.pantry);
}

export function shopFoods() {
  return FOODS.filter((f) => !f.pantry);
}

/** Makanan yang tersedia untuk karakter (pantry + yang sudah dibuka di toko). */
export function availableFoods(characterId, unlockedItems = []) {
  const owned = new Set(unlockedItems);
  return FOODS.filter((f) => f.pantry || owned.has(foodKey(f.id)));
}

/** Preferensi: +bonus bila favorit, -penalti bila tidak disukai. */
export function preferenceFor(character, food) {
  if (!character) return { delta: {}, tag: null };
  if (character.favorits?.includes(food.id)) {
    return { delta: { bahagia: 5, sehat: 2 }, tag: `favorit-${character.id}` };
  }
  if (character.dislikes?.includes(food.id)) {
    return { delta: { bahagia: -6, sehat: -4 }, tag: `hindari-${character.id}` };
  }
  return { delta: {}, tag: null };
}

/** Efek total (preferensi sudah dihitung) untuk satu item. */
export function foodEffects(food, character) {
  const pref = preferenceFor(character, food);
  const merged = { ...food.effects };
  for (const [key, value] of Object.entries(pref.delta)) {
    merged[key] = (merged[key] ?? 0) + value;
  }
  return { effects: merged, tag: pref.tag };
}

/** Makanan "berat" hanya boleh kalau belum terlalu kenyang. */
export function canConsume(food, stats) {
  if (food.kind === 'obat') return { ok: true };
  const kenyang = Number(stats?.kenyang ?? 0);
  if (food.kind === 'makan' && kenyang >= 95) {
    return { ok: false, reason: 'Perutnya sudah penuh sekali, nanti mual.' };
  }
  return { ok: true };
}

export function xpForFood(food) {
  if (food.kind === 'obat') return 26;
  return food.kind === 'minum' ? 9 : 14;
}
