import test from 'node:test'; import assert from 'node:assert/strict';
import { autoAssignRoles } from '../js/logic/roles.js';
import { ROLES } from '../js/logic/winrate.js';
import { miniData as d } from './fixtures/miniData.js';
test('assigns 5 distinct roles using most-played roles', () => {
  const r = autoAssignRoles(['Jhin','Gnar','Ahri','Rell','Vi'], d);
  assert.deepEqual(r, { top: 'Gnar', jungle: 'Vi', mid: 'Ahri', adc: 'Jhin', support: 'Rell' });
});
test('champion whose main role is taken goes to its next role, unknowns fill the rest', () => {
  const r = autoAssignRoles(['Ahri','Galio','Teemo','Sion','Ezreal'], d);
  assert.equal(r.mid, 'Ahri'); assert.equal(r.support, 'Galio');
  assert.deepEqual(Object.keys(r).sort(), [...ROLES].sort());
  assert.deepEqual(Object.values(r).sort(), ['Ahri','Ezreal','Galio','Sion','Teemo']);
});
