/**
 * Partikel ringan (emoji & teks melayang) di dalam panggung.
 * Semua koordinat dihitung relatif terhadap elemen panggung supaya tetap
 * selaras walau SVG di-scale.
 */

import { el } from './dom.js';

const MAX_LIVE = 56;

export function createFx(layer, stage) {
  const live = new Set();
  let reduced = false;

  function setReduced(value) {
    reduced = Boolean(value);
  }

  function centerOf(target) {
    if (!layer || !stage) return { x: 0, y: 0 };
    const stageBox = stage.getBoundingClientRect();
    let box = { left: stageBox.left + stageBox.width / 2, top: stageBox.top + stageBox.height * 0.45, width: 0, height: 0 };
    if (target && typeof target.getBoundingClientRect === 'function') {
      const raw = target.getBoundingClientRect();
      if (raw.width || raw.height) box = raw;
    }
    return {
      x: box.left - stageBox.left + box.width / 2,
      y: box.top - stageBox.top + box.height / 2,
      width: box.width,
      height: box.height,
    };
  }

  function spawn(node, ttl) {
    if (!layer) return node;
    live.add(node);
    layer.append(node);
    const kill = () => {
      live.delete(node);
      node.remove();
    };
    node.addEventListener('animationend', kill, { once: true });
    setTimeout(kill, ttl + 260);
    while (live.size > MAX_LIVE) {
      const oldest = live.values().next().value;
      live.delete(oldest);
      oldest?.remove();
    }
    return node;
  }

  function burst(options = {}) {
    const {
      at = null,
      x = null,
      y = null,
      emojis = ['💖'],
      count = 6,
      spread = 90,
      rise = 120,
      duration = 1300,
      size = 26,
      kind = 'float',
    } = options;
    if (reduced || !layer) return 0;
    const anchor = x == null || y == null ? centerOf(at) : { x, y };
    const total = Math.max(1, Math.min(count, 18));
    for (let i = 0; i < total; i += 1) {
      const jitterX = (Math.random() - 0.5) * spread;
      const delay = Math.random() * 140;
      const node = el('span', {
        class: `fx-item fx-item--${kind}`,
        style: [
          `transform: translate(calc(-50% + ${jitterX}px), -50%)`,
          `left: ${anchor.x}px`,
          `top: ${anchor.y + (Math.random() - 0.5) * 18}px`,
          `font-size: ${size * (0.72 + Math.random() * 0.6)}px`,
          `--fx-dx: ${jitterX.toFixed(0)}px`,
          `--fx-dur: ${Math.round(duration * (0.8 + Math.random() * 0.5))}ms`,
          `animation-delay: ${delay.toFixed(0)}ms`,
        ].join(';'),
        'aria-hidden': 'true',
      });
      node.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      spawn(node, duration + delay);
    }
    return total;
  }

  /** Teksi melayang kecil, mis. "+18 Kenyang". */
  function floatText(text, { at = null, color = '#fff6fa', x = null, y = null, size = 17 } = {}) {
    if (reduced || !layer) return null;
    const anchor = x == null || y == null ? centerOf(at) : { x, y };
    const node = el('span', {
      class: 'fx-item fx-item--float',
      style: `left:${anchor.x}px;top:${anchor.y}px;font-size:${size}px;color:${color};--fx-dur:1500ms;font-weight:800;`,
      'aria-hidden': 'true',
    });
    node.textContent = text;
    return spawn(node, 1500);
  }

  function ring({ at = null, x = null, y = null, color = 'rgba(255,158,196,.85)' } = {}) {
    if (reduced || !layer) return null;
    const anchor = x == null || y == null ? centerOf(at) : { x, y };
    const node = el('span', {
      class: 'fx-item fx-item--ring',
      style: `left:${anchor.x}px;top:${anchor.y}px;border-color:${color}`,
      'aria-hidden': 'true',
    });
    return spawn(node, 720);
  }

  function confetti(options = {}) {
    const { at = null, count = 22, emojis = ['🎉', '✨', '💖', '⭐'], x = null, y = null } = options;
    if (reduced || !layer) return;
    const anchor = x == null || y == null ? centerOf(at) : { x, y };
    const stageBox = stage ? stage.getBoundingClientRect() : { width: 400, height: 300 };
    for (let i = 0; i < count; i += 1) {
      const node = el('span', {
        class: 'fx-item fx-item--fall',
        style: [
          `left:${anchor.x + (Math.random() - 0.5) * stageBox.width * 0.9}px`,
          `top:${anchor.y + (Math.random() - 0.5) * 40}px`,
          `font-size:${16 + Math.random() * 14}px`,
          `--fx-dx:${(Math.random() - 0.5) * 90}px`,
          `--fx-dur:${1200 + Math.random() * 900}ms`,
          `animation-delay:${(Math.random() * 320).toFixed(0)}ms`,
        ].join(';'),
        'aria-hidden': 'true',
      });
      node.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      spawn(node, 2400);
    }
  }

  function clear() {
    for (const node of [...live]) node.remove();
    live.clear();
  }

  return { burst, floatText, ring, confetti, clear, setReduced, centerOf, get count() { return live.size; } };
}
