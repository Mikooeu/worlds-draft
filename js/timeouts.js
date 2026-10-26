// Évite d'envoyer plusieurs fois le même timeout, tout en permettant de réessayer après un échec.
export function createTimeoutGate() {
  const sent = new Set();
  return {
    take(state) {
      const k = `${state.code}:${state.series ?? 0}:${state.games.length}:${state.phase}:${state.step}`;
      if (sent.has(k)) return null;
      sent.add(k); return k;
    },
    release(k) { sent.delete(k); },
  };
}
