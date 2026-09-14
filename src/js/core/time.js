/**
 * Sistem waktu (murni, tanpa DOM) — bisa diuji dengan unit test.
 *
 * Jam permainan berjalan realtime & terus berdetak: 1 detik nyata = 4 menit game (kecepatan normal).
 * Satu hari aktif: 05:00 (pagi) → 18:00 (malam). Saat jarum menyentuh 18:00,
 * karakter WAJIB tidur selama SLEEP_SECONDS detik, lalu otomatis kembali ke 05:00 pagi.
 */

export const HOUR = 60;
export const DAY_MINUTES = 24 * HOUR;

/** Bangun jam 05:00. */
export const WAKE_AT = 5 * HOUR;
/** Mulai malam (wajib tidur) jam 18:00. */
export const NIGHT_AT = 18 * HOUR;
/** Durasi tidur wajib, dalam detik nyata. */
export const SLEEP_SECONDS = 30;
/** Jeda "bersiap tidur" (gosok gigi, pakai piyama) sebelum tidur, dalam detik nyata. */
export const WIND_DOWN_SECONDS = 4;
/** Menit game yang berlalu per detik nyata pada kecepatan 1×. */
export const BASE_MINUTES_PER_SECOND = 4;

export const SPEEDS = [
  { id: 'lambat', label: 'Lambat', mul: 0.5, hint: '1 detik = 2 menit' },
  { id: 'normal', label: 'Normal', mul: 1, hint: '1 detik = 4 menit' },
  { id: 'cepat', label: 'Cepat', mul: 2, hint: '1 detik = 8 menit' },
  { id: 'turbo', label: 'Turbo', mul: 4, hint: '1 detik = 16 menit' },
];

export const PHASES = [
  {
    id: 'pagi',
    label: 'Pagi',
    icon: '🌅',
    from: WAKE_AT,
    to: 11 * HOUR,
    greeting: 'Selamat pagi',
    note: 'Waktunya sarapan dan berjemur',
    sky: ['#ffd9e8', '#ffeecb', '#cfe9ff'],
  },
  {
    id: 'siang',
    label: 'Siang',
    icon: '☀️',
    from: 11 * HOUR,
    to: 15 * HOUR,
    greeting: 'Selamat siang',
    note: 'Cuaca terik — jangan lupa minum',
    sky: ['#a7dcff', '#d5eeff', '#ffffff'],
  },
  {
    id: 'sore',
    label: 'Sore',
    icon: '🌇',
    from: 15 * HOUR,
    to: NIGHT_AT,
    greeting: 'Selamat sore',
    note: 'Saatnya bermain sebelum malam',
    sky: ['#ffb38f', '#ffd7a1', '#f7a8c4'],
  },
  {
    id: 'malam',
    label: 'Malam',
    icon: '🌙',
    from: NIGHT_AT,
    to: DAY_MINUTES + WAKE_AT,
    greeting: 'Selamat malam',
    note: 'Sudah malam — waktunya tidur',
    sky: ['#2b2040', '#3a2740', '#14101f'],
  },
];

export function speedById(id) {
  return SPEEDS.find((s) => s.id === id) ?? SPEEDS[1];
}

export function speedByMul(mul) {
  return SPEEDS.find((s) => s.mul === Number(mul)) ?? SPEEDS[1];
}

/** Menit game yang lewat per detik nyata. */
export function minutesPerSecond(mul = 1) {
  return BASE_MINUTES_PER_SECOND * (speedByMul(mul).mul || 1);
}

/** Menit game yang masih tersisa sebelum wajib tidur. */
export function minutesUntilNight(minutes) {
  return Math.max(0, NIGHT_AT - minutes);
}

/** Konversi menit game → detik nyata (dipakai untuk hitungan mundur di UI). */
export function gameMinutesToRealSeconds(gameMinutes, mul = 1) {
  return gameMinutes / minutesPerSecond(mul);
}

/** Fase untuk satu menit dalam sehari (0..1439). */
export function phaseOf(minutes) {
  const m = normalizeMinutes(minutes);
  for (const phase of PHASES) {
    const to = phase.to > DAY_MINUTES ? DAY_MINUTES : phase.to;
    if (phase.id === 'malam') {
      if (m >= NIGHT_AT || m < WAKE_AT) return 'malam';
    } else if (m >= phase.from && m < phase.to) {
      return phase.id;
    }
  }
  return 'malam';
}

export function phaseMeta(id) {
  return PHASES.find((p) => p.id === id) ?? PHASES[0];
}

export function normalizeMinutes(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m)) return WAKE_AT;
  return ((Math.round(m * 100) / 100) % DAY_MINUTES + DAY_MINUTES) % DAY_MINUTES;
}

/**
 * Buat objek jam baru.
 * @param {{minutes?:number, speed?:number, paused?:boolean, night?:boolean}} [opts]
 */
export function createClock(opts = {}) {
  const minutes = opts.minutes == null ? WAKE_AT : normalizeMinutes(opts.minutes);
  return {
    minutes,
    speed: Number(opts.speed) > 0 ? Number(opts.speed) : 1,
    paused: Boolean(opts.paused),
    /** true setelah jam menyentuh 18:00 (menunggu karakter tertidur). */
    night: minutes >= NIGHT_AT,
  };
}

/** Posisi matahari/bulan 0..1 sepanjang hari aktif (05:00 → 18:00). */
export function dayArc(minutes) {
  const span = NIGHT_AT - WAKE_AT;
  return clamp01((normalizeMinutes(minutes) - WAKE_AT) / span);
}

export function isNight(minutes) {
  const m = normalizeMinutes(minutes);
  return m >= NIGHT_AT || m < WAKE_AT;
}

export function formatTime(minutes) {
  const total = Math.floor(normalizeMinutes(minutes));
  const h = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** "1j 24m" / "48m" — untuk info sisa waktu. */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} mnt`;
  return `${h} j ${String(m).padStart(2, '0')} mnt`;
}

/** detik nyata → "01:32" */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Jalankan jam selama `dtSeconds` detik nyata.
 * Mengembalikan clock baru + daftar event yang terjadi (idempoten, tanpa efek samping).
 *
 * @returns {{clock:object, events:string[], phase:string, phaseChanged:boolean}}
 */
export function advanceClock(clock, dtSeconds, opts = {}) {
  const dt = Number.isFinite(dtSeconds) ? Math.max(0, Math.min(dtSeconds, 1)) : 0;
  const phaseBefore = phaseOf(clock.minutes);
  const events = [];

  if (clock.paused || clock.night) {
    return { clock: { ...clock }, events, phase: phaseBefore, phaseChanged: false };
  }

  let minutes = clock.minutes + dt * minutesPerSecond(clock.speed);
  let night = false;

  if (minutes >= NIGHT_AT) {
    minutes = NIGHT_AT;
    night = true;
    events.push('nightfall');
  }

  const phase = phaseOf(minutes);
  const phaseChanged = phase !== phaseBefore;
  if (phaseChanged) events.push(`phase:${phase}`);

  return {
    clock: { ...clock, minutes: normalizeMinutes(minutes), night },
    events,
    phase,
    phaseChanged,
  };
}

/**
 * Kemajuan tidur: 0 → 1 dalam SLEEP_SECONDS detik nyata.
 * @returns {{t:number, done:boolean, remaining:number}}
 */
export function sleepProgress(elapsedSeconds) {
  const t = clamp01(Math.max(0, elapsedSeconds) / SLEEP_SECONDS);
  return { t, done: t >= 1, remaining: Math.max(0, SLEEP_SECONDS - elapsedSeconds) };
}
