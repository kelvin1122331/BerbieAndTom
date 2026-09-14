/**
 * Lapisan karakter di panggung: pasang SVG, posisi sesuai aktivitas,
 * ekspresi, busana, serta lapisan kotor/keringat/kilau/Zzz.
 */

import { $, setAttr, toggleClass } from '../ui/dom.js';
import { characterMarkup, CHARACTER_BUILDERS } from './character.js';

/** Posisi kaki karakter + skala, dalam koordinat viewBox panggung (1280x760). */
export const POSITIONS = {
  center: { x: 648, y: 700, scale: 1 },
  table: { x: 552, y: 692, scale: 0.93 },
  tub: { x: 1034, y: 648, scale: 0.8 },
  bed: { x: 232, y: 598, scale: 0.76 },
  wardrobe: { x: 930, y: 700, scale: 0.92 },
};

const MODE_POSITION = {
  idle: 'center',
  eating: 'table',
  playing: 'center',
  bathing: 'tub',
  sleeping: 'bed',
  winding: 'bed',
  styling: 'wardrobe',
};

/** Ekspresi dasar yang ditentukan oleh alat bantu mood. */
const MOOD_TO_EXPRESSION = {
  senang: 'joy',
  biasa: 'calm',
  gelisah: 'calm',
  sedih: 'sad',
  lapar: 'hungry',
  kotor: 'dirty',
  sakit: 'sick',
  ngantuk: 'tired',
  tidur: 'sleep',
};

export function createActor({ root = document } = {}) {
  const anchor = $('#char-anchor', root);
  const slot = $('#char-slot', root);
  let current = null;
  let spots = [];
  const pulses = new Map();

  function mount(charId) {
    if (!slot) return false;
    const id = CHARACTER_BUILDERS[charId] ? charId : 'panda';
    if (current === id && slot.childElementCount) return true;
    current = id;
    slot.innerHTML = characterMarkup(id);
    slot.classList.add('char', `char--${id}`);
    spots = Array.from(slot.querySelectorAll('.dirt-spot'));
    resetDirt();
    return true;
  }

  function character() {
    return current;
  }

  function resetDirt() {
    for (const spot of spots) {
      spot.classList.remove('is-gone');
      spot.setAttribute('aria-disabled', 'false');
    }
  }

  function clearDirt() {
    for (const spot of spots) {
      spot.classList.add('is-gone');
    }
  }

  function spotCount() {
    return spots.length;
  }

  function remainingDirt() {
    return spots.filter((spot) => !spot.classList.contains('is-gone')).length;
  }

  /** Hasilkan noda sejumlah `count` secara acak (dipakai saat mulai mandi). */
  function seedDirt(count) {
    resetDirt();
    if (!spots.length) return 0;
    const wanted = Math.max(0, Math.min(spots.length, Math.round(count)));
    if (wanted >= spots.length) return spots.length;
    const order = [...spots.keys()].sort(() => Math.random() - 0.5).slice(0, wanted);
    const keep = new Set(order);
    for (const [index, spot] of spots.entries()) {
      spot.classList.toggle('is-gone', !keep.has(index));
    }
    return wanted;
  }

  function removeSpot(index) {
    const spot = spots[index];
    if (!spot || spot.classList.contains('is-gone')) return false;
    spot.classList.add('is-gone');
    spot.setAttribute('aria-disabled', 'true');
    return true;
  }

  function spotsNodes() {
    return spots;
  }

  function pulse(name, ms = 900) {
    if (!slot) return;
    slot.classList.add(`is-${name}`);
    clearTimeout(pulses.get(name));
    pulses.set(
      name,
      setTimeout(() => {
        slot.classList.remove(`is-${name}`);
        pulses.delete(name);
      }, ms)
    );
  }

  function hold(name, onState) {
    toggleClass(slot, `is-${name}`, onState);
  }

  function position(key, { animate = true } = {}) {
    if (!anchor) return;
    const target = POSITIONS[key] ?? POSITIONS.center;
    if (!animate) anchor.style.transition = 'none';
    anchor.style.transform = `translate(${target.x}px, ${target.y}px) scale(${target.scale})`;
    if (!animate) {
      // paksai reflow lalu kembalikan transisi
      void anchor.getBoundingClientRect();
      anchor.style.transition = '';
    }
  }

  function setVar(name, value) {
    slot?.style.setProperty(name, typeof value === 'number' ? value.toFixed(3) : value);
  }

  /**
   * Sinkronkan seluruh visual karakter dengan state.
   * @param {object} state
   * @param {{expression?:string, dirtRatio?:number, sparkle?:number, wet?:number, bubbles?:number, sleepy?:number, hearts?:number, forcePosition?:string}} [extra]
   */
  function update(state, extra = {}) {
    if (!slot || !current) return;
    const mood = MOOD_TO_EXPRESSION[extra.moodId] ?? 'calm';
    setAttr(slot, 'data-mood', mood);
    setAttr(slot, 'data-char', current);
    setAttr(slot, 'data-outfit', state.dressing?.outfit ?? 'default');
    setAttr(slot, 'data-acc', state.dressing?.accessory ?? 'none');

    const stats = state.stats ?? {};
    const bersih = Number(stats.bersih ?? 100);
    const energi = Number(stats.energi ?? 100);
    const bahagia = Number(stats.bahagia ?? 100);
    const isBathing = state.mode === 'bathing';
    const isSleeping = state.mode === 'sleeping';

    const baseDirt = extra.dirtRatio != null ? extra.dirtRatio : Math.max(0, Math.min(1, (62 - bersih) / 46));
    // saat mandi: noda hilang satu per satu, jadi lapisannya tetap penuh sampai habis
    const dirt = isBathing ? (remainingDirt() > 0 ? 1 : 0) : baseDirt;
    setVar('--dirt', dirt);
    setVar('--sparkle', extra.sparkle != null ? extra.sparkle : bersih > 88 ? 0.9 : 0);
    setVar('--stink', Math.max(0, Math.min(1, (30 - bersih) / 24)));
    setVar('--sweat', Math.max(0, Math.min(1, (34 - energi) / 22)));
    setVar('--wet', extra.wet ?? (isBathing ? 1 : 0));
    setVar('--bubbles', extra.bubbles ?? (isBathing ? 1 : 0));
    setVar('--sleepy', isSleeping || mood === 'sleep' ? 1 : Math.max(0, Math.min(0.6, (28 - energi) / 30)));
    setVar('--hearts', extra.hearts ?? (bahagia > 88 ? 0.55 : 0));

    toggleClass(slot, 'is-dancing', state.mode === 'playing');
    hold('sleeping', isSleeping);

    position(extra.forcePosition ?? MODE_POSITION[state.mode] ?? 'center');
  }

  return {
    mount,
    update,
    pulse,
    hold,
    position,
    setVar,
    character,
    spotCount,
    remainingDirt,
    seedDirt,
    resetDirt,
    clearDirt,
    removeSpot,
    spotsNodes,
    get el() {
      return slot;
    },
    get anchor() {
      return anchor;
    },
  };
}
