/**
 * Busana, aksesori, dan tema kamar.
 * `part` = nama kelompok <g data-*> pada SVG karakter; renderer menampilkan yang aktif.
 */

export const OUTFITS = [
  // ---- Tom si Panda ----
  {
    id: 'bulu-alami',
    character: 'panda',
    name: 'Bulu Alami',
    part: 'bulu-alami',
    price: 0,
    swatch: '#f7f3f6',
    desc: 'Tanpa baju, cuma bulu lembut hitam-putih. Klasik.',
  },
  {
    id: 'piyama-bintang',
    character: 'panda',
    name: 'Piyama Bintang',
    part: 'piyama-bintang',
    price: 22,
    swatch: '#7f6bd6',
    desc: 'Piyama lengan panjang bermotif bintang, bikin tidur makin nyenyak.',
  },
  {
    id: 'hoodie-pink',
    character: 'panda',
    name: 'Hoodie Pink Manis',
    part: 'hoodie-pink',
    price: 34,
    swatch: '#ff8ec7',
    desc: 'Hoodie kebesaran dengan tali serut. Favorit buat jalan-jalan sore.',
  },
  {
    id: 'setelan-hitam',
    character: 'panda',
    name: 'Setelan Hitam Resmi',
    part: 'setelan-hitam',
    price: 58,
    swatch: '#241d28',
    desc: 'Jaket hitam, dasi kupu-kupu pink. Siap datang ke pesta.',
  },
  // ---- Berbie si Barbie ----
  {
    id: 'gaun-pink',
    character: 'barbie',
    name: 'Gaun Pink Klasik',
    part: 'gaun-pink',
    price: 0,
    swatch: '#ff5fae',
    desc: 'Gaun tulle berlapis dengan sabuk hati — tanda tangan gaya Berbie.',
  },
  {
    id: 'gaun-hitam',
    character: 'barbie',
    name: 'Gaun Hitam Elegan',
    part: 'gaun-hitam',
    price: 46,
    swatch: '#191320',
    desc: 'Gaun panjang belahan tinggi, kontras pink di bagian pinggang.',
  },
  {
    id: 'set-kasual',
    character: 'barbie',
    name: 'Set Kasual Sporty',
    part: 'set-kasual',
    price: 30,
    swatch: '#ffa7d0',
    desc: 'Kaos crop, rok pendek, dan sepatu kets — enak buat main.',
  },
  {
    id: 'gaun-puteri',
    character: 'barbie',
    name: 'Gaun Puteri + Jubah',
    part: 'gaun-puteri',
    price: 72,
    swatch: '#ffd6ef',
    desc: 'Gaun megah berjubah lembut dan pita besar di punggung.',
  },
  {
    id: 'piyama-sutra',
    character: 'barbie',
    name: 'Piyama Sutra',
    part: 'piyama-sutra',
    price: 26,
    swatch: '#c9b8ff',
    desc: 'Piyama satin lembut dengan kerah pink. Adem dipakai tidur.',
  },
];

export const ACCESSORIES = [
  // ---- Tom ----
  { id: 'pita-panda', character: 'panda', name: 'Pita Pink Kepala', part: 'pita-panda', price: 16, swatch: '#ff8ec7', desc: 'Pita besar di telinga kanan.' },
  { id: 'kacamata-panda', character: 'panda', name: 'Kacamata Hitam', part: 'kacamata-panda', price: 24, swatch: '#241d28', desc: 'Bikin panda terlihat seperti bintang film.' },
  { id: 'topi-panda', character: 'panda', name: 'Topi Bucket', part: 'topi-panda', price: 20, swatch: '#ffb3d9', desc: 'Melindungi dari matahari siang.' },
  { id: 'tas-bambu', character: 'panda', name: 'Ransel Bambu', part: 'tas-bambu', price: 30, swatch: '#9ff0c0', desc: 'Selalu ada camilan cadangan di dalamnya.' },
  // ---- Berbie ----
  { id: 'mahkota-berbie', character: 'barbie', name: 'Mahkota Kristal', part: 'mahkota-berbie', price: 52, swatch: '#ffe28a', desc: 'Kristal kecil yang memantulkan cahaya pink.' },
  { id: 'kacamata-berbie', character: 'barbie', name: 'Kacamata Fashion', part: 'kacamata-berbie', price: 22, swatch: '#ff5fae', desc: 'Bingkai cat-eye, wajib untuk jalan-jalan sore.' },
  { id: 'tas-mini', character: 'barbie', name: 'Tas Mini Hati', part: 'tas-mini', price: 18, swatch: '#ff8ec7', desc: 'Muat lipstik, cermin kecil, dan sebatang permen.' },
  { id: 'tongkat-sihir', character: 'barbie', name: 'Tongkat Bintang', part: 'tongkat-sihir', price: 36, swatch: '#ffd6ef', desc: 'Berkilau dan meninggalkan percikan bintang.' },
];

export const THEMES = [
  { id: 'pink', name: 'Kamar Pink Manis', price: 0, desc: 'Dinding rose, lantai hangat, banyak aksen pink.', swatch: '#ffb6d5' },
  { id: 'noir', name: 'Kamar Noir Elegan', price: 120, desc: 'Dinding hitam matte dengan garis pink neon.', swatch: '#241d28' },
];

export function outfitKey(id) {
  return `fit:${id}`;
}
export function accessoryKey(id) {
  return `acc:${id}`;
}
export function themeKey(id) {
  return `theme:${id}`;
}

export function outfitById(id) {
  return OUTFITS.find((o) => o.id === id) ?? null;
}
export function accessoryById(id) {
  return ACCESSORIES.find((a) => a.id === id) ?? null;
}
export function themeById(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function outfitsFor(characterId) {
  return OUTFITS.filter((o) => o.character === characterId);
}
export function accessoriesFor(characterId) {
  return ACCESSORIES.filter((a) => a.character === characterId);
}

/** Semua barang toko (busana, aksesori, tema) untuk tab "Toko" selain makanan. */
export function shopItems(characterId) {
  return [
    ...outfitsFor(characterId).map((o) => ({ ...o, kind: 'outfit', key: outfitKey(o.id), group: 'Busana', price: o.price })),
    ...accessoriesFor(characterId).map((a) => ({ ...a, kind: 'accessory', key: accessoryKey(a.id), group: 'Aksesori', price: a.price })),
    ...THEMES.filter((t) => t.id !== 'pink').map((t) => ({
      id: t.id,
      character: 'any',
      kind: 'theme',
      key: themeKey(t.id),
      group: 'Kamar',
      name: t.name,
      desc: t.desc,
      swatch: t.swatch,
      price: t.price,
    })),
  ];
}

export function itemByKey(key) {
  return shopItems('panda').concat(shopItems('barbie')).find((i) => i.key === key) ?? null;
}
