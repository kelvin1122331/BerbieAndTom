/**
 * Perakitan karakter: body spesifik (panda/barbie) + lapisan efek umum
 * (noda, keringat, gelembung, kilau, Zzz, hati) yang dipakai kedua karakter.
 */

import { pandaBody, DIRT_SPOTS as PANDA_DIRT, PANDA_ANCHORS } from './panda.js';
import { barbieBody, DIRT_SPOTS as BARBIE_DIRT, BARBIE_ANCHORS } from './barbie.js';

export const CHARACTER_BUILDERS = {
  panda: { body: pandaBody, dirt: PANDA_DIRT, anchors: PANDA_ANCHORS, height: 372, width: 236, top: -396 },
  barbie: { body: barbieBody, dirt: BARBIE_DIRT, anchors: BARBIE_ANCHORS, height: 392, width: 148, top: -392 },
};

/**
 * Lapisan noda: tiap noda dibungkus <g class="dirt-spot"> yang bisa disikat saat mandi.
 * `--dirt` (0..1) mengatur seberapa banyak noda yang terlihat.
 */
function dirtSpots(spots) {
  return spots
    .map(
      (s, i) => `
      <g class="dirt-spot" data-spot="${i}" data-x="${s.x}" data-y="${s.y}" transform="translate(${s.x},${s.y})" role="button" tabindex="-1" aria-label="Noda ke-${i + 1}">
        <circle class="dirt-spot__hit" r="${Math.round(s.r * 2.05)}" fill="transparent" />
        <g class="dirt-spot__art">
          <ellipse class="dirt-spot__blob" rx="${s.r}" ry="${Math.round(s.r * 0.7)}" />
          <ellipse class="dirt-spot__blob dirt-spot__blob--2" cx="${Math.round(s.r * 0.62)}" cy="${-Math.round(s.r * 0.52)}" rx="${Math.round(s.r * 0.52)}" ry="${Math.round(s.r * 0.34)}" />
          <ellipse class="dirt-spot__blob dirt-spot__blob--3" cx="${-Math.round(s.r * 0.66)}" cy="${Math.round(s.r * 0.42)}" rx="${Math.round(s.r * 0.4)}" ry="${Math.round(s.r * 0.28)}" />
        </g>
      </g>`
    )
    .join('');
}

function overlayLayer(spots) {
  return `
    <g class="char__fx" aria-hidden="true">
      <g class="fx fx--dirt" data-layer="dirt">${dirtSpots(spots)}</g>

      <g class="fx fx--stink" data-layer="stink" stroke="#9c8f5f" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9">
        <path class="stink s1" d="M-96 -150 q-16 -22 0 -44 q14 -20 0 -40" />
        <path class="stink s2" d="M96 -170 q16 -20 0 -40 q-14 -18 0 -36" />
        <path class="stink s3" d="M-8 -392 q14 -16 2 -34" />
      </g>

      <g class="fx fx--sweat" data-layer="sweat">
        <path d="M78 -330 q-9 18 1 24 q10 -6 1 -24 Z" fill="#8fd8ff" />
        <path d="M80 -316 q4 -3 3 -8" stroke="#fff" stroke-width="2" fill="none" opacity=".7" />
      </g>

      <g class="fx fx--wet" data-layer="wet" fill="#9fe0ff" opacity=".85">
        <path class="drop d1" d="M-46 -160 q-6 12 1 16 q7 -4 1 -16 Z" />
        <path class="drop d2" d="M34 -128 q-6 12 1 16 q7 -4 1 -16 Z" />
        <path class="drop d3" d="M-14 -236 q-5 10 1 14 q6 -4 1 -14 Z" />
      </g>

      <g class="fx fx--sparkle" data-layer="sparkle" fill="#fff6b0">
        <path class="spark sp1" d="M-118 -300 l7 15 l15 7 l-15 7 l-7 15 l-7 -15 l-15 -7 l15 -7 Z" />
        <path class="spark sp2" d="M120 -222 l5 11 l11 5 l-11 5 l-5 11 l-5 -11 l-11 -5 l11 -5 Z" />
        <path class="spark sp3" d="M4 -402 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5 l10 -5 Z" />
        <path class="spark sp4" d="M-66 -60 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 Z" />
      </g>

      <g class="fx fx--bubbles" data-layer="bubbles">
        ${[
          { x: -78, y: -222, r: 15 },
          { x: 62, y: -300, r: 11 },
          { x: -28, y: -372, r: 9 },
          { x: 92, y: -146, r: 13 },
          { x: -104, y: -96, r: 10 },
          { x: 22, y: -50, r: 12 },
        ]
          .map(
            (b, i) => `
          <g class="bubble b${i}" transform="translate(${b.x},${b.y})">
            <circle r="${b.r}" fill="url(#gradBubble)" stroke="#fff" stroke-width="1.6" />
            <circle cx="${-b.r * 0.32}" cy="${-b.r * 0.36}" r="${b.r * 0.24}" fill="#fff" opacity=".9" />
          </g>`
          )
          .join('')}
      </g>

      <g class="fx fx--sleep" data-layer="sleep">
        <g class="zzz zzz--1"><text x="86" y="-360">z</text></g>
        <g class="zzz zzz--2"><text x="108" y="-392">Z</text></g>
        <g class="zzz zzz--3"><text x="134" y="-424">z</text></g>
      </g>

      <g class="fx fx--hearts" data-layer="hearts">
        <g class="heart h1" transform="translate(-92,-352)">
          <path d="M0 14 C-16 2 -14 -12 -5 -12 C-1 -12 0 -8 0 -8 C0 -8 1 -12 5 -12 C14 -12 16 2 0 14 Z" fill="#ff5fae" />
        </g>
        <g class="heart h2" transform="translate(88,-318) scale(.8)">
          <path d="M0 14 C-16 2 -14 -12 -5 -12 C-1 -12 0 -8 0 -8 C0 -8 1 -12 5 -12 C14 -12 16 2 0 14 Z" fill="#ff8ec7" />
        </g>
        <g class="heart h3" transform="translate(14,-404) scale(.62)">
          <path d="M0 14 C-16 2 -14 -12 -5 -12 C-1 -12 0 -8 0 -8 C0 -8 1 -12 5 -12 C14 -12 16 2 0 14 Z" fill="#ffb6d5" />
        </g>
      </g>
    </g>`;
}

/** Bayangan & lingkaran pijak di bawah karakter (ikut dalam grup supaya ikut berpindah). */
function grounding() {
  return `
    <g class="char__ground" aria-hidden="true">
      <ellipse class="shadow" cy="4" rx="98" ry="17" fill="#2a1e2b" opacity=".26" />
      <ellipse class="shadow shadow--soft" cy="2" rx="66" ry="10" fill="#2a1e2b" opacity=".18" />
    </g>`;
}

/**
 * Isi lengkap satu karakter (dipakai di panggung maupun kartu pemilihan).
 * @param {'panda'|'barbie'} id
 * @param {{pose?:string}} [opts]
 */
export function characterMarkup(id, opts = {}) {
  const builder = CHARACTER_BUILDERS[id] ?? CHARACTER_BUILDERS.panda;
  return `
    ${grounding()}
    <g class="char-body" data-pose="${opts.pose ?? 'stand'}">
      <g class="anim-breathe">
        ${builder.body()}
      </g>
    </g>
    ${overlayLayer(builder.dirt)}`;
}

/** SVG berdiri sendiri (untuk kartu pilih karakter / avatar HUD). */
export function characterSVG(id, { className = '', pose = 'stand', extra = '' } = {}) {
  const builder = CHARACTER_BUILDERS[id] ?? CHARACTER_BUILDERS.panda;
  const pad = 26;
  const w = builder.width + pad * 2;
  const vb = `${-builder.width / 2 - pad} ${builder.top - pad} ${w} ${builder.height + pad * 2}`;
  return `<svg class="char char--${id} char--standalone ${className}" data-char="${id}" data-mood="calm" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" ${extra}>${characterMarkup(id, { pose })}</svg>`;
}

export function anchorsFor(id) {
  const builder = CHARACTER_BUILDERS[id] ?? CHARACTER_BUILDERS.panda;
  return builder.anchors;
}
