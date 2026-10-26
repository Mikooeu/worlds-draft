import test from 'node:test'; import assert from 'node:assert/strict';
import { DRAFT_ORDER } from '../js/logic/draftOrder.js';
test('draft order has 20 steps in the creator-defined sequence', () => {
  assert.equal(DRAFT_ORDER.length, 20);
  assert.equal(DRAFT_ORDER.map(s => s.side[0].toUpperCase() + s.type[0]).join(' '),
    'Rb Bb Rb Bb Rb Bb Bp Rp Rp Bp Bp Rp Bb Rb Bb Rb Rp Bp Bp Rp');
});
