/**
 * Data karakter: Tom si Panda & Berbie si Barbie.
 * Termasuk kepribadian, preferensi makanan, dan dialog per situasi.
 */

export const CHARACTER_LIST = [
  {
    id: 'panda',
    name: 'Tom',
    title: 'Panda Bambu',
    subtitle: 'Santai, rakus bambu, hobi tidur',
    accent: '#ff8ec7',
    defaultName: 'Tom',
    bio: 'Panda gemuk yang tinggal di kamar pink-hitam. Setia, doyan bambu, dan dengurnya lucu sekali.',
    traits: [
      { icon: '🎋', label: 'Kesukaan', value: 'Bambu renyah & bubur hangat' },
      { icon: '🛋️', label: 'Hobi', value: 'Berguling di karpet, main tangkap' },
      { icon: '⚠️', label: 'Kelemahan', value: 'Camilan manis bikin badan berat' },
    ],
    favorits: ['bambu-emas', 'bubur-jagung', 'susu-hangat'],
    dislikes: ['soda-berry', 'kopi-hitam'],
    appetiteNote: 'Perut besar: butuh porsi lebih banyak, lebih sering.',
    statsHint: {
      kenyang: 'Cepat lapar, kasih porsi besar',
      bersih: 'Bulu lebat gampang kotor',
      bahagia: 'Ceria kalau diajak main',
      energi: 'Cepat segar setelah tidur',
      sehat: 'Kuat, tapi hindari yang manis',
    },
    startStats: { kenyang: 72, bersih: 76, bahagia: 80, energi: 92, sehat: 88 },
    sounds: { eat: 'chomp', happy: 'squeak', splash: 'splash', sleep: 'snore' },
  },
  {
    id: 'barbie',
    name: 'Berbie',
    title: 'Barbie Fashionista',
    subtitle: 'Ceria, modis, tidak bisa jauh dari cermin',
    accent: '#ff5fae',
    defaultName: 'Berbie',
    bio: 'Boneka fashionista yang rajin dan teliti. Makannya sedikit, tapi wajib cantik, wangi, dan dipuji.',
    traits: [
      { icon: '💖', label: 'Kesukaan', value: 'Kue stroberi, warna pink, pujian' },
      { icon: '🩰', label: 'Hobi', value: 'Ganti busana & dansa kecil' },
      { icon: '⚠️', label: 'Kelemahan', value: 'Kedinginan saat mandi lama' },
    ],
    favorits: ['kue-stroberi', 'salad-berry', 'jus-lemon'],
    dislikes: ['bambu-emas', 'gorengan'],
    appetiteNote: 'Porsi kecil tapi sering — camilan sehat beberapa kali sehari.',
    statsHint: {
      kenyang: 'Porsi kecil, tapi sering',
      bersih: 'Paling jaga wangi & baju',
      bahagia: 'Butuh pujian tiap hari',
      energi: 'Cepat lelah kalau begadang',
      sehat: 'Rentan kalau kurang tidur',
    },
    startStats: { kenyang: 68, bersih: 88, bahagia: 84, energi: 84, sehat: 92 },
    sounds: { eat: 'sip', happy: 'giggle', splash: 'splash', sleep: 'soft' },
  },
];

export function getCharacter(id) {
  return CHARACTER_LIST.find((c) => c.id === id) ?? CHARACTER_LIST[0];
}

export function isCharacterId(id) {
  return CHARACTER_LIST.some((c) => c.id === id);
}

/** Dialog dinamis, dipilih berdasar situasi + karakter. */
export const DIALOGUE = {
  panda: {
    pagi: ['Pagi! Perutku sudah berbunyi nih.', 'Matahari pagi, waktu terbaik buat makan bambu.'],
    siang: ['Panasss. Ada minum nggak?', 'Ayo cari tempat teduh sambil ngemil.'],
    sore: ['Sore enaknya berguling di karpet!', 'Aku masih kuat lari-lari, kok.'],
    malam: ['Udah malam ya... mata berat.', 'Lampu dimatikan ya, biar mimpinya pink.'],
    senang: ['Hore! Perut kenyang, hati senang.', 'Kamu perawat terbaik sedunia!'],
    sedih: ['Kok sepi... main yuk?', 'Aku kangen diajak main nih.'],
    lapar: ['Perut keroncongan, tolong dong 🥺', 'Bambu... bambu di mana...'],
    kotor: ['Buluku gatal semua nih.', 'Butuh sabun. Banyak sabun.'],
    sakit: ['Aduh... kepalaku pusing.', 'Kasih obat ya, nanti aku nurut.'],
    ngantuk: ['Huaaam... lima menit lagi ya.', 'Bulu mataku sudah mau tertutup.'],
    makan: ['Nyam nyam nyam!', 'Ini favoritku!'],
    minum: ['Sruput~ segar!', 'Haaah, makasih ya.'],
    mandi: ['Busanya banyak sekali!', 'Aku kinclong kayak panda baru.'],
    main: ['Dapat! Hehe.', 'Aku jago lompat tangkap!'],
    tidur: ['Zzz...', 'Mimpi bambu...'],
    bangun: ['Pagi! Badanku enteng lagi.', 'Tidur tadi nyenyak banget, makasih.'],
    beli: ['Wih, barang baru!', 'Makasih ya, aku suka.'],
    tolak: ['Sudah kenyang nih, nanti mual.', 'Tidak dulu, lagi males.'],
    bosan: ['Kerjaanmu banyak sekali, ya?', 'Aku di sini terus, lho.'],
  },
  barbie: {
    pagi: ['Selamat pagi, sayang! Rambutku rapi nggak?', 'Pagi pink, semangat pink!'],
    siang: ['Siang gini enaknya photoshoot kecil.', 'Jangan lupa minum biar kulit segar.'],
    sore: ['Sore! Ayo dansa sebentar.', 'Aku siap ganti baju, pilihkan yang cantik ya.'],
    malam: ['Waktunya perawatan malam, nih.', 'Lampu dimatikan, biar cantik di mimpi.'],
    senang: ['Hari ini aku bersinar!', 'Kamu memang yang terbaik.'],
    sedih: ['Sedih ah... temani sebentar dong.', 'Butuh pujian, satu saja cukup.'],
    lapar: ['Perut kecilku minta kue stroberi.', 'Lapar, tapi tetap harus cantik, ya.'],
    kotor: ['Gaunku kotor! Mandi sekarang, please.', 'Tidak bisa begini, aduh.'],
    sakit: ['Badanku lemas... obat dong.', 'Kayaknya tadi kedinginan deh.'],
    ngantuk: ['Mataku sudah sepet.', 'Boleh tidur, kan? Boleh dong.'],
    makan: ['Nyam! Manis sekali.', 'Ini sehat, kan? Kan?'],
    minum: ['Sruput~ segar dan cantik.', 'Makasih ya, sayang.'],
    mandi: ['Airnya hangat, suka!', 'Sekarang aku wangi mawar.'],
    main: ['Yes, aku menang, jelas!', 'Seru! Satu lagi, ya.'],
    tidur: ['Zzz... cantik...', 'Mimpi di panggung...'],
    bangun: ['Pagi! Aku cantik lagi sekarang.', 'Ceria! Ayo mulai hari.'],
    beli: ['Aku suka! Makasih banyak.', 'Ini bakal jadi favorit baru.'],
    tolak: ['Tidak dulu, nanti gendut, hehe.', 'Lagi nggak mau, ya.'],
    bosan: ['Kamu lama sekali, lho.', 'Aku kangen diajak ngobrol.'],
  },
};

export const PHASE_TO_DIALOGUE = { pagi: 'pagi', siang: 'siang', sore: 'sore', malam: 'malam' };

export const MOOD_TO_DIALOGUE = {
  senang: 'senang',
  biasa: 'senang',
  gelisah: 'sedih',
  sedih: 'sedih',
  lapar: 'lapar',
  kotor: 'kotor',
  sakit: 'sakit',
  ngantuk: 'ngantuk',
  tidur: 'tidur',
};

export function randomLine(characterId, key, fallback = '...') {
  const pool = DIALOGUE[characterId]?.[key];
  if (!Array.isArray(pool) || pool.length === 0) return fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}
