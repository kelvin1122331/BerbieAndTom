/**
 * Mini-game "Tangkap": item berjatuhan, ketuk yang baik, hindari yang hitam.
 * Berjalan 20 detik. Skor menambah Kebahagiaan + koin (dengan penurunan hasil
 * kalau dimainkan berkali-kali dalam satu hari supaya tidak exploit).
 */

import { el, setText, setHidden } from '../ui/dom.js';

const DURATION = 20;
const GOOD = {
  panda: ['🎋', '💖', '⭐', '🍎'],
  barbie: ['💖', '👠', '⭐', '🎀'],
};
const BAD = ['💣', '🕷️', '⛈️'];

export function createMinigame({ api, toast, audio, fx }) {
  const overlay = document.getElementById('minigame');
  const arena = document.getElementById('mg-arena');
  const startCard = document.getElementById('mg-start');
  const goBtn = document.getElementById('mg-go');
  const closeBtn = document.getElementById('mg-close');
  const scoreEl = document.getElementById('mg-score');
  const timeEl = document.getElementById('mg-time');
  const bestEl = document.getElementById('mg-best');
  const titleEl = document.getElementById('mg-title');
  const descEl = document.getElementById('mg-desc');
  const labelEl = document.getElementById('mg-label');

  let running = false;
  let items = [];
  let raf = 0;
  let lastFrame = 0;
  let spawned = 0;
  let elapsed = 0;
  let score = 0;
  let misses = 0;
  let resultNode = null;
  let safeClose = null;

  function isOpen() {
    return overlay && !overlay.hasAttribute('hidden');
  }

  /** Ukuran arena dengan nilai cadangan bila layout belum tersedia. */
  function measure() {
    const box = arena ? arena.getBoundingClientRect() : null;
    return { width: box?.width || 460, height: box?.height || 320, left: box?.left || 0, top: box?.top || 0 };
  }

  function clearItems() {
    for (const node of items) node.el.remove();
    items = [];
  }

  function clearResult() {
    resultNode?.remove();
    resultNode = null;
  }

  function showStart() {
    const char = api.character();
    const isPanda = char.id === 'panda';
    setText(titleEl, isPanda ? 'Tangkap Bambu' : 'Tangkap Cinta');
    setText(
      descEl,
      `Ketuk ${GOOD[char.id].join(' ')} yang jatuh, jangan sentuh ${BAD[0]}. 20 detik, kumpulkan 8 poin untuk menuntaskan misi.`
    );
    setText(labelEl, isPanda ? 'Tom siap melompat!' : 'Berbie siap berjinjit!');
    setText(bestEl, String(api.getState().counts.bestGame ?? 0));
    setHidden(startCard, false);
    clearResult();
  }

  function open() {
    if (!overlay || isOpen()) return;
    if (!api.canAct()) {
      toast.show('Tunggu sampai aktivitas sekarang selesai.', { icon: '⏳', tone: 'bad' });
      return;
    }
    safeClose = () => close();
    document.addEventListener('keydown', safeClose);
    api.setMode('playing', { reason: 'main' });
    setHidden(overlay, false);
    showStart();
    audio.play('pop');
  }

  function close() {
    if (!overlay) return;
    if (running) stop();
    document.removeEventListener('keydown', safeClose);
    setHidden(overlay, true);
    clearItems();
    clearResult();
    api.setMode('idle');
  }

  function start() {
    if (running) return;
    clearResult();
    setHidden(startCard, true);
    running = true;
    elapsed = 0;
    score = 0;
    misses = 0;
    spawned = 0;
    lastFrame = performance.now();
    setText(scoreEl, '0');
    setText(timeEl, String(DURATION));
    goBtn.blur();
    raf = requestAnimationFrame(loop);
    api.actor.pulse('happy', 700);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    elapsed += dt;
    const left = Math.max(0, DURATION - elapsed);
    setText(timeEl, left.toFixed(0));
    const progress = Math.min(1, elapsed / DURATION);
    const box = measure();

    // spawn
    const interval = 0.5 - progress * 0.22;
    if (elapsed - spawned > interval && items.length < 14) {
      spawned = elapsed;
      spawnItem(box, progress);
    }

    for (const item of [...items]) {
      item.y += item.vy * dt;
      item.x += item.drift * dt;
      if (item.x < 6 || item.x > box.width - 6) item.drift *= -1;
      item.el.style.transform = `translate(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px) rotate(${(item.y / 8).toFixed(1)}deg)`;
      if (item.y > box.height + 30) {
        if (item.good) misses += 1;
        removeItem(item, 'is-missed');
      }
    }

    if (left <= 0) {
      stop({ finished: true });
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function spawnItem(box, progress) {
    const isGood = Math.random() > 0.24;
    const emojis = isGood ? GOOD[api.character().id] : BAD;
    const node = el('button', {
      class: `mg-item${isGood ? '' : ' mg-item--bad'}`,
      type: 'button',
      'aria-label': isGood ? 'Item baik' : 'Item berbahaya',
    }, emojis[Math.floor(Math.random() * emojis.length)]);
    const x = 24 + Math.random() * Math.max(10, box.width - 48);
    const vy = 70 + progress * 120 + Math.random() * 70;
    const item = {
      el: node,
      x,
      y: -26,
      vy,
      drift: (Math.random() - 0.5) * 46,
      good: isGood,
    };
    node.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      hit(item);
    });
    arena.append(node);
    items.push(item);
  }

  function removeItem(item, cls = '') {
    const index = items.indexOf(item);
    if (index >= 0) items.splice(index, 1);
    if (cls) item.el.classList.add(cls);
    const node = item.el;
    setTimeout(() => node.remove(), cls ? 340 : 0);
  }

  function hit(item) {
    if (!running) return;
    if (item.good) {
      score += 1;
      audio.play('pop');
      api.actor.pulse('happy', 400);
      fx.burst({ at: item.el, emojis: ['✨', '💖'], count: 3, spread: 26, duration: 700, size: 18 });
    } else {
      score = Math.max(0, score - 1);
      misses += 1;
      audio.play('error');
      item.el.classList.add('is-shake');
      fx.burst({ at: item.el, emojis: ['💢', '💨'], count: 3, spread: 30, duration: 700, size: 18 });
    }
    setText(scoreEl, String(score));
    removeItem(item, 'is-taken');
  }

  function stop({ finished = false } = {}) {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    clearItems();
    const result = api.minigameFinish({ score, misses, finished });
    showResult(result);
  }

  function showResult(result) {
    clearResult();
    const stars = result.score >= 14 ? 3 : result.score >= 8 ? 2 : result.score >= 4 ? 1 : 0;
    resultNode = el(
      'div',
      { class: 'minigame__result', role: 'dialog', 'aria-label': 'Hasil mini-game' },
      el('h3', {}, result.score >= 8 ? 'Mantap, menang!' : result.score > 0 ? 'Lumayan!' : 'Yah, kurang beruntung'),
      el('p', { class: 'minigame__stars', 'aria-hidden': 'true' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      el('p', {}, `Skor ${result.score} · Koin +${result.coins} · XP +${result.xp} · Kebahagiaan +${result.bahagia}`),
      el('p', { class: 'item__desc' }, result.note ?? ''),
      el(
        'div',
        { style: 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center' },
        el('button', { class: 'btn btn--primary', type: 'button', dataset: { action: 'again' } }, 'Main lagi'),
        el('button', { class: 'btn btn--ghost', type: 'button', dataset: { action: 'done' }, 'data-autofocus': '' }, 'Selesai')
      )
    );
    resultNode.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'again') {
        clearResult();
        start();
      } else {
        close();
      }
    });
    arena.append(resultNode);
    setText(bestEl, String(api.getState().counts.bestGame ?? 0));
    if (stars > 0) fx.confetti({ at: resultNode, count: 14 });
  }

  goBtn.addEventListener('click', start);
  closeBtn.addEventListener('click', close);

  // bila tab ditutup saat mini-game, hentikan agar tidak ada item tertinggal
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) stop();
  });

  return {
    open,
    close,
    isOpen,
    get running() {
      return running;
    },
    abort: () => (running ? stop() : isOpen() ? close() : undefined),
  };
}
