import test from 'node:test'; import assert from 'node:assert/strict';
import { resolveData } from '../js/data.js';
import { autoAssignRoles } from '../js/logic/roles.js';
import { CHAMP_POSITIONS } from '../js/champPositions.js';

const raw = { updatedAt: 'x', teams: {}, players: {}, matchups: {},
  champions: { yunara: { name: 'Yunara', games: 3, wins: 2, roles: { adc: 3 } }, galio: { name: 'Galio', games: 2, wins: 1, roles: { mid: 2 } } } };
const dd = ['Jinx', 'Yunara', 'Galio', 'Thresh', 'Garen', 'Teemo', 'NewChamp'].map(id => ({ id, name: id }));

test('static positions cover common bot laners never played at Worlds', () => {
  for (const id of ['Jinx', 'Caitlyn', 'Samira', 'Twitch', 'Nilah', 'Zeri', 'Draven', 'Vayne', 'KogMaw']) assert.ok(CHAMP_POSITIONS[id]?.includes('adc'), id);
  for (const r of ['top', 'jungle', 'mid', 'adc', 'support']) assert.ok(Object.values(CHAMP_POSITIONS).filter(p => p.includes(r)).length >= 25, r);
});
test('resolveData merges static positions with tournament roles', () => {
  const d = resolveData(raw, dd);
  assert.deepEqual(d.champions.Jinx.positions, ['adc']);
  assert.ok(d.champions.Galio.positions.includes('mid') && d.champions.Galio.positions.includes('support'));
  assert.deepEqual(d.champions.Yunara.positions, ['adc']);
  assert.deepEqual(d.champions.NewChamp.positions, []);
});
test('autoAssignRoles uses static positions for champions with no Worlds games', () => {
  const d = resolveData(raw, dd);
  assert.deepEqual(autoAssignRoles(['Thresh', 'Jinx', 'Garen', 'Galio', 'NewChamp'], d),
    { top: 'Garen', jungle: 'NewChamp', mid: 'Galio', adc: 'Jinx', support: 'Thresh' });
});
