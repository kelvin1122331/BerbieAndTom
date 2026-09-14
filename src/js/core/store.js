/** State store mini: satu sumber kebenaran + notifikasi ke renderer. */

export function createStore(initialState) {
  let state = initialState;
  let seq = 0;
  const listeners = new Set();

  function emit(changed) {
    seq += 1;
    const payload = { state, seq, changed };
    for (const fn of listeners) {
      try {
        fn(payload);
      } catch (error) {
        console.error('[store] listener error', error);
      }
    }
  }

  return {
    get state() {
      return state;
    },
    get seq() {
      return seq;
    },
    subscribe(fn, { immediate = true } = {}) {
      listeners.add(fn);
      if (immediate) fn({ state, seq, changed: ['*'] });
      return () => listeners.delete(fn);
    },
    /** Mutasi state lewat fungsi. Return state (baru bila mutator mengembalikan objek). */
    update(mutator, ...changed) {
      const result = mutator(state);
      if (result && result !== state) state = result;
      emit(changed.length ? changed : ['*']);
      return state;
    },
    replace(next) {
      state = next;
      emit(['*']);
      return state;
    },
    size() {
      return listeners.size;
    },
  };
}
