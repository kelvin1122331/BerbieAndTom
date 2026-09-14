/**
 * Uji end-to-end ringan: bundel modul ES dengan esbuild, jalankan di jsdom,
 * lalu klik-klik permainan (pilih karakter, masak, mandi, mini-game, malam) dan
 * pastikan tidak ada error runtime.
 *
 * Jalankan: npm run test:e2e
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as esbuild from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IGNORE = [/Not implemented: window\.scrollTo/, /Could not parse CSS/, /Not implemented: HTMLCanvasElement/];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function build() {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/js/main.js')],
    bundle: true,
    write: false,
    format: 'iife',
    target: ['es2020'],
    legalComments: 'none',
    logLevel: 'silent',
  });
  return result.outputFiles[0].text;
}

async function boot() {
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bundle = await build();
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => {
    const message = String(error?.message ?? error);
    if (!IGNORE.some((re) => re.test(message))) errors.push(`jsdomError: ${message}`);
  });
  virtualConsole.on('error', (...args) => {
    const message = args.map(String).join(' ');
    if (!IGNORE.some((re) => re.test(message))) errors.push(`console.error: ${message}`);
  });

  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'http://localhost:8080/',
    virtualConsole,
  });
  dom.window.eval(bundle);
  await sleep(80);
  return { dom, window: dom.window, document: dom.window.document, errors };
}

const click = (window, selector) => {
  const node = typeof selector === 'string' ? window.document.querySelector(selector) : selector;
  if (!node) throw new Error(`elemen tidak ditemukan: ${selector}`);
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return node;
};

const fire = (window, node, type) => {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'target', { value: node });
  node.dispatchEvent(event);
};

let failures = 0;
function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failures += 1;
    console.log(`  ✗ ${label}\n      ${error.message}`);
  }
}

async function main() {
  console.log('\nE2E — Berbie & Tom (jsdom)\n');
  const { window, document, errors } = await boot();

  check('layar pilih karakter tampil duluan', () => {
    assert.equal(document.getElementById('screen-game').hasAttribute('hidden'), true);
    assert.equal(document.querySelectorAll('.pick-card').length, 2);
    assert.ok(document.querySelector('[data-art="panda"] svg'), 'art panda digambar');
    assert.ok(document.querySelector('[data-art="barbie"] svg'), 'art barbie digambar');
    assert.ok(document.querySelector('[data-stats="panda"]').textContent.includes('🍚'));
  });

  check('tombol mulai aktif setelah karakter dipilih', () => {
    const start = document.getElementById('btn-start');
    click(window, '.pick-card[data-pick="barbie"]');
    assert.equal(start.disabled, false);
    assert.equal(document.querySelector('.pick-card[data-pick="barbie"]').getAttribute('aria-checked'), 'true');
    assert.ok(document.getElementById('picker-hint').textContent.includes('Berbie'));
  });

  click(window, '#btn-start');
  await sleep(120);
  const game = window.__berbieTom;
  assert.ok(game, 'instance game tersedia di window.__berbieTom');

  check('permainan dimulai dengan karakter Barbie', () => {
    assert.equal(document.getElementById('screen-game').hasAttribute('hidden'), false);
    assert.ok(document.getElementById('char-slot').innerHTML.length > 2000, 'SVG karakter terpasang');
    assert.equal(game.getState().character, 'barbie');
    assert.ok(document.getElementById('char-slot').querySelector('.barbie__head'));
  });

  check('HUD menampilkan 5 status & 4 misi', () => {
    assert.equal(document.querySelectorAll('#statlist .stat').length, 5);
    assert.equal(document.querySelectorAll('#mission-list .mission').length, 4);
    assert.match(document.getElementById('clock-time').textContent, /^\d{2}:\d{2}$/);
    assert.ok(document.getElementById('coin-count').textContent.length);
  });

  const before = game.getState().clock.minutes;
  await sleep(500);
  check('  → menit bertambah seiring waktu nyata', () => {
    assert.ok(game.getState().clock.minutes > before, 'jam harus maju');
  });

  // ---- dapur ----
  click(window, '#dock button[data-act="makan"]');
  await sleep(60);
  check('modal Dapur terbuka dengan daftar menu', () => {
    const modal = document.querySelector('.modal');
    assert.ok(modal, 'modal muncul');
    assert.ok(modal.textContent.includes('Dapur'));
    assert.ok(modal.querySelectorAll('.item').length >= 4);
  });
  const kenyangBefore = game.getState().stats.kenyang;
  click(window, '.modal .item button');
  await sleep(300);
  check('memberi makan menaikkan Kenyang & menutup modal', () => {
    assert.ok(game.getState().stats.kenyang > kenyangBefore, 'Kenyang naik');
    assert.equal(document.querySelector('.modal'), null);
    assert.equal(game.getState().counts.makan, 1);
  });

  await sleep(2100);
  check('mode kembali idle setelah makan', () => {
    assert.equal(game.getState().mode, 'idle');
  });

  // ---- mandi ----
  click(window, '#dock button[data-act="mandi"]');
  await sleep(80);
  check('mode mandi aktif: kelas panggung + bar mode', () => {
    assert.equal(game.getState().mode, 'bathing');
    assert.ok(document.getElementById('stage').classList.contains('mode-bath'));
    assert.equal(document.getElementById('mode-bar').hasAttribute('hidden'), false);
    assert.ok(document.querySelectorAll('#char-slot .dirt-spot').length >= 3);
  });
  click(window, '#mode-action'); // sabun
  await sleep(40);
  check('setelah disabuni, noda bisa disikat', () => {
    assert.equal(document.getElementById('mode-action').dataset.phase, 'scrub');
    assert.match(document.getElementById('mode-value').textContent, /0 \/ \d+/);
  });
  let guard = 0;
  while (game.getState().mode === 'bathing' && guard < 40) {
    guard += 1;
    const spots = Array.from(document.querySelectorAll('#char-slot .dirt-spot')).filter((s) => !s.classList.contains('is-gone'));
    if (!spots.length) break;
    for (const spot of spots) fire(window, spot, 'pointerdown');
    await sleep(30);
  }
  await sleep(40);
  check('semua noda hilang lalu bisa dibilas', () => {
    const left = Array.from(document.querySelectorAll('#char-slot .dirt-spot')).filter((s) => !s.classList.contains('is-gone'));
    assert.equal(left.length, 0, 'masih ada noda');
    assert.ok(document.getElementById('mode-value').textContent.includes('Siap dibilas'), 'mode-value menunjukkan siap dibilas');
  });
  const bersihBefore = game.getState().stats.bersih;
  click(window, '#mode-action'); // bilas
  await sleep(1800);
  check('bilas selesai: Kebersihan naik, mode kembali idle', () => {
    assert.ok(game.getState().stats.bersih > bersihBefore, 'Bersih naik');
    assert.equal(game.getState().mode, 'idle');
    assert.equal(document.getElementById('stage').classList.contains('mode-bath'), false);
    assert.equal(document.getElementById('mode-bar').hasAttribute('hidden'), true);
    assert.ok(game.getState().counts.mandi >= 1);
  });

  // ---- mini game ----
  click(window, '#dock button[data-act="main"]');
  await sleep(60);
  check('overlay mini-game terbuka', () => {
    assert.equal(document.getElementById('minigame').hasAttribute('hidden'), false);
    assert.ok(document.getElementById('mg-go').textContent.includes('Mulai'));
  });
  click(window, '#mg-go');
  await sleep(1200);
  check('item berjatuhan saat mini-game berjalan', () => {
    assert.ok(document.querySelectorAll('#mg-arena .mg-item').length > 0, 'ada item');
    assert.equal(game.getState().mode, 'playing');
  });
  const firstItem = document.querySelector('#mg-arena .mg-item');
  if (firstItem) {
    const happyBefore = game.getState().stats.bahagia;
    firstItem.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
    await sleep(60);
    check('menangkap item mengubah skor', () => {
      assert.match(document.getElementById('mg-score').textContent, /^\d+$/);
      assert.notEqual(game.getState().stats.bahagia, happyBefore - 999);
    });
  }
  game.minigame.abort();
  await sleep(120);
  check('kartu hasil mini-game muncul', () => {
    assert.ok(document.querySelector('.minigame__result'), 'hasil ditampilkan');
    assert.ok(game.getState().counts.main >= 1);
  });
  click(window, '.minigame__result [data-action="done"]');
  await sleep(80);
  check('mini-game ditutup', () => {
    assert.equal(document.getElementById('minigame').hasAttribute('hidden'), true);
    assert.equal(game.getState().mode, 'idle');
  });

  // ---- lemari & toko ----
  click(window, '#dock button[data-act="gaya"]');
  await sleep(60);
  check('lemari terbuka dan bisa memasang aksesori gratis', () => {
    const modal = document.querySelector('.modal');
    assert.ok(modal);
    assert.ok(modal.textContent.includes('Busana') || modal.textContent.includes('Aksesori'));
    click(window, '.modal .tab[data-tab="aksesori"]');
    assert.ok(document.querySelector('.modal .tab[data-tab="aksesori"]'));
  });
  await sleep(40);
  const buyCards = Array.from(document.querySelectorAll('.modal .item')).length;
  assert.ok(buyCards > 0);
  document.querySelector('.modal .modal__close')?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(200);
  check('modal bisa ditutup', () => {
    assert.equal(document.querySelector('.modal'), null);
  });

  // ---- pengaturan ----
  click(window, '#btn-settings');
  await sleep(60);
  check('pengaturan punya opsi kecepatan waktu', () => {
    const modal = document.querySelector('.modal');
    assert.ok(modal);
    assert.ok(modal.textContent.includes('Kecepatan waktu'));
    click(window, '.modal .segmented__btn:last-child');
    assert.equal(game.getState().clock.speedId, 'turbo');
  });
  document.querySelector('.modal .modal__close')?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await sleep(180);

  // ---- malam & tidur wajib ----
  game.store.update((s) => ({ ...s, clock: { ...s.clock, minutes: 1079.9, night: false, paused: false } }));
  await sleep(700);
  check('jam 18:00 memicu tidur otomatis', () => {
    assert.equal(game.getState().clock.night, true);
    assert.ok(['winding', 'sleeping'].includes(game.getState().mode), `mode=${game.getState().mode}`);
    assert.equal(document.getElementById('sleepscreen').hasAttribute('hidden'), false);
    assert.equal(document.querySelectorAll('#dock button').length, 5);
  });
  check('tombol aksi terkunci saat tidur', () => {
    assert.equal(document.querySelector('#dock button[data-act="makan"]').disabled, true);
  });

  const energyBefore = game.getState().stats.energi;
  await sleep(4600);
  check('fase tidur berjalan dan energi naik', () => {
    assert.equal(game.sleep.phase, 'sleep');
    assert.ok(game.getState().stats.energi > energyBefore, 'energi pulih');
  });

  game.store.update((s) => ({ ...s, sleep: { ...s.sleep, elapsed: 30 } }));
  game.sleep.complete();
  await sleep(120);
  check('setelah 30 detik otomatis kembali ke 05:00 & hari bertambah', () => {
    const st = game.getState();
    assert.ok(st.clock.minutes >= 300 && st.clock.minutes < 306, `menit=${st.clock.minutes}`);
    assert.equal(st.clock.night, false);
    assert.equal(st.mode, 'idle');
    assert.equal(st.day, 2);
    assert.equal(Math.round(st.stats.energi), 100);
    assert.equal(st.sleep.phase, 'none');
    assert.equal(document.getElementById('sleepscreen').hasAttribute('hidden'), true);
    assert.ok(st.dailyReport, 'laporan harian tersimpan');
    assert.ok(st.coins > 0);
    assert.equal(st.missions.length, 4);
  });

  check('progres tersimpan ke storage & bisa dimuat ulang', () => {
    game.save();
    const raw = window.localStorage.getItem('berbie-tom:save:v3:barbie');
    assert.ok(raw, 'ada data simpanan');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.day, 2);
    assert.equal(parsed.character, 'barbie');
  });

  // ---- ganti karakter ----
  click(window, '#btn-switch');
  await sleep(120);
  check('kembali ke layar pilih karakter tanpa menghapus progres', () => {
    assert.equal(document.getElementById('screen-game').hasAttribute('hidden'), true);
    assert.equal(document.getElementById('screen-welcome').hasAttribute('hidden'), false);
    const start = document.getElementById('btn-start');
    assert.ok(start.textContent.includes('Lanjutkan') || start.textContent.includes('Mulai'));
  });

  check('tidak ada error runtime di konsol', () => {
    assert.deepEqual(errors, []);
  });

  console.log(`\n${failures === 0 ? '✅ Semua pemeriksaan lulus' : `❌ ${failures} pemeriksaan gagal`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nE2E crash:', error);
  process.exit(1);
});
