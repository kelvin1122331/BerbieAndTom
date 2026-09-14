/**
 * Karakter Tom si Panda — SVG digambar tangan, origin (0,0) di telapak kaki,
 * tubuh menghadap ke atas dengan koordinat Y negatif.
 *
 * Aturan penting: grup yang dianimasikan lewat CSS tidak boleh punya atribut
 * `transform` (CSS transform menimpa atribut), jadi offset statis selalu dibungkus <g> luar.
 */

const FUR_LIGHT = 'url(#gradFurLight)';
const FUR_DARK = 'url(#gradFurDark)';

/** Titik noda saat mandi (lokasi di koordinat karakter). */
export const DIRT_SPOTS = [
  { x: -58, y: -214, r: 17 },
  { x: 62, y: -186, r: 15 },
  { x: -78, y: -108, r: 19 },
  { x: 30, y: -66, r: 16 },
  { x: 86, y: -120, r: 14 },
  { x: -18, y: -300, r: 13 },
  { x: 54, y: -28, r: 17 },
  { x: -40, y: -340, r: 12 },
];

function ears() {
  return `
    <g class="panda__ears">
      <g transform="translate(-74,-330)">
        <g class="anim-ear-l">
          <circle r="33" fill="${FUR_DARK}" />
          <circle r="19" fill="#3a2f3d" opacity=".55" />
          <circle r="10" fill="#ff8ec7" opacity=".35" />
        </g>
      </g>
      <g transform="translate(74,-330)">
        <g class="anim-ear-r">
          <circle r="33" fill="${FUR_DARK}" />
          <circle r="19" fill="#3a2f3d" opacity=".55" />
          <circle r="10" fill="#ff8ec7" opacity=".3" />
        </g>
      </g>
    </g>`;
}

function legs() {
  return `
    <g class="panda__legs">
      <g transform="translate(-54,-24)">
        <g class="anim-leg-l">
          <ellipse rx="46" ry="34" fill="${FUR_DARK}" />
          <ellipse cy="6" rx="26" ry="17" fill="#463a4a" opacity=".6" />
          <g class="paw-pads" fill="#ff9ec4" opacity=".8">
            <ellipse cx="-12" cy="-8" rx="5.5" ry="4.5" />
            <ellipse cx="0" cy="-12" rx="5.5" ry="4.5" />
            <ellipse cx="12" cy="-8" rx="5.5" ry="4.5" />
          </g>
        </g>
      </g>
      <g transform="translate(54,-24)">
        <g class="anim-leg-r">
          <ellipse rx="46" ry="34" fill="${FUR_DARK}" />
          <ellipse cy="6" rx="26" ry="17" fill="#463a4a" opacity=".6" />
          <g class="paw-pads" fill="#ff9ec4" opacity=".8">
            <ellipse cx="-12" cy="-8" rx="5.5" ry="4.5" />
            <ellipse cx="0" cy="-12" rx="5.5" ry="4.5" />
            <ellipse cx="12" cy="-8" rx="5.5" ry="4.5" />
          </g>
        </g>
      </g>
    </g>`;
}

function body() {
  return `
    <g class="panda__body">
      <ellipse cy="-116" rx="106" ry="102" fill="${FUR_LIGHT}" />
      <ellipse cy="-110" rx="72" ry="70" fill="#fffdfd" opacity=".95" />
      <path d="M-96 -176 q40 -22 96 -18 q52 4 94 24 q-24 -66 -96 -70 q-72 -4 -94 64 Z" fill="#efe2ea" opacity=".55" />
      <g class="fur-lines" stroke="#d9c7d4" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7">
        <path d="M-44 -60 q10 8 22 2" />
        <path d="M14 -52 q12 8 24 -2" />
        <path d="M-58 -150 q-12 10 -8 26" />
        <path d="M56 -146 q12 12 6 28" />
      </g>
      <ellipse cy="-40" rx="60" ry="18" fill="#e7d7e2" opacity=".5" />
    </g>`;
}

function arms() {
  return `
    <g class="panda__arms">
      <g transform="translate(-100,-166) rotate(-14)">
        <g class="anim-arm-l">
          <ellipse rx="30" ry="52" fill="${FUR_DARK}" />
          <ellipse cy="34" rx="24" ry="21" fill="#241d28" />
          <g fill="#ff9ec4" opacity=".75">
            <ellipse cx="-9" cy="44" rx="4" ry="3" />
            <ellipse cx="2" cy="47" rx="4" ry="3" />
            <ellipse cx="12" cy="43" rx="4" ry="3" />
          </g>
        </g>
      </g>
      <g transform="translate(100,-166) rotate(14)">
        <g class="anim-arm-r">
          <ellipse rx="30" ry="52" fill="${FUR_DARK}" />
          <ellipse cy="34" rx="24" ry="21" fill="#241d28" />
          <g fill="#ff9ec4" opacity=".75">
            <ellipse cx="-9" cy="44" rx="4" ry="3" />
            <ellipse cx="2" cy="47" rx="4" ry="3" />
            <ellipse cx="12" cy="43" rx="4" ry="3" />
          </g>
        </g>
      </g>
    </g>`;
}

function head() {
  return `
    <g class="panda__head">
      <g class="anim-head">
        ${ears()}
        <ellipse cy="-268" rx="99" ry="87" fill="${FUR_LIGHT}" />
        <path d="M-92 -300 q92 -46 184 0 q-10 -56 -92 -60 q-82 4 -92 60 Z" fill="#fffdfd" />
        <path d="M-99 -260 q10 44 46 62 q-58 -6 -70 -44 Z" fill="#e9dae5" opacity=".6" />
        <path d="M99 -260 q-10 44 -46 62 q58 -6 70 -44 Z" fill="#e9dae5" opacity=".6" />

        <!-- bercak mata -->
        <g class="panda__patches">
          <ellipse cx="-42" cy="-282" rx="30" ry="36" transform="rotate(-16 -42 -282)" fill="${FUR_DARK}" />
          <ellipse cx="42" cy="-282" rx="30" ry="36" transform="rotate(16 42 -282)" fill="${FUR_DARK}" />
        </g>

        <!-- mata -->
        <g class="eyes">
          <g class="eyes__open">
            <ellipse cx="-42" cy="-280" rx="15" ry="16" fill="#fdfbff" />
            <ellipse cx="42" cy="-280" rx="15" ry="16" fill="#fdfbff" />
            <g class="eyes__iris">
              <circle cx="-40" cy="-278" r="9" fill="#1a1420" />
              <circle cx="44" cy="-278" r="9" fill="#1a1420" />
              <circle cx="-43" cy="-282" r="3.4" fill="#fff" />
              <circle cx="41" cy="-282" r="3.4" fill="#fff" />
              <circle cx="-36" cy="-274" r="1.8" fill="#ff8ec7" opacity=".9" />
              <circle cx="48" cy="-274" r="1.8" fill="#ff8ec7" opacity=".9" />
            </g>
          </g>
          <g class="eyes__lid" fill="none" stroke="#fdfbff" stroke-width="5" stroke-linecap="round">
            <path d="M-56 -280 q14 14 28 0" />
            <path d="M28 -280 q14 14 28 0" />
          </g>
          <g class="eyes__happy" stroke="#fdfbff" stroke-width="6" fill="none" stroke-linecap="round">
            <path d="M-54 -278 q12 -14 24 0" />
            <path d="M30 -278 q12 -14 24 0" />
          </g>
          <g class="eyes__closed" stroke="#fdfbff" stroke-width="5.5" fill="none" stroke-linecap="round">
            <path d="M-54 -278 q12 12 24 0" />
            <path d="M30 -278 q12 12 24 0" />
          </g>
          <g class="eyes__sad" stroke="#fdfbff" stroke-width="5" fill="none" stroke-linecap="round">
            <path d="M-54 -286 q12 10 24 2" />
            <path d="M30 -284 q12 8 24 -2" />
            <circle cx="-42" cy="-280" r="6" fill="#1a1420" />
            <circle cx="42" cy="-280" r="6" fill="#1a1420" />
          </g>
          <g class="eyes__sick" stroke="#fdfbff" stroke-width="4.5" fill="none" stroke-linecap="round">
            <path d="M-52 -288 q8 8 0 16 q-8 8 0 0" />
            <path d="M52 -288 q-8 8 0 16 q8 8 0 0" />
          </g>
          <path class="eyes__tear" d="M-62 -266 q-6 12 2 15 q8 -3 2 -15 Z" fill="#8fd8ff" />
        </g>

        <!-- alis -->
        <g class="panda__brows" stroke="#3b3040" stroke-width="5" stroke-linecap="round" fill="none">
          <path class="brow brow-l" d="M-60 -316 q16 -10 32 -3" />
          <path class="brow brow-r" d="M28 -319 q16 -7 32 3" />
        </g>

        <!-- moncong -->
        <g class="panda__muzzle">
          <ellipse cy="-232" rx="40" ry="28" fill="#fffdfd" />
          <path d="M0 -256 q16 0 18 9 q-2 10 -18 10 q-16 0 -18 -10 q2 -9 18 -9 Z" fill="#241d28" />
          <path d="M0 -237 v9" stroke="#241d28" stroke-width="3.4" stroke-linecap="round" />
          <g class="whiskers" stroke="#d9c7d4" stroke-width="2" stroke-linecap="round" fill="none" opacity=".9">
            <path d="M-42 -240 l-24 -6" />
            <path d="M-42 -232 l-26 4" />
            <path d="M42 -240 l24 -6" />
            <path d="M42 -232 l26 4" />
          </g>
        </g>

        <!-- mulut per ekspresi -->
        <g class="mouth">
          <path class="mouth__calm" d="M-16 -228 q16 14 32 0" stroke="#241d28" stroke-width="4.2" fill="none" stroke-linecap="round" />
          <path class="mouth__joy" d="M-22 -232 q22 30 44 0 q-22 12 -44 0 Z" fill="#241d28" />
          <path class="mouth__joy-t" d="M-10 -220 q10 12 20 0 q-10 6 -20 0 Z" fill="#ff7ae0" />
          <path class="mouth__sad" d="M-18 -222 q18 -16 36 0" stroke="#241d28" stroke-width="4.2" fill="none" stroke-linecap="round" />
          <ellipse class="mouth__open" cy="-224" rx="17" ry="14" fill="#3a2130" />
          <ellipse class="mouth__tongue" cy="-217" rx="10" ry="6" fill="#ff7ae0" />
          <path class="mouth__sleep" d="M-9 -226 q9 8 18 0" stroke="#241d28" stroke-width="3.6" fill="none" stroke-linecap="round" />
          <path class="mouth__sick" d="M-16 -224 q8 -8 16 0 q8 8 16 0" stroke="#241d28" stroke-width="3.6" fill="none" stroke-linecap="round" transform="translate(-8 0)" />
        </g>

        <g class="blush" fill="#ff8ec7" opacity=".5">
          <ellipse cx="-74" cy="-248" rx="18" ry="10" />
          <ellipse cx="74" cy="-248" rx="18" ry="10" />
        </g>
      </g>
    </g>`;
}

function heldItem() {
  return `
    <g class="panda__item" data-item="bambu">
      <g transform="translate(126,-120) rotate(24)">
        <rect x="-6" y="-58" width="12" height="112" rx="6" fill="#8fd08a" />
        <rect x="-6" y="-30" width="12" height="5" fill="#6fb96c" />
        <rect x="-6" y="4" width="12" height="5" fill="#6fb96c" />
        <rect x="-6" y="38" width="12" height="5" fill="#6fb96c" />
        <path d="M4 -52 q26 -12 34 4 q-22 10 -34 -4 Z" fill="#a8e6a0" />
        <path d="M-4 -44 q-24 -14 -34 2 q22 12 34 -2 Z" fill="#95dc90" />
      </g>
    </g>`;
}

function outfits() {
  return `
    <g class="panda__outfits">
      <!-- tanpa baju: hanya kalung bulu -->
      <g data-outfit="bulu-alami">
        <path d="M-56 -198 q56 26 112 0" stroke="#e6d5e1" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8" />
      </g>
      <g data-outfit="piyama-bintang">
        <path d="M-100 -192 q100 40 200 0 q14 60 -6 88 q-94 34 -188 0 q-20 -30 -6 -88 Z" fill="#6f5fd0" />
        <path d="M-100 -192 q100 40 200 0 q4 18 2 30 q-102 36 -204 0 q-2 -14 2 -30 Z" fill="#7d6ddd" />
        <g fill="#ffe28a">
          <path d="M-52 -158 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 Z" />
          <path d="M34 -134 l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1 Z" />
          <circle cx="-16" cy="-124" r="3.4" />
          <circle cx="66" cy="-166" r="3" />
        </g>
        <path d="M-40 -200 q40 22 80 0 l-8 -14 q-32 14 -64 0 Z" fill="#f4efff" />
      </g>
      <g data-outfit="hoodie-pink">
        <path d="M-108 -196 q108 46 216 0 q16 74 -8 106 q-100 34 -200 0 q-24 -34 -8 -106 Z" fill="#ff8ec7" />
        <path d="M-108 -196 q108 46 216 0 q4 22 4 34 q-112 42 -224 0 q0 -14 4 -34 Z" fill="#ffa7d0" />
        <path d="M-30 -176 q30 20 60 0 l-6 62 q-24 10 -48 0 Z" fill="#f36cb0" opacity=".65" />
        <g stroke="#fff2f8" stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M-16 -172 l-4 40" />
          <path d="M16 -172 l4 40" />
        </g>
        <path d="M-72 -206 q72 -34 144 0 q-72 26 -144 0 Z" fill="#ffb6d5" />
      </g>
      <g data-outfit="setelan-hitam">
        <path d="M-104 -194 q104 44 208 0 q14 68 -6 100 q-98 32 -196 0 q-16 -34 -6 -100 Z" fill="#241d28" />
        <path d="M-26 -186 l26 34 l26 -34 l-14 -8 h-24 Z" fill="#fbf7fa" />
        <path d="M-14 -152 l14 62 l14 -62 l-14 8 Z" fill="#ff5fae" />
        <path d="M-46 -196 q46 26 92 0 l-10 -12 q-36 16 -72 0 Z" fill="#181320" />
        <g fill="#ff8ec7">
          <circle cx="-62" cy="-120" r="4" />
          <circle cx="62" cy="-120" r="4" />
        </g>
      </g>
    </g>`;
}

function accessories() {
  return `
    <g class="panda__accessories">
      <g data-acc="pita-panda">
        <g transform="translate(-58,-346) rotate(-18)">
          <path d="M0 0 q-34 -24 -34 6 q0 26 34 6 Z" fill="#ff5fae" />
          <path d="M0 0 q34 -24 34 6 q0 26 -34 6 Z" fill="#ff8ec7" />
          <circle r="9" fill="#f36cb0" />
        </g>
      </g>
      <g data-acc="kacamata-panda">
        <g class="glasses">
          <rect x="-72" y="-298" width="58" height="42" rx="16" fill="#120d16" opacity=".92" />
          <rect x="14" y="-298" width="58" height="42" rx="16" fill="#120d16" opacity=".92" />
          <path d="M-14 -284 q14 -8 28 0" stroke="#120d16" stroke-width="6" fill="none" />
          <path d="M-72 -288 l-26 -8" stroke="#120d16" stroke-width="6" stroke-linecap="round" />
          <path d="M72 -288 l26 -8" stroke="#120d16" stroke-width="6" stroke-linecap="round" />
          <path d="M-64 -292 q16 -8 30 -2" stroke="#ff8ec7" stroke-width="4" fill="none" opacity=".8" />
          <path d="M22 -292 q16 -8 30 -2" stroke="#ff8ec7" stroke-width="4" fill="none" opacity=".8" />
        </g>
      </g>
      <g data-acc="topi-panda">
        <path d="M-72 -334 q72 -70 144 0 Z" fill="#ff8ec7" />
        <path d="M-96 -332 q96 -30 192 0 q-96 22 -192 0 Z" fill="#ffb6d5" />
        <path d="M-40 -368 q40 -22 80 -4" stroke="#f36cb0" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7" />
        <circle cy="-378" r="9" fill="#fff2f8" />
      </g>
      <g data-acc="tas-bambu">
        <path d="M-96 -186 q-30 34 -14 76 q30 14 46 -6 Z" fill="#2c2230" />
        <rect x="-118" y="-160" width="34" height="46" rx="10" fill="#3a2f3d" />
        <path d="M-118 -140 h34" stroke="#ff8ec7" stroke-width="5" />
        <path d="M-84 -184 q24 -20 46 -8" stroke="#2c2230" stroke-width="9" fill="none" stroke-linecap="round" />
      </g>
    </g>`;
}

/** Isi <g class="char char--panda"> ; overlay umum ditambahkan pemanggil. */
export function pandaBody() {
  return `${legs()}${body()}${outfits()}${arms()}${head()}${heldItem()}${accessories()}`;
}

export const PANDA_ANCHORS = {
  /** posisi mulut untuk animasi makanan terbang */
  mouth: { x: 0, y: -228 },
  head: { x: 0, y: -268 },
  hand: { x: 126, y: -120 },
};
