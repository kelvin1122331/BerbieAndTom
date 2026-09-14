/**
 * Runtutan malam: jam 18:00 karakter wajib tidur.
 * Fase "bersiap" 4 detik (piyama, gosok gigi) lalu tidur 30 detik.
 * Semua dihitung dari timestamp supaya tetap selesai walau tab ditutup.
 */

import { el, setText, setHidden } from '../ui/dom.js';
import { SLEEP_SECONDS, WIND_DOWN_SECONDS, formatTime } from '../core/time.js';
import { STAT_LIST } from '../core/stats.js';

const RING = 327; // keliling lingkaran r=52

export function createSleep({ api, toast, audio, fx, modal }) {
  const overlay = document.getElementById('sleepscreen');
  const titleEl = document.getElementById('sleep-title');
  const subEl = document.getElementById('sleep-sub');
  const countEl = document.getElementById('sleep-count');
  const ringEl = document.getElementById('sleep-ring');
  const barsEl = document.getElementById('sleep-bars');
  const noteEl = document.getElementById('sleep-note');

  let timer = null;
  let startedAt = 0;
  let reasonLabel = 'malam tiba';
  let phase = 'off'; // off | wind | sleep
  let bars = [];
  let wakeTimer = 0;

  function isOpen() {
    return phase !== 'off';
  }

  function buildBars() {
    if (!barsEl) return;
    barsEl.innerHTML = '';
    bars = [];
    const wanted = STAT_LIST.filter((meta) => ['energi', 'kenyang', 'bersih', 'bahagia', 'sehat'].includes(meta.id));
    for (const meta of wanted) {
      const fill = el('span', { class: 'sleepbar__fill' });
      const value = el('span', { class: 'sleepbar__value' }, '0');
      const row = el(
        'div',
        { class: 'sleepbar' },
        el('span', { class: 'sleepbar__icon', 'aria-hidden': 'true' }, meta.icon),
        el('span', { class: 'sleepbar__track' }, fill),
        value
      );
      barsEl.append(row);
      bars.push({ id: meta.id, fill, value });
    }
  }

  function drawBars() {
    const stats = api.getState().stats;
    for (const bar of bars) {
      const v = Math.round(stats[bar.id] ?? 0);
      bar.fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
      setText(bar.value, String(v));
    }
  }

  function setRing(progress, secondsLeft) {
    if (ringEl) ringEl.style.strokeDashoffset = String(Math.max(0, RING * (1 - progress)));
    if (countEl) setText(countEl, String(Math.max(0, Math.ceil(secondsLeft))));
  }

  function tick() {
    if (phase === 'off') return;
    const st = api.getState();
    const elapsed = (Date.now() - startedAt) / 1000;

    if (phase === 'wind') {
      const left = Math.max(0, WIND_DOWN_SECONDS - elapsed);
      setRing(1 - left / WIND_DOWN_SECONDS, left);
      setText(
        countEl,
        left > 2.4 ? '🪥' : left > 1 ? '🧦' : '😴'
      );
      api.sleepTick('wind', Math.min(1, elapsed / WIND_DOWN_SECONDS));
      if (elapsed >= WIND_DOWN_SECONDS) {
        phase = 'sleep';
        startedAt = Date.now();
        st.sleep.phase = 'sleep';
        st.sleep.elapsed = 0;
        api.actor?.hold('sleeping', true);
        api.scene.setSleeping(true);
        setText(titleEl, `${st.name} sedang tidur`);
        setText(subEl, `Tidur ${SLEEP_SECONDS} detik sampai jam 05:00. Energi dipulihkan penuh.`);
        if (noteEl) setText(noteEl, 'Kamu boleh melihat-lihat, tapi aksi terkunci sampai pagi.');
        audio.play('night');
      }
      return;
    }

    const left = Math.max(0, SLEEP_SECONDS - elapsed);
    const t = Math.min(1, elapsed / SLEEP_SECONDS);
    setRing(t, left);
    setText(countEl, String(Math.ceil(left)));
    api.sleepTick('sleep', t);
    drawBars();
    if (elapsed >= SLEEP_SECONDS) complete();
  }

  function begin({ label = 'malam tiba' } = {}) {
    if (phase !== 'off') return;
    phase = 'wind';
    startedAt = Date.now();
    reasonLabel = label;
    api.beginSleep();
    buildBars();
    drawBars();
    if (overlay) setHidden(overlay, false);
    const st = api.getState();
    setText(titleEl, `Sudah ${formatTime(st.clock.minutes)} — waktunya tidur`);
    setText(subEl, `${st.name} menguap karena ${reasonLabel}. Bersiap dulu: pakai piyama, gosok gigi, lalu tidur ${SLEEP_SECONDS} detik.`);
    if (noteEl) setText(noteEl, 'Jangan ditutup halamannya, ya. Setelah 30 detik otomatis pagi lagi.');
    setRing(0, WIND_DOWN_SECONDS);
    timer = setInterval(tick, 100);
    tick();
    audio.play('chime');
  }

  function complete() {
    if (phase === 'off') return;
    clearInterval(timer);
    timer = null;
    phase = 'off';
    setRing(1, 0);
    const info = api.completeSleep();
    api.actor?.hold('sleeping', false);
    api.scene.setSleeping(false);
    if (overlay) {
      setHidden(overlay, true);
    }
    if (info) {
      toast.show(
        `Pagi datang! ${info.name} segar kembali — skor ${info.score}, ${'★'.repeat(info.stars)}, +${info.coins} koin.`,
        { icon: '🌅', tone: 'good', ttl: 6000 }
      );
      fx.confetti({ count: 20 });
    }
    audio.play('morning');
    // kembalikan fokus ke aksi supaya jelas hari baru dimulai
    clearTimeout(wakeTimer);
    wakeTimer = setTimeout(() => {
      api.scene.say(info?.greeting ?? 'Selamat pagi!', 3200);
    }, 520);
  }

  /** Bangun paksa (dipakai hanya saat reset/hapus data). */
  function hardStop() {
    clearInterval(timer);
    timer = null;
    phase = 'off';
    api.actor?.hold('sleeping', false);
    api.scene.setSleeping(false);
    if (overlay) setHidden(overlay, true);
    modal?.closeAll?.();
  }

  return {
    begin,
    complete,
    isOpen,
    hardStop,
    get phase() {
      return phase;
    },
  };
}
