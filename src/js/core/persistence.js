/**
 * Simpan/ambil state dari Web Storage. Setiap karakter punya slot sendiri
 * (`berbie-tom:save:v3:panda` dan `...:barbie`) supaya ganti karakter tidak menghapus progres.
 * Semua akses dibungkus try/catch: mode privat, storage penuh, atau file:// tidak boleh merusak game.
 */

import { sanitizeState, SAVE_VERSION, CHARACTERS } from './state.js';
import { getCharacter } from '../data/characters.js';

const PREFIX = `berbie-tom:save:v${SAVE_VERSION}`;
const LAST_KEY = `berbie-tom:last`;

export function saveKey(character) {
  return `${PREFIX}:${character}`;
}

export function safeStorage(kind = 'local') {
  try {
    const store = window.localStorage;
    const probe = '__bt_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch (error) {
    return memoryShim();
  }
}

/** Fallback bila storage diblokir: progres tetap hidup selama tab terbuka. */
function memoryShim() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function read(storage, key) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch (error) {
    return null;
  }
}

function write(storage, key, value) {
  try {
    storage?.setItem?.(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

export function parseMeta(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Number(parsed.v) !== SAVE_VERSION || !CHARACTERS.includes(parsed.character)) return null;
    return {
      character: parsed.character,
      name: typeof parsed.name === 'string' ? parsed.name : getCharacter(parsed.character).name,
      day: Number(parsed.day) || 1,
      level: Number(parsed.level) || 1,
      coins: Number(parsed.coins) || 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch (error) {
    return null;
  }
}

/** Ambil state tersimpan untuk satu karakter (null bila tidak ada/rusak). */
export function loadFor(storage, character) {
  const raw = read(storage, saveKey(character));
  if (!raw) return null;
  try {
    const clean = sanitizeState(JSON.parse(raw));
    return clean && clean.character === character ? clean : null;
  } catch (error) {
    return null;
  }
}

export function saveState(storage, state) {
  if (!state?.character) return false;
  const payload = { ...state, updatedAt: new Date().toISOString() };
  const ok = write(storage, saveKey(state.character), JSON.stringify(payload));
  if (ok) write(storage, LAST_KEY, state.character);
  return ok;
}

export function lastCharacter(storage) {
  const value = read(storage, LAST_KEY);
  return value === 'panda' || value === 'barbie' ? value : null;
}

export function summaries(storage) {
  return {
    panda: parseMeta(read(storage, saveKey('panda'))),
    barbie: parseMeta(read(storage, saveKey('barbie'))),
  };
}

export function clearFor(storage, character) {
  try {
    storage?.removeItem?.(saveKey(character));
    return true;
  } catch (error) {
    return false;
  }
}
