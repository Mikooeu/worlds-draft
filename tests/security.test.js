import test from 'node:test'; import assert from 'node:assert/strict';
import { normalize } from '../js/logic/game.js';

const XSS = '"><img src=x onerror=alert(1)>';
test('normalize : les champs écrits par l\'autre joueur sont assainis', () => {
  const s = normalize({
    code: XSS, hostId: 'H', guestId: XSS, phase: XSS, format: XSS, step: XSS, series: 'x', deadline: 'x',
    ai: { level: XSS }, wins: { [XSS]: XSS, GEN: 2 }, presel: { step: 1, champ: XSS },
    seats: { H: { team: XSS, side: XSS }, [XSS]: { team: 'T1' } },
    games: [{ blueTeam: XSS, redTeam: 'T1', bans: { blue: [XSS, 'Ahri'] }, picks: { red: ['Ahri', XSS, 'a', 'b', 'c', 'd', 'e'] }, roles: { blue: { top: XSS } }, result: { displayBlue: XSS } }],
  });
  const flat = JSON.stringify({ ...s, games: s.games.map(g => ({ ...g, result: null })) });
  assert.ok(!flat.includes('<'), 'aucun HTML ne survit');
  assert.equal(s.code, '????'); assert.equal(s.guestId, null); assert.equal(s.phase, 'lobby'); assert.equal(s.format, 'bo1');
  assert.equal(s.step, 0); assert.equal(s.ai, null); assert.deepEqual(s.wins, { GEN: 2 }); assert.equal(s.presel, null);
  assert.deepEqual(s.seats.H, { team: null, side: null }); assert.equal(Object.keys(s.seats).length, 1);
  assert.equal(s.games[0].blueTeam, null); assert.deepEqual(s.games[0].bans.blue, ['Ahri']);
  assert.equal(s.games[0].picks.red.length, 5, 'au plus 5 picks'); assert.equal(s.games[0].roles.blue, null);
  assert.equal(normalize('<script>'), null);
});
