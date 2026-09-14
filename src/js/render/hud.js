/**
 * Panel angka: HUD atas, bar status, daftar misi, dan catatan kamar.
 */

import { $, el, setText, setHidden, toggleClass, escapeHtml } from '../ui/dom.js';
import { STAT_LIST } from '../core/stats.js';
import { formatTime, formatDuration, formatCountdown, phaseMeta, phaseOf, minutesUntilNight, dayArc } from '../core/time.js';
import { levelFromXp } from '../core/economy.js';

const MOOD_ICON = {
  senang: '😄',
  biasa: '🙂',
  gelisah: '😕',
  sedih: '😟',
  lapar: '🍽️',
  kotor: '🧼',
  sakit: '🤒',
  ngantuk: '😪',
  tidur: '😴',
};

export function createHud({ root = document } = {}) {
  const refs = {
    clockTime: $('#clock-time', root),
    clockPhase: $('#clock-phase', root),
    clockIcon: $('#clock-icon', root),
    clockNext: $('#clock-next', root),
    clockReal: $('#clock-real', root),
    clockChip: $('#clock-chip', root),
    day: $('#day-count', root),
    dayDot: $('#day-dot', root),
    coins: $('#coin-count', root),
    level: $('#level-num', root),
    xpFill: $('#xp-fill', root),
    xpText: $('#xp-text', root),
    statList: $('#statlist', root),
    statFoot: $('#stat-foot', root),
    missionList: $('#mission-list', root),
    missionMeta: $('#missions-meta', root),
    logList: $('#log-list', root),
    logMeta: $('#log-meta', root),
    sideName: $('#side-name', root),
    sideAge: $('#side-age', root),
    sideStreak: $('#side-streak', root),
    brandSub: $('#brand-sub', root),
    dock: $('#dock', root),
  };

  const rows = new Map();
  let deltaTimers = new Map();
  let logCount = 0;

  /** Bangun bar status sekali, lalu isi nilainya saja saat render. */
  function buildStats(character) {
    if (!refs.statList) return;
    refs.statList.innerHTML = '';
    rows.clear();
    for (const meta of STAT_LIST) {
      const fill = el('span', { class: 'stat__fill', style: `--stat-color:${meta.color}` });
      const track = el('div', { class: 'stat__track' }, fill);
      const value = el('span', { class: 'stat__value' }, '0');
      const delta = el('span', { class: 'stat__delta' });
      const name = el('span', { class: 'stat__name' }, meta.label);
      const top = el('div', { class: 'stat__top' }, name, delta);
      const hint = character?.statsHint?.[meta.id] ?? meta.hint;
      const row = el(
        'div',
        { class: 'stat', dataset: { stat: meta.id }, title: `${meta.label}: ${hint}` },
        el('span', { class: 'stat__icon', 'aria-hidden': 'true' }, meta.icon),
        top,
        value
      );
      row.insertBefore(track, value);
      refs.statList.append(row);
      rows.set(meta.id, { row, fill, value, delta, name });
    }
  }

  function setStatValue(id, valueNum, delta) {
    const row = rows.get(id);
    if (!row) return;
    const pct = Math.max(0, Math.min(100, Math.round(valueNum)));
    row.fill.style.width = `${pct}%`;
    setText(row.value, String(pct));
    toggleClass(row.row, 'is-low', pct < 32);
    toggleClass(row.row, 'is-good', pct >= 80);
    if (delta) {
      const rounded = Math.round(delta);
      if (rounded !== 0) {
        setText(row.delta, `${rounded > 0 ? '+' : ''}${rounded}`);
        toggleClass(row.delta, 'is-neg', rounded < 0);
        row.delta.classList.add('is-on');
        clearTimeout(deltaTimers.get(id));
        deltaTimers.set(
          id,
          setTimeout(() => row.delta.classList.remove('is-on'), 1500)
        );
      }
    }
  }

  function renderStats(stats, deltas = {}) {
    for (const meta of STAT_LIST) {
      setStatValue(meta.id, stats?.[meta.id] ?? 0, deltas?.[meta.id]);
    }
  }

  function renderClock(state) {
    const meta = phaseMeta(state.clock.phase ?? phaseOf(state.clock.minutes));
    if (refs.dayDot) {
      const arc = Math.max(0, Math.min(1, dayArc(state.clock.minutes)));
      refs.dayDot.style.left = `${(arc * 100).toFixed(1)}%`;
    }
    setText(refs.clockTime, formatTime(state.clock.minutes));
    setText(refs.clockPhase, meta.label);
    setText(refs.clockIcon, meta.icon);
    if (state.settings?.showRealClock) {
      setHidden(refs.clockReal, false);
      const now = new Date();
      setText(refs.clockReal, `Jam nyata ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } else {
      setHidden(refs.clockReal, true);
    }

    if (state.clock.paused && state.mode !== 'sleeping' && state.mode !== 'winding') {
      setText(refs.clockNext, 'Dijeda — tekan spasi');
      toggleClass(refs.clockChip, 'is-paused', true);
    } else if (state.mode === 'sleeping' || state.mode === 'winding') {
      const left = Math.max(0, (state.sleep?.total ?? 30) - (state.sleep?.elapsed ?? 0));
      setText(refs.clockNext, `Tidur · sisa ${formatCountdown(left)}`);
    } else if (state.clock.night) {
      setText(refs.clockNext, 'Malam — segera tidur');
    } else {
      const left = minutesUntilNight(state.clock.minutes);
      setText(refs.clockNext, `Malam dalam ${formatDuration(left)}`);
    }
    toggleClass(refs.clockChip, 'is-paused', Boolean(state.clock.paused));
  }

  function renderEconomy(state) {
    setText(refs.day, String(state.day));
    setText(refs.coins, String(state.coins));
    const info = levelFromXp(state.xp);
    setText(refs.level, String(info.level));
    if (refs.xpFill) refs.xpFill.style.width = `${Math.round(info.progress * 100)}%`;
    setText(refs.xpText, info.maxed ? 'LEVEL MAKS' : `${info.into} / ${info.needed} XP`);
    setText(refs.sideName, state.name);
    setText(refs.sideAge, `Hari ${state.day}`);
    setText(refs.sideStreak, state.streak > 0 ? `Runtutan ${state.streak} hari 🔥` : 'Runtutan 0 hari');
    setText(refs.brandSub, `${state.name} · ${state.character === 'panda' ? 'Panda Bambu' : 'Barbie Fashionista'}`);
  }

  function renderMissions(state) {
    if (!refs.missionList) return;
    const missions = state.missions ?? [];
    const done = missions.filter((m) => m.done).length;
    setText(refs.missionMeta, `${done}/${missions.length} selesai`);
    refs.missionList.innerHTML = missions
      .map((m) => {
        const pct = Math.round(Math.min(1, m.target ? m.progress / m.target : 1) * 100);
        const count = m.target > 1 ? `${Math.floor(m.progress)}/${m.target}` : m.done ? '✓' : '0/' + m.target;
        return `<li class="mission${m.done ? ' is-done' : ''}" title="${escapeHtml(m.desc)}">
            <span class="mission__icon" aria-hidden="true">${m.done ? '✅' : m.icon}</span>
            <span>
              <span class="mission__label">${escapeHtml(m.label)}</span>
              <span class="mission__bar"><i style="width:${pct}%"></i></span>
            </span>
            <span class="mission__count">${count}</span>
          </li>`;
      })
      .join('');
  }

  function renderDock(state, info = {}) {
    if (!refs.dock) return;
    const locked = state.mode === 'sleeping' || state.mode === 'winding' || state.clock.night;
    for (const btn of Array.from(refs.dock.querySelectorAll('.act'))) {
      const act = btn.dataset.act;
      const isSleep = act === 'tidur';
      btn.disabled = isSleep ? !info.sleepReady : locked || info.busy;
      toggleClass(btn, 'is-attention', Boolean(info.attention?.includes(act)));
      const flag = $('.act__flag', btn);
      if (info.attention?.includes(act) && !flag) {
        btn.append(el('span', { class: 'act__flag' }, '!'));
      } else if (!info.attention?.includes(act) && flag) {
        flag.remove();
      }
      if (isSleep) {
        const hint = $('.act__hint', btn);
        setText(hint, info.sleepHint ?? 'Aktif saat malam');
      }
    }
  }

  function renderMood(state, mood) {
    const foot = refs.statFoot;
    if (!foot) return;
    const worst = STAT_LIST.slice()
      .map((meta) => ({ meta, value: Math.round(state.stats[meta.id] ?? 0) }))
      .sort((a, b) => a.value - b.value)[0];
    if (state.mode === 'sleeping') {
      setText(foot, 'Sedang tidur nyenyak — energi dipulihkan sampai penuh.');
    } else if (worst && worst.value < 40) {
      foot.innerHTML = `${worst.meta.icon} <b>${escapeHtml(worst.meta.label)}</b> tinggal ${worst.value}. `;
      foot.append(document.createTextNode(worst.meta.hint));
    } else {
      setText(foot, `${MOOD_ICON[mood?.id] ?? '🙂'} ${mood?.line ?? 'Semua kebutuhan aman.'}`);
    }
  }

  function log(entry) {
    if (!refs.logList) return;
    const { time = '', icon = '•', text = '', tone = '' } = entry;
    const row = el(
      'li',
      { class: `logrow${tone ? ` logrow--${tone}` : ''}` },
      el('span', { class: 'logrow__time' }, time),
      el('span', { class: 'logrow__icon', 'aria-hidden': 'true' }, icon),
      el('span', { class: 'logrow__text' }, text)
    );
    refs.logList.prepend(row);
    logCount += 1;
    while (refs.logList.childElementCount > 40) refs.logList.lastElementChild.remove();
    setText(refs.logMeta, `${logCount} catatan`);
  }

  function clearLog() {
    if (refs.logList) refs.logList.innerHTML = '';
    logCount = 0;
  }

  function render(state, ctx = {}) {
    renderClock(state);
    renderEconomy(state);
    renderStats(state.stats, ctx.deltas);
    renderMissions(state);
    renderDock(state, ctx);
    renderMood(state, ctx.mood);
  }

  return {
    buildStats,
    render,
    renderClock,
    renderMissions,
    renderDock,
    renderMood,
    renderStats,
    log,
    clearLog,
    refs,
  };
}
