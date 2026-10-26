import test from 'node:test'; import assert from 'node:assert/strict';
import { buildData } from '../scripts/build-data.mjs';
import { resolveData } from '../js/data.js';
import { computeResult, smooth, ROLES } from '../js/logic/winrate.js';

const teams = `tag,name,region,top,jungle,mid,adc,support
AAA,Team A,X,a1,a2,a3,a4,a5
BBB,Team B,Y,b1,b2,b3,b4,b5`;
const games = `1|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Kalista;a5:Renata Glasc|b1:Sion;b2:Lee Sin;b3:Syndra;b4:Jhin;b5:Alistar
2|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Kalista;a5:Renata Glasc|b1:Sion;b2:Lee Sin;b3:Syndra;b4:Jhin;b5:Alistar`;
const ids = ['Gnar','Vi','Ahri','Kalista','Renata','Sion','LeeSin','Syndra','Jhin','Alistar','Cassiopeia','Orianna','Ezreal','Karma'];
const dd = ids.map(id => ({ id, name: id === 'Renata' ? 'Renata Glasc' : id === 'LeeSin' ? 'Lee Sin' : id }));
const season = { label: 'Split été 2026', matchups: { mid: { 'cassiopeia|orianna': { games: 6, wins: 5 }, 'ahri|syndra': { games: 10, wins: 0 } } }, duos: { 'ezreal|karma': { games: 8, wins: 2 } } };
const side = (team, champs) => ({ team, roles: Object.fromEntries(ROLES.map((r, i) => [r, champs[i]])) });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test('build-data aggregates bot duos (adc|support)', () => {
  const d = buildData(teams, games, 'x');
  assert.deepEqual(d.duos['kalista|renata'], { games: 2, wins: 2 });
  assert.deepEqual(d.duos['jhin|alistar'], { games: 2, wins: 0 });
});
test('duo synergy enters the score; Worlds data first, season as fallback', () => {
  const d = resolveData(buildData(teams, games, 'x'), dd, season);
  const A = side('AAA', ['Gnar','Vi','Ahri','Kalista','Renata']);
  const B = side('BBB', ['Sion','LeeSin','Syndra','Ezreal','Karma']);
  const r = computeResult(d, A, B);
  assert.equal(r.duo.blue.source, 'worlds'); close(r.duo.blue.wr, smooth(2, 2, 0.5));
  assert.equal(r.duo.red.source, 'season'); close(r.duo.red.wr, smooth(2, 8, 0.5));
  // sans duo : probabilité plus basse pour le blue (son duo gagnant ne compte plus)
  const noDuo = computeResult({ ...d, duos: {}, season: { matchups: {}, duos: {} } }, A, B);
  assert.ok(r.pBlue > noDuo.pBlue);
});
test('lane matchup: Worlds data wins over season, season used when Worlds has none', () => {
  const d = resolveData(buildData(teams, games, 'x'), dd, season);
  const r = computeResult(d, side('AAA', ['Gnar','Vi','Ahri','Jhin','Alistar']), side('BBB', ['Sion','LeeSin','Syndra','Ezreal','Karma']));
  const mid = r.lanes.find(l => l.role === 'mid');
  assert.equal(mid.matchupBlue.source, 'worlds'); assert.equal(mid.matchupBlue.games, 2); // Worlds 2-0, pas le 0/10 du split
  const r2 = computeResult(d, side('AAA', ['Gnar','Vi','Cassiopeia','Jhin','Alistar']), side('BBB', ['Sion','LeeSin','Orianna','Ezreal','Karma']));
  const mid2 = r2.lanes.find(l => l.role === 'mid');
  assert.equal(mid2.matchupBlue.source, 'season'); close(mid2.matchupBlue.wr, smooth(5, 6, 0.5));
  const r3 = computeResult(d, side('AAA', ['Gnar','Vi','Orianna','Jhin','Alistar']), side('BBB', ['Sion','LeeSin','Cassiopeia','Ezreal','Karma']));
  close(r3.lanes.find(l => l.role === 'mid').matchupBlue.wr, smooth(1, 6, 0.5)); // sens inverse
  const bot = r.lanes.find(l => l.role === 'adc'); // Jhin vs Ezreal : jamais joué nulle part
  assert.equal(bot.matchupBlue.source, null); close(bot.matchupBlue.wr, 0.5);
});
