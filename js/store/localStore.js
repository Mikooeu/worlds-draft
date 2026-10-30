// Transport local (même navigateur) : état dans un stockage partagé + BroadcastChannel.
// Sert aux tests bout en bout et au mode ?local=1, sans réseau.
import { applyAction } from '../logic/game.js?v=202610301522';

export function memoryStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

const chains = new Map();
function processLock(name, fn) {
  const prev = chains.get(name) || Promise.resolve();
  const run = prev.then(fn, fn);
  chains.set(name, run.catch(() => {}));
  return run;
}
function defaultLock(name, fn) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) return navigator.locks.request(name, fn);
  return processLock(name, fn);
}

export function createLocalStore({ playerId, storage = globalThis.localStorage || memoryStorage(), lock = defaultLock } = {}) {
  const key = c => 'wd.game.' + c;
  const read = c => { const v = storage.getItem(key(c)); return v ? JSON.parse(v) : null; };
  const listeners = new Map();   // code -> Set(cb)
  const channels = new Map();    // code -> BroadcastChannel
  const notifyLocal = c => { const s = read(c); for (const cb of listeners.get(c) || []) cb(s); };
  const channel = c => {
    if (!channels.has(c)) {
      const ch = new BroadcastChannel('wd-' + c);
      ch.onmessage = () => notifyLocal(c);
      channels.set(c, ch);
    }
    return channels.get(c);
  };
  const write = (c, s) => { storage.setItem(key(c), JSON.stringify(s)); channel(c).postMessage(1); notifyLocal(c); };

  return {
    playerId,
    async create(state) { write(state.code, state); },
    async exists(code) { return read(code) !== null; },
    subscribe(code, cb) {
      channel(code);
      if (!listeners.has(code)) listeners.set(code, new Set());
      listeners.get(code).add(cb);
      queueMicrotask(() => cb(read(code)));
      return () => listeners.get(code)?.delete(cb);
    },
    now: () => Date.now(),
    dispatch(code, action, ctx) {
      return lock('wd-' + code, async () => {
        const cur = read(code);
        if (!cur) return false;
        const next = applyAction(cur, action, ctx);
        if (next === cur) return false;
        write(code, next);
        return true;
      });
    },
    close() { for (const ch of channels.values()) ch.close(); channels.clear(); },
  };
}
