import test from 'node:test'; import assert from 'node:assert/strict';
import { buildData } from '../scripts/build-data.mjs';
import { createGame, applyAction } from '../js/logic/game.js';

const teams = `tag,name,region,top,jungle,mid,adc,support
AAA,Team A,X,a1,a2,a3,a4,a5
PPP,Play Team,PLAYIN,p1,p2,p3,p4,p5`;
const games = `1|AAA|PPP|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|p1:Sion;p2:Lee Sin;p3:Syndra;p4:Kaisa;p5:Alistar`;

test('Play-In teams count for stats but are not playable', () => {
  const d = buildData(teams, games, 'x');
  assert.equal(d.teams.PPP.playable, false);
  assert.equal(d.teams.AAA.playable, true);
  assert.equal(d.champions.syndra.games, 1);
  let s = createGame('ABCD', 'H', 1);
  const ctx = { data: d, champIds: [], now: 1, rng: () => 0 };
  assert.equal(applyAction(s, { type: 'setTeam', playerId: 'H', team: 'PPP' }, ctx), s);
  assert.notEqual(applyAction(s, { type: 'setTeam', playerId: 'H', team: 'AAA' }, ctx), s);
});
test('Play-In games feed champion/player stats but not team records', () => {
  const main = `1|AAA|PPP|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|p1:Sion;p2:Lee Sin;p3:Syndra;p4:Kaisa;p5:Alistar`;
  const playin = `2|AAA|PPP|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|p1:Sion;p2:Lee Sin;p3:Syndra;p4:Kaisa;p5:Alistar`;
  const d = buildData(teams, main, 'x', playin);
  assert.deepEqual([d.teams.AAA.wins, d.teams.AAA.losses], [1, 0]);
  assert.equal(d.players.a1.champs.gnar.games, 2);
  assert.equal(d.champions.ahri.games, 2);
});
