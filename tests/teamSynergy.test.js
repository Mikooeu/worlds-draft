import test from 'node:test'; import assert from 'node:assert/strict';
import { buildData } from '../scripts/build-data.mjs';
import { buildSeason } from '../scripts/build-season.mjs';
import { resolveData } from '../js/data.js';
import { computeResult, ROLES } from '../js/logic/winrate.js';

const teams = `tag,name,region,top,jungle,mid,adc,support
AAA,Team A,X,a1,a2,a3,a4,a5
BBB,Team B,Y,b1,b2,b3,b4,b5`;
const games = `1|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|b1:Sion;b2:Lee Sin;b3:Syndra;b4:Ezreal;b5:Karma
2|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|b1:Sion;b2:Lee Sin;b3:Syndra;b4:Ezreal;b5:Karma`;
const ids = ['Gnar','Vi','Ahri','Jhin','Rell','Sion','LeeSin','Syndra','Ezreal','Karma','Jax','Orianna'];
const dd = ids.map(id => ({ id, name: id === 'LeeSin' ? 'Lee Sin' : id }));
const side = (team, c) => ({ team, roles: Object.fromEntries(ROLES.map((r, i) => [r, c[i]])) });

test('build scripts record all champion pairs of a team (sorted key)', () => {
  const d = buildData(teams, games, 'x');
  assert.deepEqual(d.pairs['ahri|vi'], { games: 2, wins: 2 });
  assert.deepEqual(d.pairs['leesin|syndra'], { games: 2, wins: 0 });
  assert.equal(Object.keys(d.pairs).length, 20);
  const s = buildSeason({ X: '9|Jax;Vi;Orianna;Jhin;Rell|Sion;Lee Sin;Syndra;Ezreal;Karma' }, 'x');
  assert.deepEqual(s.pairs['orianna|vi'], { games: 1, wins: 1 });
});
test('team synergy (pairs other than bot duo) shifts the win probability', () => {
  const d = resolveData(buildData(teams, games, 'x'), dd, buildSeason({ X: '9|Jax;Vi;Orianna;Jhin;Rell|Sion;Lee Sin;Syndra;Ezreal;Karma' }, 'x'));
  const A = side('AAA', ['Gnar','Vi','Ahri','Jhin','Rell']), B = side('BBB', ['Sion','LeeSin','Syndra','Ezreal','Karma']);
  const r = computeResult(d, A, B);
  assert.equal(r.synergy.blue.known, 9); assert.equal(r.synergy.red.known, 9);
  assert.ok(r.synergy.blue.wr > 0.5 && r.synergy.red.wr < 0.5);
  const flat = computeResult({ ...d, pairs: {}, season: { ...d.season, pairs: {} } }, A, B);
  assert.ok(r.pBlue > flat.pBlue);
  assert.equal(flat.synergy.blue.known, 0); assert.equal(flat.synergy.blue.wr, 0.5);
  // repli sur le split : Vi + Orianna jamais ensemble aux Worlds, 1 fois au split
  const C = side('AAA', ['Jax','Vi','Orianna','Jhin','Rell']);
  const r2 = computeResult(d, C, B);
  assert.ok(r2.synergy.blue.season >= 1);
});
