# Berbie & Tom — permainan merawat karakter 🎀

Simulasi merawat karakter ala Tamagotchi dengan dua pilihan tokoh: **Tom si Panda Bambu** dan
**Berbie si Barbie Fashionista**. Tema warna **pink & hitam**, UI responsif, jam kamar berjalan
**realtime** (pagi → siang → sore → malam), dan ketika malam tiba karakter **wajib tidur 30 detik**
lalu otomatis kembali ke pagi.

## Menjalankan

```bash
npm start          # node server.js → http://localhost:8080
```

Server statis minim dependensi (tanpa framework, tanpa build step). Kalau tidak ingin memakai
`server.js`, buka folder ini lewat web server apa pun — game memakai ES module sehingga tidak bisa
dijalankan lewat `file://`.

```bash
npm test           # 36 unit test logika inti (node --test)
npm run test:e2e   # uji end-to-end: bundel + jsdom, klik semua alur, cek 0 error konsol
```

## Cara bermain

1. **Pilih karakter** — wajib di layar awal. Tom dan Berbie punya status awal, selera makanan,
   dan dialog berbeda. Boleh ganti nama panggilan (maks. 14 huruf).
2. **Beri makan & minum** (tombol 1 / `Dapur`) — status Kenyang turun terus. Menu favorit memberi
   bonus Bahagia, makanan yang tidak disukai memberi penalti. Remah-remah membuat Kebersihan turun.
3. **Mandi** (tombol 2) — karakter pindah ke bak. Beri sabun, sikat semua noda (klik/seret nodanya),
   lalu bilas. Noda yang tersisa membuat hasil mandi hanya sebagian.
4. **Bermain** (tombol 3) — mini-game menangkap item selama 20 detik: menambah Kebahagiaan & koin,
   mengurangi Energi. Hadiah menyusut jika dimainkan berulang pada hari yang sama.
5. **Gaya & Toko** (tombol 4) — 4+ busana, 4 aksesori, dan 2 tema kamar (Pink Manis / Noir Elegan).
   Barang dibeli permanen dengan koin.
6. **Tidur** (tombol 5) — aktif saat jam kamar menyentuh 18:00. Tidur berlangsung **30 detik**
   (fase tidur) setelah 4 detik bersiap; seluruh aksi terkunci, energi pulih, lalu jam otomatis
   kembali ke **05:00** dan hari bertambah.

Pintasan: `1`–`5` aksi, `spasi` jeda/lanjut waktu kamar, `H` bantuan, `Esc` tutup jendela.

## Sistem jam

| nyata | game (kecepatan normal) |
| --- | --- |
| 1 detik | 4 menit |
| ±3 menit 15 detik | 1 hari aktif (05:00 → 18:00) |
| 30 detik | durasi tidur wajib |

Kecepatan bisa diubah di Pengaturan (0,5× / 1× / 2× / 4×). Langit di jendela, posisi matahari/bulan,
gorden, lampu, dan warna ruangan ikut berubah per fase. Progres tersimpan otomatis per karakter
di `localStorage`, jadi menutup tab tidak menghilangkan apa pun (waktu tidak berjalan saat tab ditutup).

## Struktur berkas

```
index.html                  layar pilih karakter, panggung SVG (kamar), HUD, modal
assets/favicon.svg
src/styles/
  tokens.css                design token + tema pink/noir
  base.css                  reset, tombol, kartu, modal, toast
  character.css             ekspresi wajah, animasi idle, busana/aksesori, noda
  scene.css                 langit, matahari/bulan, perabot, partikel
  game.css                  tata letak, dock, sidebar, mini-game, responsif
src/js/
  core/       time, stats, missions, economy, state, store, persistence   (murni, ter-unit-test)
  data/       characters, foods, cosmetics, tips
  render/     panda.js, barbie.js, character.js, actor.js, hud.js, scene.js
  ui/         dom.js, modal.js, toast.js, fx.js, audio.js, panels.js
  systems/    bath.js, minigame.js, sleep.js
  game.js                   mesin: loop rAF, aksi, hadiah, autosave
  main.js                   bootstrap & wiring keyboard/tombol
server.js                  server statis pengembangan
tests/                      unit test + runners e2e (jsdom + esbuild)
```

## Catatan teknis

- Karakter digambar penuh sebagai SVG (bukan gambar jadi) sehingga tajam di semua ukuran dan bisa
  berkedip, mengunyah, ngiler bubble, menggigil, berkilau, dan mendengur.
- Efek suara dibuat dengan WebAudio (tanpa file audio) dan baru aktif setelah interaksi pertama.
- Semua data dari `localStorage` dibersihkan lewat `sanitizeState()`; save rusak/versi lama
  otomatis mulai dari awal, bukan error.
- Menghormati `prefers-reduced-motion`, semua tombol punya label/`aria`, dialog mengunci fokus,
  dan partikel dimatikan saat mode gerak minimal.
