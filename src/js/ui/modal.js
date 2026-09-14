/**
 * Dialog modal tunggal dengan stack (satu modal di atas modal lain untuk konfirmasi),
 * fokus-terkunci, tutup dengan Esc/klik latar, dan restore fokus.
 */

import { el, rememberFocus } from './dom.js';

export function createModal(root) {
  const stack = [];

  function focusables(panel) {
    return Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => node.offsetParent !== null || node.getClientRects().length);
  }

  function trap(panel, event) {
    const list = focusables(panel);
    if (!list.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeydown(event) {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (event.key === 'Escape') {
      if (top.dismissible) {
        event.preventDefault();
        event.stopPropagation();
        close(top.id);
      }
      return;
    }
    if (event.key === 'Tab') trap(top.panel, event);
  }

  function open(options = {}) {
    const {
      title = '',
      subtitle = '',
      content = null,
      footer = null,
      size = '',
      dismissible = true,
      className = '',
      onClose = null,
      labelledBy = null,
    } = options;
    if (!root) return null;

    const id = `modal-${Math.random().toString(36).slice(2, 8)}`;
    const restore = rememberFocus();

    const closeBtn = el('button', {
      class: 'modal__close',
      type: 'button',
      'aria-label': 'Tutup jendela',
    }, '×');

    const titleId = labelledBy ?? `${id}-title`;
    const head = el(
      'header',
      { class: 'modal__head' },
      el(
        'div',
        { class: 'modal__heading' },
        title ? el('h2', { class: 'modal__title', id: titleId }, title) : null,
        subtitle ? el('p', { class: 'modal__sub' }, subtitle) : null
      ),
      dismissible ? closeBtn : el('span', { class: 'modal__spacer' })
    );

    const body = el('div', { class: 'modal__body', id: `${id}-body`, tabindex: '-1' });
    if (typeof content === 'string') body.innerHTML = content;
    else if (content) body.append(content);

    const foot = footer ? el('footer', { class: 'modal__foot' }, footer) : null;

    const panel = el('div', {
      class: `modal__panel${size ? ` modal__panel--${size}` : ''}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': title || labelledBy ? titleId : null,
      tabindex: '-1',
    }, head, body, foot);

    const wrap = el('div', { class: `modal ${className}`.trim(), dataset: { modalId: id } }, panel);
    const backdrop = el('div', { class: 'modal__backdrop' });
    wrap.prepend(backdrop);

    if (dismissible) backdrop.addEventListener('click', () => close(id));
    closeBtn.addEventListener('click', () => close(id));

    root.append(wrap);
    document.body.classList.add('is-modal-open');

    const entry = { id, wrap, panel, body, restore, dismissible, onClose };
    stack.push(entry);

    // fokus awal: tombol pertama di footer, atau body
    const initial = panel.querySelector('[data-autofocus]') || focusables(panel)[0] || body;
    requestAnimationFrame(() => {
      try {
        initial.focus({ preventScroll: true });
      } catch (error) {
        initial.focus();
      }
    });

    if (stack.length === 1) document.addEventListener('keydown', onKeydown, true);
    return entry;
  }

  function close(id) {
    const index = id ? stack.findIndex((m) => m.id === id) : stack.length - 1;
    if (index < 0) return false;
    const [entry] = stack.splice(index, 1);
    entry.wrap.style.animation = 'fade-in 160ms var(--ease) reverse both';
    setTimeout(() => entry.wrap.remove(), 150);
    if (!stack.length) {
      document.removeEventListener('keydown', onKeydown, true);
      document.body.classList.remove('is-modal-open');
    }
    if (typeof entry.onClose === 'function') {
      try {
        entry.onClose();
      } catch (error) {
        console.error(error);
      }
    }
    entry.restore();
    return true;
  }

  function closeAll() {
    while (stack.length) close(stack[stack.length - 1].id);
  }

  function isOpen() {
    return stack.length > 0;
  }

  function top() {
    return stack[stack.length - 1] ?? null;
  }

  return { open, close, closeAll, isOpen, top };
}

/** Konfirmasi sederhana dua tombol. */
export function confirmDialog(modal, { title, text, confirmLabel = 'Ya', cancelLabel = 'Batal', danger = false, onConfirm }) {
  const buttons = el('div', { class: 'modal__foot-btns' });
  const cancel = el('button', { class: 'btn btn--ghost', type: 'button' }, cancelLabel);
  const confirm = el('button', { class: `btn ${danger ? 'btn--dark' : 'btn--primary'}`, type: 'button' }, confirmLabel);
  buttons.append(cancel, confirm);
  const entry = modal.open({
    title,
    content: el('p', { class: 'modal__sub', style: 'margin:0' }, text),
    footer: buttons,
    size: 'sm',
  });
  const doClose = () => modal.close(entry.id);
  cancel.addEventListener('click', doClose);
  confirm.addEventListener('click', () => {
    doClose();
    if (typeof onConfirm === 'function') onConfirm();
  });
  confirm.setAttribute('data-autofocus', '');
  return entry;
}
