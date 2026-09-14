/** Tips perawatan untuk panel sidebar, ticker, dan tooltip. */

export const GENERAL_TIPS = [
  'Kunci perawatan: rutin, bukan banyak. Lebih baik makan sedikit tapi 2–3 kali sehari.',
  'Mandi tidak perlu tunggu kotor — cegah supaya Kesehatan tidak turun.',
  'Menang mini-game 8 item akan menyelesaikan misi harian dengan cepat.',
  'Simpan koin untuk Bambu Emas atau Gaun Puteri, bonus bahagianya besar.',
  'Kalau Sehat di bawah 45, berikan Sup Obat sebelum jam tidur.',
  'Tidur malam selalu memulihkan Energi penuh — jangan dilewati.',
  'Kamu bisa mempercepat waktu di menu Pengaturan kalau ingin cepat berganti hari.',
  'Matahari bergerak sesuai jam game; jendela kamar berubah warna tiap fase.',
];

export const STAT_TIPS = {
  kenyang: 'Beri makan nasi, bubur, atau buah. Hindari terlalu banyak manis.',
  bersih: 'Mulai mandi, sikat semua noda, lalu bilas sampai meteran penuh.',
  bahagia: 'Ajak main mini-game, beri kue favorit, atau ganti busana baru.',
  energi: 'Energi hanya pulih total setelah tidur malam 30 detik.',
  sehat: 'Kurangi makanan cepat saji, tambah sayur/buah, dan obati bila turun.',
};

export const ONBOARDING = [
  { icon: '🎀', title: 'Pilih karakter', text: 'Ada Tom si Panda dan Berbie si Barbie. Setiap karakter punya selera dan kebiasaan berbeda.' },
  { icon: '🍱', title: 'Jaga perutnya', text: 'Status Kenyang turun sepanjang hari. Buka Dapur, pilih menu, lalu beri makan.' },
  { icon: '🫧', title: 'Mandi & gosok noda', text: 'Noda akan muncul di badan. Sikat satu per satu, jangan lupa dibilas.' },
  { icon: '🎈', title: 'Main & kumpulkan koin', text: 'Mini-game menambah Kebahagiaan dan koin untuk membuka item baru di Toko.' },
  { icon: '🌙', title: 'Tidur 30 detik', text: 'Saat jam menyentuh 18:00, karakter wajib tidur. Setelah 30 detik, hari berganti pagi lagi.' },
];

export function randomTip(pool = GENERAL_TIPS) {
  return pool[Math.floor(Math.random() * pool.length)];
}
