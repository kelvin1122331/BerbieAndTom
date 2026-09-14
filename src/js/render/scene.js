/**
 * Pengatur suasana panggung: fase langit, posisi matahari/bulan, lampu,
 * balon bicara, label suasana hati, dan kursor sikat saat mandi.
 */

import { $, setAttr, setText, setHidden, toggleClass } from '../ui/dom.js';

export function createScene(root = document) {
  const doc = root === document ? document : root.ownerDocument ?? document;
  const html = doc.documentElement;
  const stage = $('#stage', root);
  const scene = $('.scene', root);
  const speech = $('#speech', root);
  const moodTag = $('#mood-tag', root);
  const moodIcon = $('.moodtag__icon', root);
  const moodText = $('.moodtag__text', root);

  let speechTimer = 0;
  let brush = null;
  let detachBrush = () => {};

  function setPhase(phase) {
    setAttr(html, 'data-phase', phase);
  }

  function setTheme(theme) {
    setAttr(html, 'data-theme', theme === 'noir' ? 'noir' : 'pink');
  }

  function setMotion(mode) {
    setAttr(html, 'data-motion', mode === 'reduced' ? 'reduced' : 'full');
  }

  /** Gerakkan matahari & bulan mengikuti jam kamar. */
  function setCelestial(minutes, arc) {
    if (!scene) return { sun: 0, moon: 0 };
    const t = arc < 0 ? 0 : arc > 1 ? 1 : arc;
    const x = -118 + t * 236;
    const y = 26 - Math.sin(t * Math.PI) * 128;
    scene.style.setProperty('--sun-x', `${x.toFixed(1)}px`);
    scene.style.setProperty('--sun-y', `${y.toFixed(1)}px`);

    // bulan bergerak pelan mengikuti jam (tetap hidup walau jam dibekukan saat tidur)
    const drift = ((Date.now() / 90000) % 1 + 1) % 1;
    scene.style.setProperty('--moon-x', `${(-72 + drift * 156).toFixed(1)}px`);
    scene.style.setProperty('--moon-y', `${(-14 + Math.sin(drift * Math.PI * 2) * 12).toFixed(1)}px`);
    return { sun: y, arc };
  }

  function setSleeping(onState) {
    if (!stage) return;
    toggleClass(stage, 'is-sleeping', onState);
  }

  function setBathing(onState) {
    if (!stage) return;
    toggleClass(stage, 'mode-bath', onState);
  }

  /** Balon bicara karakter. */
  function say(text, ms = 3800) {
    if (!speech) return;
    speech.classList.remove('is-hidden-anim');
    setText(speech, text);
    setHidden(speech, false);
    speech.setAttribute('data-speaking', 'true');
    clearTimeout(speechTimer);
    const hold = Math.max(1600, Math.min(9000, ms + text.length * 24));
    speechTimer = setTimeout(() => {
      speech.classList.add('is-hidden-anim');
      speechTimer = setTimeout(() => {
        setHidden(speech, true);
        speech.removeAttribute('data-speaking');
      }, 280);
    }, hold);
  }

  function silence() {
    clearTimeout(speechTimer);
    if (speech) {
      setHidden(speech, true);
      speech.removeAttribute('data-speaking');
    }
  }

  function setMood(icon, label) {
    if (!moodTag) return;
    setHidden(moodTag, !label);
    if (!label) return;
    setText(moodIcon, icon);
    setText(moodText, label);
  }

  /** Kursor sikat yang mengikuti pointer selama mode mandi. */
  function enableBrush() {
    if (!stage || brush) return;
    brush = doc.createElement('span');
    brush.className = 'bath-brush';
    brush.setAttribute('aria-hidden', 'true');
    stage.append(brush);

    const move = (event) => {
      if (!brush) return;
      const box = stage.getBoundingClientRect();
      if (!box.width) return;
      brush.style.transform = `translate(${event.clientX - box.left}px, ${event.clientY - box.top}px)`;
    };
    const press = (event) => {
      move(event);
      brush?.classList.add('is-active');
    };
    const release = () => brush?.classList.remove('is-active');
    const leave = () => brush?.setAttribute('data-out', 'true');
    const enter = () => brush?.removeAttribute('data-out');

    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerdown', press);
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('pointerleave', leave);
    stage.addEventListener('pointerenter', enter);

    detachBrush = () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerdown', press);
      stage.removeEventListener('pointerup', release);
      stage.removeEventListener('pointercancel', release);
      stage.removeEventListener('pointerleave', leave);
      stage.removeEventListener('pointerenter', enter);
      brush?.remove();
      brush = null;
    };
  }

  function disableBrush() {
    detachBrush();
  }

  function flash(elTarget, className, ms = 700) {
    if (!elTarget) return;
    elTarget.classList.add(className);
    setTimeout(() => elTarget.classList.remove(className), ms);
  }

  return {
    setPhase,
    setTheme,
    setMotion,
    setCelestial,
    setSleeping,
    setBathing,
    say,
    silence,
    setMood,
    enableBrush,
    disableBrush,
    flash,
    get stage() {
      return stage;
    },
    get scene() {
      return scene;
    },
  };
}
