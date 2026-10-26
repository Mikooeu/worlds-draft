import test from 'node:test'; import assert from 'node:assert/strict';
import { seriesWinner, WINS_NEEDED } from '../js/logic/series.js';
test('series winner by format', () => {
  assert.deepEqual(WINS_NEEDED, {bo1:1, bo3:2, bo5:3});
  assert.equal(seriesWinner('bo3', {T1:1, G2:1}), null);
  assert.equal(seriesWinner('bo3', {T1:2, G2:1}), 'T1');
  assert.equal(seriesWinner('bo1', {T1:1, G2:0}), 'T1');
  assert.equal(seriesWinner('bo5', {T1:2, G2:2}), null);
  assert.equal(seriesWinner('bo5', {T1:2, G2:3}), 'G2');
});
