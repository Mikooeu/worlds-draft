import test from 'node:test'; import assert from 'node:assert/strict';
import { createGame, applyAction, normalize } from '../js/logic/game.js';
import { DRAFT_ORDER } from '../js/logic/draftOrder.js';
import { miniData } from './fixtures/miniData.js';

const champIds = Array.from({ length: 60 }, (_, i) => 'C' + i).concat(Object.keys(miniData.champions));
let clock = 1000;
const ctx = () => ({ data: miniData, champIds, now: clock, rng: () => 0 });
const act = (s, a) => applyAction(s, a, ctx());

function lobby(format = 'bo1') {
  let s = createGame('ABCD', 'H', clock);
  s = act(s, { type: 'join', playerId: 'G' });
  s = act(s, { type: 'setTeam', playerId: 'H', team: 'AAA' });
  s = act(s, { type: 'setTeam', playerId: 'G', team: 'BBB' });
  s = act(s, { type: 'setSide', playerId: 'H', side: 'blue' });
  s = act(s, { type: 'setSide', playerId: 'G', side: 'red' });
  s = act(s, { type: 'setFormat', playerId: 'H', format });
  return act(s, { type: 'start', playerId: 'H' });
}
const playerFor = (s, side) => Object.entries(s.seats).find(([, v]) => v.side === side)[0];
function draftAll(s, pickFirst = (avail) => avail) {
  for (let i = 0; i < 20; i++) {
    const side = DRAFT_ORDER[i].side;
    const game = s.games[s.games.length - 1];
    const taken = new Set([...game.bans.blue, ...game.bans.red, ...game.picks.blue, ...game.picks.red, ...s.games.slice(0, -1).flatMap(g => [...g.picks.blue, ...g.picks.red])]);
    const champ = champIds.find(c => !taken.has(c));
    const next = act(s, { type: 'draft', playerId: playerFor(s, side), step: i, champ });
    assert.notEqual(next, s, `step ${i} refused`); s = next;
  }
  return s;
}

test('join: guest seat, idempotent host, third player refused', () => {
  let s = createGame('ABCD', 'H', clock);
  const s1 = act(s, { type: 'join', playerId: 'G' });
  assert.equal(s1.guestId, 'G');
  assert.equal(act(s1, { type: 'join', playerId: 'H' }), s1);
  assert.equal(act(s1, { type: 'join', playerId: 'G' }), s1);
  assert.equal(act(s1, { type: 'join', playerId: 'X' }), s1);
});
test('lobby rules: unique team/side, host-only format and start, start needs both ready', () => {
  let s = createGame('ABCD', 'H', clock);
  s = act(s, { type: 'join', playerId: 'G' });
  s = act(s, { type: 'setTeam', playerId: 'H', team: 'AAA' });
  assert.equal(act(s, { type: 'setTeam', playerId: 'G', team: 'AAA' }), s);
  assert.equal(act(s, { type: 'setTeam', playerId: 'G', team: 'ZZZ' }), s);
  s = act(s, { type: 'setSide', playerId: 'H', side: 'red' });
  assert.equal(act(s, { type: 'setSide', playerId: 'G', side: 'red' }), s);
  assert.equal(act(s, { type: 'setFormat', playerId: 'G', format: 'bo5' }), s);
  assert.equal(act(s, { type: 'start', playerId: 'H' }), s);
  s = act(s, { type: 'setTeam', playerId: 'G', team: 'BBB' });
  s = act(s, { type: 'setSide', playerId: 'G', side: 'blue' });
  assert.equal(act(s, { type: 'start', playerId: 'G' }), s);
  const st = act(s, { type: 'start', playerId: 'H' });
  assert.equal(st.phase, 'draft'); assert.equal(st.step, 0); assert.equal(st.deadline, clock + 30000);
  assert.equal(st.games[0].blueTeam, 'BBB'); assert.equal(st.games[0].redTeam, 'AAA');
});
test('draft: wrong player, wrong step, unavailable champion refused; duplicate step ignored', () => {
  const s = lobby();
  // étape 0 = ban red -> joueur G
  assert.equal(act(s, { type: 'draft', playerId: 'H', step: 0, champ: 'C0' }), s);
  assert.equal(act(s, { type: 'draft', playerId: 'G', step: 1, champ: 'C0' }), s);
  const s1 = act(s, { type: 'draft', playerId: 'G', step: 0, champ: 'C0' });
  assert.deepEqual(s1.games[0].bans.red, ['C0']); assert.equal(s1.step, 1);
  assert.equal(act(s1, { type: 'draft', playerId: 'G', step: 0, champ: 'C1' }), s1);
  assert.equal(act(s1, { type: 'draft', playerId: 'H', step: 1, champ: 'C0' }), s1);
});
test('timeout: refused before deadline, random valid action after, only once', () => {
  const s = lobby();
  assert.equal(act(s, { type: 'timeout', playerId: 'H', step: 0 }), s);
  clock += 30000;
  const s1 = act(s, { type: 'timeout', playerId: 'H', step: 0 });
  assert.equal(s1.step, 1); assert.equal(s1.games[0].bans.red.length, 1);
  assert.equal(act(s1, { type: 'timeout', playerId: 'G', step: 0 }), s1);
});
test('full draft -> roles -> result (bo1 ends series)', () => {
  let s = draftAll(lobby());
  assert.equal(s.phase, 'roles'); assert.equal(s.revealUntil, clock + 5000); assert.equal(s.deadline, clock + 35000);
  const g = s.games[0];
  const bad = { top: g.picks.blue[0], jungle: g.picks.blue[0], mid: g.picks.blue[2], adc: g.picks.blue[3], support: g.picks.blue[4] };
  assert.equal(act(s, { type: 'setRoles', playerId: playerFor(s, 'blue'), roles: bad }), s);
  const good = { top: g.picks.blue[0], jungle: g.picks.blue[1], mid: g.picks.blue[2], adc: g.picks.blue[3], support: g.picks.blue[4] };
  s = act(s, { type: 'setRoles', playerId: playerFor(s, 'blue'), roles: good });
  assert.equal(s.phase, 'roles');
  clock += 35000;
  s = act(s, { type: 'timeout', playerId: 'H', step: 20 });
  assert.equal(s.phase, 'seriesEnd');
  const res = s.games[0].result;
  assert.equal(res.displayBlue + res.displayRed, 100);
  assert.equal(new Set(Object.values(s.games[0].roles.red)).size, 5);
  assert.equal(s.wins[res.winnerTeam], 1);
});
test('bo3: loser chooses side, fearless locks previous picks, rematch resets', () => {
  let s = draftAll(lobby('bo3'));
  clock += 35000; s = act(s, { type: 'timeout', playerId: 'H', step: 20 });
  assert.equal(s.phase, 'result');
  const loserTeam = s.games[0].result.winnerTeam === 'AAA' ? 'BBB' : 'AAA';
  const loser = Object.entries(s.seats).find(([, v]) => v.team === loserTeam)[0];
  s = act(s, { type: 'nextGame', playerId: 'H' });
  assert.equal(s.phase, 'sideChoice'); assert.equal(s.sideChooser, loser);
  const other = loser === 'H' ? 'G' : 'H';
  assert.equal(act(s, { type: 'chooseSide', playerId: other, side: 'blue' }), s);
  s = act(s, { type: 'chooseSide', playerId: loser, side: 'blue' });
  assert.equal(s.phase, 'draft'); assert.equal(s.games.length, 2);
  assert.equal(s.games[1].blueTeam, loserTeam);
  const pickedG1 = s.games[0].picks.blue[0];
  const bluePlayer = playerFor(s, 'blue'), redPlayer = playerFor(s, 'red');
  assert.equal(act(s, { type: 'draft', playerId: redPlayer, step: 0, champ: pickedG1 }), s); // fearless
  const bannedG1 = s.games[0].bans.blue[0];
  assert.notEqual(act(s, { type: 'draft', playerId: redPlayer, step: 0, champ: bannedG1 }), s); // bans ne bloquent pas
  // finir la série
  while (s.phase !== 'seriesEnd') {
    if (s.phase === 'draft') s = draftAll(s);
    if (s.phase === 'roles') { clock += 35000; s = act(s, { type: 'timeout', playerId: 'H', step: 20 }); }
    if (s.phase === 'result') s = act(s, { type: 'nextGame', playerId: 'G' });
    if (s.phase === 'sideChoice') s = act(s, { type: 'chooseSide', playerId: s.sideChooser, side: 'red' });
  }
  assert.ok(Object.values(s.wins).includes(2));
  assert.equal(act(s, { type: 'rematch', playerId: 'G' }), s);
  const r = act(s, { type: 'rematch', playerId: 'H' });
  assert.equal(r.phase, 'lobby'); assert.equal(r.games.length, 0); assert.equal(r.guestId, 'G');
  void bluePlayer;
});
test('normalize restores fields Firebase drops (empty arrays/objects)', () => {
  const s = normalize({ code: 'ABCD', phase: 'draft', hostId: 'H', games: [{ blueTeam: 'AAA', redTeam: 'BBB' }] });
  assert.deepEqual(s.games[0].bans, { blue: [], red: [] });
  assert.deepEqual(s.seats, { H: { team: null, side: null } }); assert.equal(s.guestId, null);
});
test('clicking your own side or team again releases it for the opponent', () => {
  let s = createGame('ABCD', 'H', clock);
  s = act(s, { type: 'join', playerId: 'G' });
  s = act(s, { type: 'setSide', playerId: 'H', side: 'blue' });
  s = act(s, { type: 'setTeam', playerId: 'H', team: 'AAA' });
  assert.equal(act(s, { type: 'setSide', playerId: 'G', side: 'blue' }), s);
  s = act(s, { type: 'setSide', playerId: 'H', side: 'blue' });
  assert.equal(s.seats.H.side, null);
  s = act(s, { type: 'setSide', playerId: 'G', side: 'blue' });
  assert.equal(s.seats.G.side, 'blue');
  s = act(s, { type: 'setTeam', playerId: 'H', team: 'AAA' });
  assert.equal(s.seats.H.team, null);
  s = act(s, { type: 'setTeam', playerId: 'G', team: 'AAA' });
  assert.equal(s.seats.G.team, 'AAA');
});
test('host can reset to the lobby from any phase after start; guest cannot', () => {
  const s = lobby('bo3');
  assert.equal(s.phase, 'draft');
  assert.equal(act(s, { type: 'reset', playerId: 'G' }), s);
  const r = act(s, { type: 'reset', playerId: 'H' });
  assert.equal(r.phase, 'lobby'); assert.equal(r.games.length, 0); assert.equal(r.step, 0);
  assert.equal(r.deadline, null); assert.deepEqual(r.wins, {}); assert.equal(r.series, (s.series || 0) + 1);
  assert.equal(r.seats.H.team, 'AAA'); assert.equal(r.guestId, 'G');
  assert.equal(act(r, { type: 'reset', playerId: 'H' }), r); // déjà au lobby
});
test('random sides: assigns blue/red to the two players, lobby only, needs an opponent', () => {
  let s = act(createGame('ABCD', 'H', clock), { type: 'setOpponent', playerId: 'H', mode: 'human' });
  assert.equal(act(s, { type: 'randomSides', playerId: 'H' }), s); // ni invité ni IA
  s = act(s, { type: 'join', playerId: 'G' });
  const r0 = applyAction(s, { type: 'randomSides', playerId: 'G' }, { ...ctx(), rng: () => 0.2 });
  assert.equal(r0.seats.H.side, 'blue'); assert.equal(r0.seats.G.side, 'red');
  const r1 = applyAction(s, { type: 'randomSides', playerId: 'H' }, { ...ctx(), rng: () => 0.8 });
  assert.equal(r1.seats.H.side, 'red'); assert.equal(r1.seats.G.side, 'blue');
  const started = lobby();
  assert.equal(act(started, { type: 'randomSides', playerId: 'H' }), started);
});
test('timeout locks the pre-selected champion instead of a random one', () => {
  let s = lobby();
  // étape 0 : ban red (G). L'autre joueur ne peut pas pré-sélectionner.
  assert.equal(act(s, { type: 'preselect', playerId: 'H', step: 0, champ: 'C7' }), s);
  s = act(s, { type: 'preselect', playerId: 'G', step: 0, champ: 'C7' });
  assert.deepEqual(s.presel, { step: 0, champ: 'C7' });
  assert.equal(s.step, 0);                       // pré-sélection ≠ validation
  clock += 30000;
  s = act(s, { type: 'timeout', playerId: 'H', step: 0 });
  assert.deepEqual(s.games[0].bans.red, ['C7']); // le pré-lock est banni
  assert.equal(s.presel ?? null, null);
  // sans pré-sélection : aléatoire (rng 0 => premier disponible)
  clock += 30000;
  const s2 = act(s, { type: 'timeout', playerId: 'H', step: 1 });
  assert.equal(s2.games[0].bans.blue.length, 1);
  // pré-sélection d'un champion indisponible : refusée
  assert.equal(act(s2, { type: 'preselect', playerId: 'G', step: 2, champ: 'C7' }), s2);
});
