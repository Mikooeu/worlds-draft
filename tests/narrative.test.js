import test from 'node:test'; import assert from 'node:assert/strict';
import { generateNarrative } from '../js/logic/narrative.js';

const lanes = ['top', 'jungle', 'mid', 'adc', 'support'].map((role, i) => ({
  role, blue: { player: 'B' + i, champ: 'BC' + i, wr: 0.5 + (i - 2) * 0.04 }, red: { player: 'R' + i, champ: 'RC' + i, wr: 0.5 }, matchupBlue: { wr: 0.5 },
}));
const base = { blueTeam: 'AAA', redTeam: 'BBB' };
const names = { teams: { AAA: { name: 'Team A' }, BBB: { name: 'Team B' } }, champions: {} };

test('narrative is deterministic for the same seed and ends with the winner destroying the Nexus', () => {
  const r = { pBlue: 0.62, winner: 'blue', lanes };
  const a = generateNarrative(names, base, r, 'seed-1'), b = generateNarrative(names, base, r, 'seed-1');
  assert.deepEqual(a, b);
  const last = a[a.length - 1];
  assert.equal(last.side, 'blue'); assert.match(last.text, /Nexus/);
  assert.ok(a.length >= 8 && a.length <= 18);
  for (let i = 1; i < a.length; i++) assert.ok(a[i].sec >= a[i - 1].sec, 'chronologique');
  assert.match(a[0].time, /^\d{2}:\d{2}$/);
});
test('the losing side gets moments too (comebacks are possible)', () => {
  let loserEvents = 0, comebacks = 0;
  for (let k = 0; k < 40; k++) {
    const ev = generateNarrative(names, base, { pBlue: 0.6, winner: 'blue', lanes }, 's' + k);
    loserEvents += ev.filter(e => e.side === 'red').length;
    if (ev[0].side === 'red') comebacks++;
  }
  assert.ok(loserEvents > 40, 'le perdant a des actions'); assert.ok(comebacks > 3, 'le perdant fait parfois le first blood');
});
test('different seeds give different stories', () => {
  const r = { pBlue: 0.55, winner: 'red', lanes };
  const a = generateNarrative(names, base, r, 'x1').map(e => e.text).join('|');
  const b = generateNarrative(names, base, r, 'x2').map(e => e.text).join('|');
  assert.notEqual(a, b);
  assert.equal(generateNarrative(names, base, r, 'x1').at(-1).side, 'red');
});
