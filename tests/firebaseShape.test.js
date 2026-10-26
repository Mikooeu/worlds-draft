import test from 'node:test'; import assert from 'node:assert/strict';
import { createGame, applyAction, normalize } from '../js/logic/game.js';
import { createTimeoutGate } from '../js/timeouts.js';
import { miniData } from './fixtures/miniData.js';

// Simule le stockage Firebase : supprime null, tableaux/objets vides.
function strip(v) {
  if (v === null || v === undefined) return undefined;
  if (Array.isArray(v)) { const a = v.map(strip).filter(x => x !== undefined); return a.length ? a : undefined; }
  if (typeof v === 'object') {
    const o = {}; for (const [k, x] of Object.entries(v)) { const y = strip(x); if (y !== undefined) o[k] = y; }
    return Object.keys(o).length ? o : undefined;
  }
  return v;
}
const ctx = { data: miniData, champIds: Object.keys(miniData.champions), now: 1, rng: () => 0 };
const rt = (s) => strip(JSON.parse(JSON.stringify(s)));

test('seats survive a Firebase round-trip (null-stripping)', () => {
  let s = rt(createGame('ABCD', 'H', 1));
  assert.ok(normalize(s).seats.H, 'host seat restored');
  s = rt(applyAction(s, { type: 'join', playerId: 'G' }, ctx));
  assert.ok(normalize(s).seats.G, 'guest seat restored');
  s = rt(applyAction(s, { type: 'setTeam', playerId: 'G', team: 'BBB' }, ctx));
  s = rt(applyAction(s, { type: 'setTeam', playerId: 'H', team: 'AAA' }, ctx));
  assert.equal(normalize(s).seats.H.team, 'AAA'); assert.equal(normalize(s).seats.G.team, 'BBB');
  assert.equal(applyAction(s, { type: 'join', playerId: 'X' }, ctx), s);
});
test('rematch starts a new series number', () => {
  const s = { ...createGame('ABCD', 'H', 1), phase: 'seriesEnd', guestId: 'G' };
  const r = applyAction(s, { type: 'rematch', playerId: 'H' }, ctx);
  assert.equal(r.series, 1);
  assert.equal(applyAction({ ...r, phase: 'seriesEnd' }, { type: 'rematch', playerId: 'H' }, ctx).series, 2);
});
test('timeout gate: once per step, retry after failure, new key after rematch', () => {
  const g = createTimeoutGate();
  const st = { code: 'ABCD', series: 0, games: [{}], phase: 'draft', step: 3 };
  const k = g.take(st); assert.ok(k); assert.equal(g.take(st), null);
  g.release(k); assert.equal(g.take(st), k);
  assert.ok(g.take({ ...st, series: 1 }));
});
