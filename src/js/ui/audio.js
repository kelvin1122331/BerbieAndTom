/**
 * Efek suara ringan yang dibangkitkan WebAudio (tanpa file eksternal).
 * Semua panggilan aman: jika browser tidak mendukung atau audio belum diaktifkan pengguna,
 * fungsi hanya mengembalikan false.
 */

const TONES = {
  click: [{ f: 660, d: 0.05, type: 'triangle', g: 0.12 }],
  soft: [{ f: 420, d: 0.07, type: 'sine', g: 0.1 }],
  pop: [
    { f: 520, d: 0.05, type: 'triangle', g: 0.14 },
    { f: 900, d: 0.06, type: 'triangle', g: 0.1, at: 0.04 },
  ],
  eat: [
    { f: 240, d: 0.08, type: 'sawtooth', g: 0.08 },
    { f: 180, d: 0.09, type: 'sawtooth', g: 0.07, at: 0.11 },
  ],
  sip: [{ f: 300, d: 0.16, type: 'sine', g: 0.09, slide: -120 }],
  splash: [{ noise: 0.22, g: 0.14, filter: 1200 }],
  scrub: [{ noise: 0.1, g: 0.08, filter: 900 }],
  coin: [
    { f: 880, d: 0.07, type: 'square', g: 0.07 },
    { f: 1320, d: 0.1, type: 'square', g: 0.06, at: 0.06 },
  ],
  chime: [
    { f: 784, d: 0.22, type: 'sine', g: 0.1 },
    { f: 1046, d: 0.3, type: 'sine', g: 0.08, at: 0.1 },
  ],
  levelup: [
    { f: 523, d: 0.12, type: 'triangle', g: 0.11 },
    { f: 659, d: 0.12, type: 'triangle', g: 0.11, at: 0.1 },
    { f: 784, d: 0.14, type: 'triangle', g: 0.11, at: 0.2 },
    { f: 1046, d: 0.24, type: 'triangle', g: 0.1, at: 0.32 },
  ],
  error: [{ f: 200, d: 0.16, type: 'square', g: 0.07, slide: -60 }],
  night: [
    { f: 392, d: 0.3, type: 'sine', g: 0.09 },
    { f: 262, d: 0.5, type: 'sine', g: 0.08, at: 0.22 },
  ],
  morning: [
    { f: 659, d: 0.14, type: 'sine', g: 0.09 },
    { f: 880, d: 0.16, type: 'sine', g: 0.09, at: 0.14 },
    { f: 1175, d: 0.3, type: 'sine', g: 0.08, at: 0.3 },
  ],
  snore: [{ f: 120, d: 0.4, type: 'sine', g: 0.05, slide: 60 }],
  whoosh: [{ noise: 0.3, g: 0.07, filter: 600, sweep: true }],
};

export function createAudio({ enabled = true } = {}) {
  let ctx = null;
  let masterGain = null;
  let on = enabled !== false;
  let unlocked = false;

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);
    } catch (error) {
      ctx = null;
      masterGain = null;
    }
    return ctx;
  }

  function unlock() {
    const c = ensureContext();
    if (!c) return false;
    if (c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
    return true;
  }

  function playNote(c, note, startAt) {
    const t0 = c.currentTime + (note.at ?? 0) + startAt;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(Math.max(40, note.f), t0);
    if (note.slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, note.f + note.slide), t0 + note.d);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, note.g ?? 0.1), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.d);
    osc.connect(gain).connect(masterGain ?? c.destination);
    osc.start(t0);
    osc.stop(t0 + note.d + 0.05);
  }

  function playNoise(c, note, startAt) {
    const t0 = c.currentTime + (note.at ?? 0) + startAt;
    const frames = Math.floor(c.sampleRate * note.noise);
    const buffer = c.createBuffer(1, frames, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(note.filter ?? 800, t0);
    if (note.sweep) filter.frequency.exponentialRampToValueAtTime(2400, t0 + note.noise);
    const gain = c.createGain();
    gain.gain.setValueAtTime(note.g ?? 0.1, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.noise);
    src.connect(filter).connect(gain).connect(masterGain ?? c.destination);
    src.start(t0);
  }

  function play(name, { delay = 0 } = {}) {
    if (!on || !unlocked) return false;
    const c = ensureContext();
    if (!c) return false;
    if (c.state === 'suspended') c.resume().catch(() => {});
    const notes = TONES[name];
    if (!notes) return false;
    try {
      for (const note of notes) {
        if (note.noise) playNoise(c, note, delay);
        else playNote(c, note, delay);
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function setEnabled(value) {
    on = Boolean(value);
    if (on) unlock();
    return on;
  }

  return {
    play,
    unlock,
    setEnabled,
    get enabled() {
      return on;
    },
    get unlocked() {
      return unlocked;
    },
  };
}
