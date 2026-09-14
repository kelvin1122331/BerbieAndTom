/** Helper DOM kecil agar kode lain tetap ringkas dan aman. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function byId(id, root = document) {
  return root.getElementById ? root.getElementById(id) : $(`#${id}`, root);
}

export function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style') node.setAttribute('style', value);
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

/** SVG element (namespace benar) — dipakai untuk elemen di dalam <svg>. */
export function svgEl(tag, attrs = {}, ...kids) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export function setText(node, text) {
  if (!node) return;
  const next = String(text ?? '');
  if (node.textContent !== next) node.textContent = next;
}

export function setAttr(node, name, value) {
  if (!node) return;
  const next = value === null || value === undefined || value === false ? null : String(value);
  const cur = node.getAttribute(name);
  if (cur === next) return;
  if (next === null) node.removeAttribute(name);
  else node.setAttribute(name, next);
}

export function setHidden(node, hidden) {
  if (!node) return;
  if (hidden) node.setAttribute('hidden', '');
  else node.removeAttribute('hidden');
}

export function toggleClass(node, cls, on) {
  if (!node || !node.classList) return;
  node.classList.toggle(cls, Boolean(on));
}

export function on(target, type, handler, opts) {
  if (!target) return () => {};
  target.addEventListener(type, handler, opts);
  return () => target.removeEventListener(type, handler, opts);
}

export function delegate(root, type, selector, handler) {
  if (!root) return () => {};
  const listener = (event) => {
    const target = event.target.closest ? event.target.closest(selector) : null;
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    return false;
  }
}

export function raf() {
  const cbs = new Set();
  let running = false;
  let frame = 0;
  function loop() {
    frame = 0;
    running = false;
    for (const cb of [...cbs]) {
      cbs.delete(cb);
      try {
        cb();
      } catch (error) {
        console.error(error);
      }
    }
    if (cbs.size) schedule();
  }
  function schedule() {
    if (running) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }
  return {
    /** Jadwalkan callback sekali per frame (di-batch). */
    once(cb) {
      cbs.add(cb);
      schedule();
    },
    cancel(cb) {
      cbs.delete(cb);
      if (!cbs.size && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        running = false;
      }
    },
  };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Simpan posisi fokus, kembalikan setelah dialog ditutup. */
export function rememberFocus() {
  const prev = document.activeElement;
  return () => {
    if (prev && typeof prev.focus === 'function') {
      try {
        prev.focus({ preventScroll: true });
      } catch (error) {
        prev.focus();
      }
    }
  };
}
