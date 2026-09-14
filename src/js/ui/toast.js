/** Toast notifikasi kecil di pojok layar. */

import { el, setText } from './dom.js';

const ICONS = { info: '💬', good: '✅', bad: '⚠️', coin: '🪙', heart: '💖', night: '🌙', star: '⭐', food: '🍽️' };

export function createToast(root, { max = 4, duration = 3800 } = {}) {
  const live = new Set();

  function dismiss(node, { instant = false } = {}) {
    if (!node || !live.has(node)) return;
    live.delete(node);
    if (instant) {
      node.remove();
      return;
    }
    node.classList.add('is-out');
    const done = () => node.remove();
    node.addEventListener('animationend', done, { once: true });
    setTimeout(done, 420);
  }

  function show(text, options = {}) {
    if (!root) return null;
    const { icon = 'info', tone = '', sub = '', ttl = duration, onAction = null, actionLabel = '' } = options;
    while (live.size >= max) {
      const oldest = [...live][0];
      dismiss(oldest, { instant: true });
    }
    const iconNode = el('span', { class: 'toast__icon', 'aria-hidden': 'true' }, ICONS[icon] ?? icon ?? '💬');
    const textNode = el('span', { class: 'toast__text' }, text);
    if (sub) textNode.append(el('small', {}, sub));
    const closeBtn = el('button', { class: 'toast__x', type: 'button', 'aria-label': 'Tutup notifikasi' }, '×');
    const node = el('div', { class: `toast${tone ? ` toast--${tone}` : ''}` }, iconNode, textNode, closeBtn);
    if (onAction) {
      const actionBtn = el('button', { class: 'btn btn--small btn--ghost', type: 'button' }, actionLabel || 'Buka');
      actionBtn.addEventListener('click', () => {
        onAction();
        dismiss(node);
      });
      node.append(actionBtn);
    }
    closeBtn.addEventListener('click', () => dismiss(node));
    root.append(node);
    live.add(node);
    const ttlSafe = Number.isFinite(ttl) && ttl > 0 ? ttl : 3800;
    const timer = setTimeout(() => dismiss(node), ttlSafe);
    node.addEventListener('pointerenter', () => clearTimeout(timer), { once: true });
    if (live.size > max) dismiss([...live][0], { instant: true });
    return node;
  }

  function clearAll() {
    for (const node of [...live]) dismiss(node, { instant: true });
  }

  function announce(text) {
    const slot = document.getElementById('a11y-status');
    setText(slot, text);
  }

  return { show, dismiss, clearAll, announce };
}
