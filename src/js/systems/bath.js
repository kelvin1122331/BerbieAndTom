/**
 * Mode mandi: karakter pindah ke bak, sabuni, sikat semua noda, lalu bilas.
 * Noda adalah elemen SVG (.dirt-spot) di dalam grup karakter sehingga posisinya
 * selalu menempel walau panggung di-scale.
 */

import { setText, setHidden } from '../ui/dom.js';

const PHASE_TEXT = {
  prep: { label: 'Naik ke bak lalu kasih sabun', action: 'Beri sabun 🧴' },
  scrub: { label: 'Sikat nodanya sampai habis', action: 'Bilas 💦' },
  rinse: { label: 'Bilas badan...', action: 'Menunggu' },
};

export function createBath({ api, modeBar, toast, audio, fx }) {
  let active = false;
  let phase = 'prep';
  let total = 0;
  let cleaned = 0;
  let detach = null;
  let rinseTimer = 0;

  const refs = {
    bar: modeBar.bar,
    icon: modeBar.icon,
    label: modeBar.label,
    fill: modeBar.fill,
    value: modeBar.value,
    action: modeBar.action,
    exit: modeBar.exit,
  };

  function setPhase(next) {
    phase = next;
    const meta = PHASE_TEXT[next] ?? PHASE_TEXT.scrub;
    setText(refs.label, meta.label);
    setText(refs.action, meta.action);
    refs.action.disabled = next === 'rinse';
    refs.action.dataset.phase = next;
    updateMeter();
  }

  function updateMeter() {
    const done = total > 0 && cleaned >= total;
    const ratio = total > 0 ? cleaned / total : 0;
    refs.fill.style.width = `${Math.round(ratio * 100)}%`;
    if (phase === 'rinse') setText(refs.value, 'Bilas...');
    else if (done) setText(refs.value, 'Siap dibilas ✨');
    else setText(refs.value, total ? `${cleaned} / ${total} noda` : 'bersih');
  }

  function popSpot(node) {
    const index = Number(node.dataset.spot);
    if (!api.actor.removeSpot(index)) return false;
    cleaned += 1;
    audio.play('scrub');
    fx.burst({
      at: node,
      emojis: ['🫧', '🧼', '✨'],
      count: 5,
      spread: 46,
      rise: 60,
      duration: 900,
      size: 20,
      kind: 'float',
    });
    updateMeter();
    if (cleaned >= total) {
      setPhase('scrub');
      api.actor.pulse('happy', 700);
      audio.play('pop');
      toast.show('Semua noda hilang! Sekarang dibilas.', { icon: '✨', tone: 'good' });
    }
    return true;
  }

  function attach() {
    const slot = api.actor.el;
    if (!slot) return;
    /** Saat disentuh, pointer terkunci ke elemen awal — jadi cari elemen di bawah jari. */
    const spotFrom = (event) => {
      const direct = event.target?.closest?.('.dirt-spot');
      if (direct || event.pointerType === 'mouse') return direct ?? null;
      if (typeof event.clientX !== 'number' || !Number.isFinite(event.clientX)) return null;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      return under?.closest?.('.dirt-spot') ?? null;
    };
    const handle = (event) => {
      if (phase !== 'scrub') return;
      const spot = spotFrom(event);
      if (!spot) return;
      popSpot(spot);
    };
    slot.addEventListener('pointerdown', handle);
    slot.addEventListener('pointermove', handle);
    slot.addEventListener('touchmove', handle, { passive: true });
    detach = () => {
      slot.removeEventListener('pointerdown', handle);
      slot.removeEventListener('pointermove', handle);
      slot.removeEventListener('touchmove', handle);
    };
  }

  function start({ force = false } = {}) {
    if (active) return false;
    const st = api.getState();
    if (!force && (!api.canAct() || st.mode === 'bathing')) {
      toast.show('Tidak bisa mandi sekarang.', { icon: '⏳', tone: 'bad' });
      return false;
    }
    active = true;
    cleaned = 0;
    const dirty = Math.round(100 - (st.stats.bersih ?? 100));
    total = Math.max(3, Math.min(api.actor.spotCount(), 2 + Math.round(dirty / 14)));
    api.actor.seedDirt(total);
    api.setMode('bathing', { reason: 'mandi' });
    api.scene.setBathing(true);
    api.scene.say(`${st.name} naik ke bak mandi...`, 2600);
    setHidden(refs.bar, false);
    refs.bar.classList.add('is-on');
    setText(refs.icon, '🛁');
    setPhase('prep');
    attach();
    audio.play('splash');
    fx.burst({ at: api.actor.el, emojis: ['💧', '🫧'], count: 7, spread: 120, duration: 1100 });
    api.log('Mulai sesi mandi', '🛁');
    return true;
  }

  function soap() {
    if (phase !== 'prep') return;
    setPhase('scrub');
    audio.play('pop');
    api.actor.pulse('happy', 600);
    fx.burst({ at: api.actor.el, emojis: ['🫧', '🧴'], count: 10, spread: 150, duration: 1400 });
    api.scene.say('Kasih sabun dulu... sekarang gosok nodanya!', 2800);
  }

  function rinse() {
    if (phase !== 'scrub') return;
    if (cleaned < total) {
      toast.show('Nodanya belum habis disikat.', { icon: '🧽', tone: 'bad' });
      return;
    }
    phase = 'rinse';
    setPhase('rinse');
    audio.play('splash');
    fx.burst({ at: api.actor.el, emojis: ['💦', '🫧', '✨'], count: 14, spread: 190, duration: 1500 });
    rinseTimer = setTimeout(finish, 1500);
  }

  function finish({ cancelled = false } = {}) {
    if (!active) return;
    clearTimeout(rinseTimer);
    const ratio = total ? cleaned / total : 0;
    api.completeBath({ ratio, cancelled });
    close();
  }

  function close() {
    active = false;
    total = 0;
    cleaned = 0;
    phase = 'prep';
    detach?.();
    detach = null;
    api.scene.setBathing(false);
    setHidden(refs.bar, true);
    refs.bar.classList.remove('is-on');
    api.actor.resetDirt();
    api.setMode('idle');
  }

  refs.action.addEventListener('click', () => {
    if (phase === 'prep') soap();
    else if (phase === 'scrub') rinse();
  });
  refs.exit.addEventListener('click', () => finish({ cancelled: true }));

  return {
    get active() {
      return active;
    },
    start,
    stop: () => finish({ cancelled: true }),
    forceStop: close,
  };
}
