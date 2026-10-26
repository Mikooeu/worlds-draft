import test from 'node:test'; import assert from 'node:assert/strict';
import { smooth, computeResult, ROLES } from '../js/logic/winrate.js';
import { miniData as d } from './fixtures/miniData.js';
const side = (team, champs) => ({ team, roles: Object.fromEntries(ROLES.map((r, i) => [r, champs[i]])) });
const A = side('AAA', ['Gnar','Vi','Ahri','Jhin','Rell']);
const B = side('BBB', ['Sion','Teemo','Galio','Ezreal','Lulu']);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test('smooth pulls small samples toward prior with k=5', () => {
  close(smooth(2, 2, 0.5), 4.5 / 7);
  close(smooth(0, 0, 0.42), 0.42);
});
test('fallback chain player -> champion -> 0.5', () => {
  const r = computeResult(d, A, B);
  const top = r.lanes.find(l => l.role === 'top');
  close(top.blue.wr, smooth(2, 2, smooth(2, 2, 0.5)));          // a1 a joué Gnar
  assert.equal(top.blue.games, 2);
  const mid = r.lanes.find(l => l.role === 'mid');
  close(mid.blue.wr, smooth(7, 10, 0.5));                          // a3 jamais joué Ahri -> wr champion
  assert.equal(mid.blue.games, 0);
  close(top.red.wr, 0.5);                                          // Sion jamais pické -> 50 %
  assert.equal(mid.matchupBlue.games, 1);
  close(mid.matchupBlue.wr, smooth(1, 1, 0.5));
  const bot = r.lanes.find(l => l.role === 'adc');
  close(bot.matchupBlue.wr, 0.5);                                  // matchup absent -> neutre
});
test('reverse matchup key is used from the other point of view', () => {
  const r = computeResult(d, B, A);
  const mid = r.lanes.find(l => l.role === 'mid');
  close(mid.matchupBlue.wr, smooth(0, 1, 0.5));
});
test('side does not matter: swapping sides swaps probabilities exactly', () => {
  const r1 = computeResult(d, A, B), r2 = computeResult(d, B, A);
  close(r1.pBlue, r2.pRed);
  assert.ok(r1.pBlue > 0.5);
  assert.equal(r1.winner, 'blue'); assert.equal(r2.winner, 'red');
});
test('displayed percentages always sum to 100', () => {
  const ids = Object.keys(d.champions);
  for (let i = 0; i < 50; i++) {
    const pick = () => side(i % 2 ? 'AAA' : 'BBB', ROLES.map((_, j) => ids[(i * 7 + j * 3) % ids.length]));
    const r = computeResult(d, pick(), side('CCC', ROLES.map((_, j) => ids[(i + j) % ids.length])));
    assert.equal(r.displayBlue + r.displayRed, 100);
    close(r.pBlue + r.pRed, 1);
  }
});
test('exact tie goes to better team record, then blue', () => {
  const mirror = (t) => side(t, ['Sion','Teemo','Ezreal','Lulu','Sion']);
  const r = computeResult(d, mirror('BBB'), mirror('CCC'));
  assert.equal(r.pBlue, 0.5); assert.equal(r.winner, 'blue');      // même bilan -> blue
  const r2 = computeResult({ ...d, teams: { ...d.teams, CCC: { ...d.teams.CCC, wins: 2, losses: 2 } } }, mirror('BBB'), mirror('CCC'));
  // CCC meilleur bilan mais l'écart d'équipe entre dans le score -> plus une égalité
  assert.ok(r2.pRed > 0.5); assert.equal(r2.winner, 'red');
});
