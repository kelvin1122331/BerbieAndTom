/**
 * Karakter Berbie si Barbie — SVG digambar tangan.
 * Origin (0,0) di lantai (telapak sepatu), tubuh ke arah Y negatif.
 * Total tinggi ± 372 unit: proporsi boneka fashion (kaki panjang, pinggang kecil).
 */

const SKIN = 'url(#gradSkin)';
const HAIR = 'url(#gradHair)';

/** Titik noda saat mandi. */
export const DIRT_SPOTS = [
  { x: -30, y: -300, r: 13 },
  { x: 34, y: -262, r: 12 },
  { x: -22, y: -196, r: 15 },
  { x: 26, y: -150, r: 14 },
  { x: -30, y: -96, r: 13 },
  { x: 18, y: -56, r: 12 },
  { x: -8, y: -338, r: 11 },
  { x: 44, y: -116, r: 11 },
];

function hairBack() {
  return `
    <g class="barbie__hair-back">
      <!-- massa rambut di belakang kepala -->
      <path d="M-58 -352 q58 -36 116 0 q22 62 14 132 q-5 46 -14 72 q-16 10 -24 -4 q10 -46 12 -96 q2 -50 -10 -80 q-30 -14 -60 0 q-12 30 -10 80 q2 50 12 96 q-8 14 -24 4 q-9 -26 -14 -72 q-8 -70 14 -132 Z" fill="${HAIR}" />
      <!-- poninya dari belakang (highlight) -->
      <path d="M-58 -352 q58 -36 116 0 q8 24 10 44 q-60 -24 -136 0 q2 -20 10 -44 Z" fill="#f7dd94" opacity=".75" />
      <!-- gelombang rambut -->
      <path d="M-52 -300 q-10 60 -2 108" stroke="#e0b04d" stroke-width="3" fill="none" opacity=".55" />
      <path d="M52 -300 q10 60 2 108" stroke="#e0b04d" stroke-width="3" fill="none" opacity=".55" />
      <path d="M-40 -232 q-8 30 -2 52" stroke="#fff0c0" stroke-width="2.6" fill="none" opacity=".5" />
      <path d="M40 -232 q8 30 2 52" stroke="#fff0c0" stroke-width="2.6" fill="none" opacity=".5" />
    </g>`;
}

function legsAndShoes() {
  return `
    <g class="barbie__legs">
      <g transform="translate(-17,0)">
        <g class="anim-leg-l">
          <path d="M-9 -196 q-6 60 -2 118 q1 20 10 22 q11 -2 12 -22 q4 -58 -2 -118 Z" fill="${SKIN}" />
          <path d="M-12 -76 q10 8 22 0" stroke="#e6b7a6" stroke-width="2" fill="none" opacity=".7" />
          <path d="M-14 -30 q-2 20 2 24 q14 6 30 0 q4 -8 0 -22 q-16 8 -32 -2 Z" fill="#ff2e97" />
          <path d="M-14 -30 q16 10 32 2 q2 8 -2 12 q-16 6 -30 0 Z" fill="#ff8ec7" />
          <rect x="-4" y="-58" width="7" height="26" rx="3" fill="#ff2e97" transform="rotate(6)" />
        </g>
      </g>
      <g transform="translate(17,0)">
        <g class="anim-leg-r">
          <path d="M9 -196 q6 60 2 118 q-1 20 -10 22 q-11 -2 -12 -22 q-4 -58 2 -118 Z" fill="${SKIN}" />
          <path d="M-13 -76 q10 8 22 0" stroke="#e6b7a6" stroke-width="2" fill="none" opacity=".7" />
          <path d="M-6 -30 q-2 20 2 24 q14 6 30 0 q4 -8 0 -22 q-16 8 -32 -2 Z" fill="#ff2e97" />
          <path d="M-6 -30 q16 10 32 2 q2 8 -2 12 q-16 6 -30 0 Z" fill="#ff8ec7" />
          <rect x="-3" y="-58" width="7" height="26" rx="3" fill="#ff2e97" transform="rotate(-6)" />
        </g>
      </g>
    </g>`;
}

function torso() {
  return `
    <g class="barbie__torso">
      <path d="M-26 -252 q26 14 52 0 q8 30 4 52 q-30 16 -60 0 q-4 -24 4 -52 Z" fill="${SKIN}" />
      <path d="M-24 -252 q24 -12 48 0 q6 -18 0 -26 q-24 -10 -48 0 q-6 8 0 26 Z" fill="#ffe3d2" />
      <path d="M-22 -200 q22 12 44 0 q10 26 6 46 q-28 14 -56 0 q-4 -22 6 -46 Z" fill="${SKIN}" />
      <path d="M-16 -198 q16 8 32 0 q2 12 0 20 q-16 6 -32 0 q-2 -10 0 -20 Z" fill="#f7cdb8" opacity=".55" />
    </g>`;
}

function arms() {
  return `
    <g class="barbie__arms">
      <g transform="translate(-34,-244) rotate(10)">
        <g class="anim-arm-l">
          <path d="M-8 0 q-6 40 -2 74 q1 10 9 10 q8 0 9 -10 q4 -34 -2 -74 Z" fill="${SKIN}" />
          <circle cy="86" r="10" fill="#ffe3d2" />
          <path d="M-6 84 q6 6 12 0" stroke="#e6b7a6" stroke-width="1.6" fill="none" opacity=".8" />
        </g>
      </g>
      <g transform="translate(34,-244) rotate(-14)">
        <g class="anim-arm-r">
          <path d="M-8 0 q-6 40 -2 74 q1 10 9 10 q8 0 9 -10 q4 -34 -2 -74 Z" fill="${SKIN}" />
          <circle cy="86" r="10" fill="#ffe3d2" />
          <path d="M-6 84 q6 6 12 0" stroke="#e6b7a6" stroke-width="1.6" fill="none" opacity=".8" />
        </g>
      </g>
    </g>`;
}

function head() {
  return `
    <g class="barbie__head">
      <g class="anim-head">
        <path d="M-9 -272 h18 v14 q-9 8 -18 0 Z" fill="#f7cdb8" />
        <ellipse cy="-318" rx="46" ry="53" fill="${SKIN}" />
        <path d="M-46 -326 q46 -34 92 0 q-6 -40 -46 -44 q-40 4 -46 44 Z" fill="#ffe9db" />
        <path d="M-46 -318 q-8 40 12 62 q-30 -12 -34 -50 Z" fill="#f2c9b4" opacity=".5" />
        <path d="M46 -318 q8 40 -12 62 q30 -12 34 -50 Z" fill="#f2c9b4" opacity=".5" />

        <!-- mata -->
        <g class="eyes">
          <g class="eyes__open">
            <ellipse cx="-19" cy="-325" rx="10.6" ry="11" fill="#fff" />
            <ellipse cx="19" cy="-325" rx="10.6" ry="11" fill="#fff" />
            <g class="eyes__iris">
              <circle cx="-18" cy="-322" r="7.2" fill="#4ec6e0" />
              <circle cx="20" cy="-322" r="7.2" fill="#4ec6e0" />
              <circle cx="-18" cy="-322" r="3.4" fill="#12222c" />
              <circle cx="20" cy="-322" r="3.4" fill="#12222c" />
              <circle cx="-21" cy="-326" r="2.6" fill="#fff" />
              <circle cx="17" cy="-326" r="2.6" fill="#fff" />
            </g>
            <g class="lashes" stroke="#1a1420" fill="none" stroke-linecap="round">
              <path d="M-30 -333 q11 -8 22 -1" stroke-width="3.4" />
              <path d="M-28 -336 q4 -5 9 -6" stroke-width="2.2" />
              <path d="M8 -334 q11 -7 22 1" stroke-width="3.4" />
              <path d="M22 -336 q4 -5 9 -6" stroke-width="2.2" />
            </g>
          </g>
          <g class="eyes__lid">
            <path d="M-31 -322 q12 12 24 0" stroke="#8d5a48" stroke-width="3" fill="none" stroke-linecap="round" />
            <path d="M7 -322 q12 12 24 0" stroke="#8d5a48" stroke-width="3" fill="none" stroke-linecap="round" />
          </g>
          <g class="eyes__happy" stroke="#1a1420" stroke-width="3.4" fill="none" stroke-linecap="round">
            <path d="M-30 -322 q11 -13 22 0" />
            <path d="M8 -322 q11 -13 22 0" />
          </g>
          <g class="eyes__closed" stroke="#8d5a48" stroke-width="3" fill="none" stroke-linecap="round">
            <path d="M-30 -320 q11 11 22 0" />
            <path d="M8 -320 q11 11 22 0" />
          </g>
          <g class="eyes__sad">
            <ellipse cx="-19" cy="-322" rx="9" ry="9" fill="#fff" />
            <ellipse cx="19" cy="-322" rx="9" ry="9" fill="#fff" />
            <circle cx="-19" cy="-320" r="5.4" fill="#4ec6e0" />
            <circle cx="19" cy="-320" r="5.4" fill="#4ec6e0" />
            <path d="M-31 -334 q12 -4 24 4" stroke="#1a1420" stroke-width="2.6" fill="none" stroke-linecap="round" />
            <path d="M7 -330 q12 -8 24 -4" stroke="#1a1420" stroke-width="2.6" fill="none" stroke-linecap="round" />
          </g>
          <g class="eyes__sick" stroke="#1a1420" stroke-width="2.6" fill="none" stroke-linecap="round">
            <path d="M-28 -330 q8 6 0 12 q-8 6 0 0" />
            <path d="M28 -330 q-8 6 0 12 q8 6 0 0" />
          </g>
          <path class="eyes__tear" d="M-34 -310 q-6 12 1 15 q7 -3 1 -15 Z" fill="#8fd8ff" />
        </g>

        <g class="brows" stroke="#d8a63f" stroke-width="3" fill="none" stroke-linecap="round">
          <path class="brow brow-l" d="M-31 -350 q12 -9 23 -2" />
          <path class="brow brow-r" d="M8 -352 q12 -7 23 2" />
        </g>

        <path d="M-1 -318 q-4 12 3 14" stroke="#e6a78f" stroke-width="2.4" fill="none" stroke-linecap="round" />

        <!-- bibir -->
        <g class="mouth">
          <g class="mouth__calm">
            <path d="M-11 -298 q11 -6 22 0 q-11 9 -22 0 Z" fill="#ff4f9d" />
            <path d="M-11 -298 q11 5 22 0" stroke="#d62e7f" stroke-width="1.6" fill="none" />
          </g>
          <g class="mouth__joy">
            <path d="M-13 -300 q13 -6 26 0 q-8 16 -13 16 q-5 0 -13 -16 Z" fill="#ff4f9d" />
            <path d="M-8 -296 q8 3 16 0 q-6 8 -16 0 Z" fill="#fff" />
          </g>
          <path class="mouth__sad" d="M-10 -294 q10 -10 20 0" stroke="#d62e7f" stroke-width="3.4" fill="none" stroke-linecap="round" />
          <ellipse class="mouth__open" cx="0" cy="-292" rx="9" ry="11" fill="#8e2450" />
          <ellipse class="mouth__tongue" cx="0" cy="-286" rx="6" ry="4" fill="#ff7ae0" />
          <path class="mouth__sleep" d="M-6 -294 q6 6 12 0" stroke="#d62e7f" stroke-width="3" fill="none" stroke-linecap="round" />
          <path class="mouth__sick" d="M-10 -292 q5 -6 10 0 q5 6 10 0" stroke="#d62e7f" stroke-width="2.8" fill="none" stroke-linecap="round" transform="translate(-5 0)" />
        </g>

        <g class="blush" fill="#ff8ec7" opacity=".45">
          <ellipse cx="-33" cy="-302" rx="11" ry="6.5" />
          <ellipse cx="33" cy="-302" rx="11" ry="6.5" />
        </g>
        <circle class="beauty-mark" cx="27" cy="-289" r="1.8" fill="#a86f52" />

        <!-- rambut depan: poni menyapu + helai pengikat -->
        <g class="barbie__hair-front">
          <path d="M-50 -336 q2 -44 50 -48 q48 4 50 48 q-10 -26 -30 -32 q-20 22 -46 24 q-16 4 -24 8 Z" fill="${HAIR}" />
          <path d="M-4 -382 q46 4 50 46 q-8 -22 -28 -30 q6 -10 -22 -16 Z" fill="#f7dd94" opacity=".85" />
          <path d="M-50 -336 q-6 34 4 66 q8 -32 10 -50 Z" fill="${HAIR}" />
          <path d="M50 -336 q6 34 -4 66 q-8 -32 -10 -50 Z" fill="${HAIR}" />
          <path d="M-46 -338 q-4 30 2 54" stroke="#e0b04d" stroke-width="2.4" fill="none" opacity=".6" />
          <path d="M46 -338 q4 30 -2 54" stroke="#e0b04d" stroke-width="2.4" fill="none" opacity=".6" />
          <path d="M-26 -368 q26 -12 52 -2" stroke="#fff6d8" stroke-width="3.4" fill="none" opacity=".65" stroke-linecap="round" />
        </g>

        <!-- anting -->
        <g class="barbie__earring">
          <path d="M-46 -300 q-4 12 2 16" stroke="#ffd7ee" stroke-width="2" fill="none" />
          <circle cx="-44" cy="-282" r="4" fill="#ff5fae" />
          <path d="M46 -300 q4 12 -2 16" stroke="#ffd7ee" stroke-width="2" fill="none" />
          <circle cx="44" cy="-282" r="4" fill="#ff5fae" />
        </g>
      </g>
    </g>`;
}

function necklaces() {
  return `
    <g class="barbie__necklace">
      <path d="M-21 -266 q21 17 42 0" stroke="#ffd9ee" stroke-width="2.8" fill="none" />
      <path d="M0 -252 l7 9 l-7 8 l-7 -8 Z" fill="#ff5fae" />
      <path d="M0 -252 l7 9 l-7 8 Z" fill="#ffb6d5" opacity=".85" />
    </g>`;
}

function outfits() {
  return `
    <g class="barbie__outfits">
      <g data-outfit="gaun-pink">
        <path d="M-27 -252 q27 14 54 0 q6 26 2 44 q-28 14 -58 0 q-4 -20 2 -44 Z" fill="#ff2e97" />
        <path d="M-27 -252 q27 14 54 0 q2 10 1 16 q-28 12 -56 0 q-1 -8 1 -16 Z" fill="#ff5fae" />
        <path d="M-24 -208 q24 12 48 0 q30 54 26 96 q-50 22 -100 0 q-4 -44 26 -96 Z" fill="#ff2e97" />
        <path d="M-24 -208 q24 12 48 0 q22 40 24 74 q-48 20 -96 0 q2 -34 24 -74 Z" fill="#ff5fae" opacity=".85" />
        <path d="M-46 -140 q46 22 92 0 q10 26 8 42 q-54 20 -108 0 q-2 -16 8 -42 Z" fill="#ffb6d5" opacity=".75" />
        <path d="M-26 -212 q26 10 52 0 q1 10 0 15 q-26 9 -52 0 q-1 -6 0 -15 Z" fill="#1a1420" />
        <path d="M0 -207 c-4 -3 -9 -1 -9 3 c0 5 9 10 9 10 c0 0 9 -5 9 -10 c0 -4 -5 -6 -9 -3 Z" fill="#ff8ec7" />
        <g class="sparkles" fill="#fff6fa" opacity=".9">
          <circle cx="-12" cy="-168" r="2" />
          <circle cx="14" cy="-150" r="1.8" />
          <circle cx="0" cy="-128" r="2.2" />
        </g>
      </g>
      <g data-outfit="gaun-hitam">
        <path d="M-27 -252 q27 14 54 0 q6 26 2 44 q-28 14 -58 0 q-4 -20 2 -44 Z" fill="#1a1420" />
        <path d="M-24 -208 q24 12 48 0 q34 62 30 108 q-54 24 -108 0 q-4 -46 30 -108 Z" fill="#241d28" />
        <path d="M-24 -208 q24 12 48 0 q10 20 14 40 q-38 16 -76 0 q4 -22 14 -40 Z" fill="#3a2f3d" opacity=".7" />
        <path d="M10 -196 q22 44 22 96 l-16 -2 q2 -48 -14 -84 Z" fill="#ffe0ef" opacity=".5" />
        <path d="M-24 -206 q24 12 48 0 l-2 10 q-22 10 -44 0 Z" fill="#ff2e97" />
      </g>
      <g data-outfit="set-kasual">
        <path d="M-30 -252 q30 16 60 0 q8 30 4 50 q-32 16 -68 0 q-4 -22 4 -50 Z" fill="#fff6fa" />
        <path d="M-30 -252 q30 16 60 0 q2 10 2 16 q-32 14 -64 0 q0 -8 2 -16 Z" fill="#ff8ec7" />
        <path d="M-16 -216 q16 8 32 0 l-2 -12 q-14 6 -28 0 Z" fill="#ff2e97" opacity=".8" />
        <path d="M-26 -202 q26 12 52 0 q14 26 12 44 q-38 16 -76 0 q-2 -20 12 -44 Z" fill="#241d28" />
        <path d="M-30 -158 q30 14 60 0 l4 26 q-34 14 -68 0 Z" fill="#ff5fae" opacity=".9" />
        <path d="M-38 -132 q38 18 76 0 q6 12 4 20 q-42 18 -84 0 q-2 -10 4 -20 Z" fill="#ffb6d5" />
      </g>
      <g data-outfit="gaun-puteri">
        <path d="M-60 -250 q60 -26 120 0 q-6 30 -20 40 q-40 14 -80 0 q-14 -12 -20 -40 Z" fill="#ff8ec7" opacity=".55" />
        <path d="M-27 -252 q27 14 54 0 q6 26 2 44 q-28 14 -58 0 q-4 -20 2 -44 Z" fill="#ffd6ef" />
        <path d="M-24 -208 q24 12 48 0 q40 68 44 116 q-68 26 -136 0 q4 -48 44 -116 Z" fill="#ffb6d5" />
        <path d="M-24 -208 q24 12 48 0 q26 44 32 78 q-56 20 -112 0 q6 -34 32 -78 Z" fill="#ffd6ef" opacity=".9" />
        <path d="M-56 -130 q56 24 112 0 q8 20 6 32 q-62 24 -124 0 q-2 -12 6 -32 Z" fill="#fff2f8" opacity=".8" />
        <path d="M-22 -214 q22 10 44 0 l-4 -10 q-18 8 -36 0 Z" fill="#ff2e97" />
        <g class="sparkles" fill="#fff">
          <circle cx="-18" cy="-160" r="2.4" />
          <circle cx="16" cy="-136" r="2" />
          <circle cx="-4" cy="-112" r="2.6" />
          <circle cx="28" cy="-180" r="1.8" />
        </g>
      </g>
      <g data-outfit="piyama-sutra">
        <path d="M-30 -252 q30 16 60 0 q8 30 4 50 q-32 16 -68 0 q-4 -22 4 -50 Z" fill="#c9b8ff" />
        <path d="M-30 -252 q30 16 60 0 q2 12 2 18 q-32 14 -64 0 q0 -8 2 -18 Z" fill="#e4dcff" />
        <path d="M-26 -202 q26 12 52 0 q16 44 12 78 q-38 16 -76 0 q-4 -34 12 -78 Z" fill="#c9b8ff" />
        <path d="M-32 -130 q32 14 64 0 q6 34 2 62 q-34 14 -68 0 q-6 -28 2 -62 Z" fill="#d5c8ff" />
        <g stroke="#ff8ec7" stroke-width="2.6" fill="none" opacity=".85">
          <path d="M-14 -170 q8 8 18 0" />
          <path d="M-8 -108 q8 8 18 0" />
          <path d="M4 -148 q8 8 18 0" />
        </g>
      </g>
    </g>`;
}

function heldItem() {
  return `
    <g class="barbie__item" data-item="compact">
      <g transform="translate(-56,-160) rotate(-14)">
        <circle r="15" fill="#ff2e97" />
        <circle r="11" fill="#ffd6ef" />
        <path d="M-6 -6 q6 4 12 0" stroke="#ff8ec7" stroke-width="2" fill="none" />
      </g>
    </g>`;
}

function accessories() {
  return `
    <g class="barbie__accessories">
      <g data-acc="mahkota-berbie">
        <path d="M-30 -368 q30 -12 60 0 l-4 16 q-26 -10 -52 0 Z" fill="#ffd07a" />
        <path d="M-30 -368 l10 -22 l10 16 l10 -24 l10 24 l10 -16 l10 22 Z" fill="#ffe28a" />
        <circle cy="-384" r="5" fill="#ff5fae" />
        <circle cx="-20" cy="-376" r="3.4" fill="#fff" opacity=".9" />
        <circle cx="20" cy="-376" r="3.4" fill="#fff" opacity=".9" />
      </g>
      <g data-acc="kacamata-berbie">
        <path d="M-40 -330 q14 -6 26 0 q2 14 -12 14 q-16 0 -14 -14 Z" fill="#ff2e97" opacity=".85" />
        <path d="M14 -330 q14 -6 26 0 q2 14 -12 14 q-16 0 -14 -14 Z" fill="#ff2e97" opacity=".85" />
        <path d="M-14 -326 h28" stroke="#ff2e97" stroke-width="4" stroke-linecap="round" />
        <path d="M-40 -328 l-12 -6" stroke="#ff2e97" stroke-width="4" stroke-linecap="round" />
        <path d="M40 -328 l12 -6" stroke="#ff2e97" stroke-width="4" stroke-linecap="round" />
      </g>
      <g data-acc="tas-mini">
        <g transform="translate(52,-150)">
          <path d="M-16 -18 q16 -18 32 0" stroke="#1a1420" stroke-width="4" fill="none" />
          <rect x="-20" y="-16" width="40" height="30" rx="8" fill="#ff2e97" />
          <rect x="-20" y="-6" width="40" height="5" fill="#ffd6ef" opacity=".8" />
          <path d="M-5 6 l5 6 l5 -6 Z" fill="#ffd6ef" />
        </g>
        <path d="M34 -230 q22 -8 26 22" stroke="#1a1420" stroke-width="3.4" fill="none" opacity=".6" />
      </g>
      <g data-acc="tongkat-sihir">
        <g transform="translate(56,-178) rotate(18)">
          <rect x="-3" y="-4" width="6" height="96" rx="3" fill="#1a1420" />
          <path d="M0 -34 l9 18 l20 3 l-15 14 l4 20 l-18 -10 l-18 10 l4 -20 l-15 -14 l20 -3 Z" fill="#ffd07a" />
          <path d="M0 -26 l5 12 l13 2 l-10 9 l3 12 l-11 -6 l-11 6 l3 -12 l-10 -9 l13 -2 Z" fill="#fff2f8" opacity=".85" />
        </g>
      </g>
    </g>`;
}

/** Isi <g class="char char--barbie"> ; overlay umum ditambahkan pemanggil. */
export function barbieBody() {
  return `${hairBack()}${legsAndShoes()}${torso()}${outfits()}${necklaces()}${arms()}${head()}${accessories()}${heldItem()}`;
}

export const BARBIE_ANCHORS = {
  mouth: { x: 0, y: -296 },
  head: { x: 0, y: -318 },
  hand: { x: -56, y: -160 },
};
