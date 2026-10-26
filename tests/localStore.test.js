import test from 'node:test'; import assert from 'node:assert/strict';
import { createLocalStore, memoryStorage } from '../js/store/localStore.js';
import { createGame } from '../js/logic/game.js';
import { miniData } from './fixtures/miniData.js';

const ctx = () => ({ data: miniData, champIds: Object.keys(miniData.champions), now: Date.now(), rng: Math.random });
const tick = () => new Promise(r => setTimeout(r, 30));

test('two local stores share state and serialize concurrent dispatches', async () => {
  const storage = memoryStorage();
  const a = createLocalStore({ playerId: 'H', storage }), b = createLocalStore({ playerId: 'G', storage });
  await a.create(createGame('ABCD', 'H', Date.now()));
  const seen = [];
  const unsub = b.subscribe('ABCD', s => seen.push(s));
  await tick();
  assert.equal(seen.at(-1).hostId, 'H');
  assert.equal(await b.dispatch('ABCD', { type: 'join', playerId: 'G' }, ctx()), true);
  await tick();
  assert.equal(seen.at(-1).guestId, 'G');
  // deux "join" concurrents d'un 3e joueur et du même invité : aucun ne change l'état
  const r = await Promise.all([a.dispatch('ABCD', { type: 'join', playerId: 'X' }, ctx()), b.dispatch('ABCD', { type: 'join', playerId: 'G' }, ctx())]);
  assert.deepEqual(r, [false, false]);
  // deux setTeam concurrents sur la même équipe : un seul gagne
  const r2 = await Promise.all([
    a.dispatch('ABCD', { type: 'setTeam', playerId: 'H', team: 'AAA' }, ctx()),
    b.dispatch('ABCD', { type: 'setTeam', playerId: 'G', team: 'AAA' }, ctx()),
  ]);
  assert.deepEqual(r2.filter(Boolean).length, 1);
  unsub(); a.close?.(); b.close?.();
});
test('subscribe to unknown game yields null', async () => {
  const s = createLocalStore({ playerId: 'H', storage: memoryStorage() });
  const seen = [];
  const un = s.subscribe('ZZZZ', v => seen.push(v));
  await tick();
  assert.deepEqual(seen, [null]); un(); s.close?.();
});
