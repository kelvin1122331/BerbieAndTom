/**
 * Bootstrap aplikasi: layar pilih karakter (wajib), pemasangan mesin permainan,
 * pintasan keyboard, dan perpindahan antar karakter.
 */

import { $, $$, setText, setHidden, prefersReducedMotion } from './ui/dom.js';
import { createState, cleanName } from './core/state.js';
import { loadFor, safeStorage, lastCharacter, summaries, clearFor } from './core/persistence.js';
import { CHARACTER_LIST, getCharacter } from './data/characters.js';
import { characterSVG } from './render/character.js';
import { STAT_LIST } from './core/stats.js';
import { createGame } from './game.js';

const storage = safeStorage();

let game = null;
let selected = null;
let saves = {};

/* ------------------------------------------------------------ layar pilih */

function statChips(character) {
  return STAT_LIST.slice(0, 4)
    .map((meta) => {
      const value = character.startStats?.[meta.id] ?? 70;
      const hint = character.statsHint?.[meta.id] ?? meta.hint;
      return `<span class="chip" title="${meta.icon} ${meta.label}: ${hint}">${meta.icon} <b>${value}</b></span>`;
    })
    .join('');
}

function paintArtwork() {
  for (const card of $$('.pick-card')) {
    const id = card.dataset.pick;
    const char = getCharacter(id);
    const art = card.querySelector('[data-art]');
    if (art && !art.firstElementChild) art.innerHTML = characterSVG(id, { className: 'pick-art' });
    const chips = card.querySelector('[data-stats]');
    if (chips) chips.innerHTML = statChips(char);
  }
}

function describeSave(meta) {
  if (!meta) return null;
  return `Lanjutkan ${meta.name} · Hari ${meta.day} · Level ${meta.level}`;
}

function selectCharacter(id, { announce = true } = {}) {
  const char = getCharacter(id);
  if (!char) return;
  selected = id;
  for (const card of $$('.pick-card')) {
    const isOn = card.dataset.pick === id;
    card.setAttribute('aria-checked', isOn ? 'true' : 'false');
    card.classList.toggle('is-picked', isOn);
  }
  const nameInput = $('#name-input');
  if (nameInput) nameInput.placeholder = char.defaultName;

  const badge = describeSave(saves[id]);
  const startBtn = $('#btn-start');
  if (startBtn) {
    setText(startBtn.querySelector('.btn__text'), badge ? `Lanjutkan sebagai ${char.name}` : `Mulai bersama ${char.name}`);
    startBtn.disabled = false;
  }
  const continueBtn = $('#btn-continue');
  if (continueBtn) {
    setHidden(continueBtn, !badge);
    if (badge) setText(continueBtn.querySelector('.btn__text'), `Punya progres lain — ${badge}`);
  }
  const resetBtn = $('#btn-reset-welcome');
  if (resetBtn) setHidden(resetBtn, !saves[id]);
  if (announce) {
    const hint = $('#picker-hint');
    setText(hint, `${char.name} si ${char.title} dipilih. ${char.subtitle}. ${badge ? describeSave(saves[id]) : 'Belum pernah dimainkan.'}`);
  }
}

function setupWelcome() {
  saves = summaries(storage);
  paintArtwork();
  const last = lastCharacter(storage);
  const startId = saves.panda || saves.barbie ? (saves[last] ? last : saves.panda ? 'panda' : 'barbie') : 'panda';

  selectCharacter(startId, { announce: false });
  const hint = $('#picker-hint');
  if (saves[startId]) {
    setText(hint, `${getCharacter(startId).name} menunggumu kembali — ${describeSave(saves[startId])}.`);
  }

  for (const card of $$('.pick-card')) {
    if (card.dataset.wired === 'true') continue;
    card.dataset.wired = 'true';
    card.addEventListener('click', () => selectCharacter(card.dataset.pick));
    card.addEventListener('mouseenter', () => {
      if (selected !== card.dataset.pick) selectCharacter(card.dataset.pick, { announce: false });
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const other = card.dataset.pick === 'panda' ? 'barbie' : 'panda';
      selectCharacter(other);
      $(`.pick-card[data-pick="${other}"]`)?.focus();
    });
  }

  const startBtn = $('#btn-start');
  if (startBtn && startBtn.dataset.wired !== 'true') {
    startBtn.dataset.wired = 'true';
    startBtn.addEventListener('click', () => {
      if (!selected) return;
      const saved = loadFor(storage, selected);
      const custom = cleanName($('#name-input')?.value);
      let initial;
      if (saved) {
        initial = custom ? { ...saved, name: custom } : saved;
      } else {
        const char = getCharacter(selected);
        initial = createState({ character: selected, name: custom ?? char.defaultName });
        initial.stats = { ...initial.stats, ...(char.startStats ?? {}) };
      }
      enterGame(initial);
    });
  }

  const continueBtn = $('#btn-continue');
  if (continueBtn && continueBtn.dataset.wired !== 'true') {
    continueBtn.dataset.wired = 'true';
    continueBtn.addEventListener('click', () => {
      const other = selected === 'panda' ? 'barbie' : 'panda';
      const saved = loadFor(storage, other) ?? loadFor(storage, selected);
      if (saved) {
        selectCharacter(saved.character, { announce: false });
        enterGame(saved);
      }
    });
  }

  const resetBtn = $('#btn-reset-welcome');
  if (resetBtn && resetBtn.dataset.wired !== 'true') {
    resetBtn.dataset.wired = 'true';
    resetBtn.addEventListener('click', () => {
      if (!selected) return;
      clearFor(storage, selected);
      saves = summaries(storage);
      selectCharacter(selected);
    });
  }

  const nameForm = $('#name-form');
  if (nameForm && nameForm.dataset.wired !== 'true') {
    nameForm.dataset.wired = 'true';
    nameForm.addEventListener('submit', (event) => {
      event.preventDefault();
      startBtn?.click();
    });
  }
}

/* ------------------------------------------------------------------ game */

function enterGame(initialState) {
  const welcome = $('#screen-welcome');
  const screen = $('#screen-game');
  setHidden(welcome, true);
  welcome?.setAttribute('inert', '');
  setHidden(screen, false);
  screen?.removeAttribute('inert');

  if (game) game.stop();
  game = createGame({
    initial: initialState,
    hooks: {
      storage,
      onSwitch: () => leaveGame(),
      onWipe: () => leaveGame(),
    },
  });
  game.start();
  // ekspos untuk debugging (dan dipakai uji otomatis)
  window.__berbieTom = game;
  setText($('#side-name'), initialState.name);
  window.scrollTo({ top: 0, behavior: 'auto' });
  game.toast.show(`Selamat datang di kamar ${initialState.name}! Tekan 1–5 untuk aksi.`, { icon: '🎀', ttl: 5200 });
}

function leaveGame() {
  if (game) {
    game.modal?.closeAll();
    game.stop();
    game = null;
    try {
      delete window.__berbieTom;
    } catch (error) {
      window.__berbieTom = undefined;
    }
  }
  const screen = $('#screen-game');
  const welcome = $('#screen-welcome');
  setHidden(screen, true);
  setHidden(welcome, false);
  welcome?.removeAttribute('inert');
  document.documentElement.setAttribute('data-phase', 'pagi');
  setupWelcome();
  $('.pick-card')?.focus?.();
}

/* ------------------------------------------------------------ kontrol global */

function wireGlobalControls() {
  const dock = $('#dock');
  if (dock) {
    for (const btn of $$('button.act', dock)) {
      btn.addEventListener('click', () => {
        if (!game) return;
        game.audio.play('click');
        switch (btn.dataset.act) {
          case 'makan':
            game.openKitchen();
            break;
          case 'mandi':
            game.startBath();
            break;
          case 'main':
            game.openMinigame();
            break;
          case 'gaya':
            game.openWardrobe();
            break;
          case 'tidur':
            game.requestSleep();
            break;
          default:
            break;
        }
      });
    }
  }

  $('#btn-report')?.addEventListener('click', () => game?.openReport());
  $('#btn-help')?.addEventListener('click', () => game?.openHelp());
  $('#btn-settings')?.addEventListener('click', () => game?.openSettings());
  $('#btn-switch')?.addEventListener('click', () => game?.switchCharacter());
  $('#btn-sound')?.addEventListener('click', (event) => {
    if (!game) return;
    const pressed = event.currentTarget.getAttribute('aria-pressed') === 'true';
    game.setSound(!pressed);
  });

  document.addEventListener('keydown', (event) => {
    if (!game) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

    const map = { 1: 'makan', 2: 'mandi', 3: 'main', 4: 'gaya', 5: 'tidur' };
    const modalOpen = Boolean(document.querySelector('.modal'));
    if (map[event.key] && !modalOpen) {
      const btn = $(`#dock button[data-act="${map[event.key]}"]`);
      if (btn && !btn.disabled) {
        event.preventDefault();
        btn.click();
      }
      return;
    }
    if (event.code === 'Space' && !modalOpen) {
      event.preventDefault();
      game.togglePause();
      return;
    }
    if ((event.key === 'h' || event.key === 'H') && !modalOpen) {
      event.preventDefault();
      game.openHelp();
    }
  });

  document.addEventListener('dblclick', (event) => {
    if (event.target?.closest?.('.act')) event.preventDefault();
  });
}

/* -------------------------------------------------------------------- boot */

function boot() {
  document.documentElement.setAttribute('data-motion', prefersReducedMotion() ? 'reduced' : 'full');
  setupWelcome();
  wireGlobalControls();
  window.addEventListener('beforeunload', () => game?.save());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();

export { CHARACTER_LIST };
