import test from 'node:test'; import assert from 'node:assert/strict';
import { availableChampions, fearlessLocked } from '../js/logic/availability.js';
test('banned, picked and fearless-locked champions are unavailable', () => {
  assert.deepEqual(availableChampions(['A','B','C','D'], {bans:{blue:['A'],red:[]},picks:{blue:[],red:['B']}}, ['C']), ['D']);
});
test('fearless locks previous picks only, not bans', () => {
  const locked = fearlessLocked([{bans:{blue:['Q'],red:['W']},picks:{blue:['X'],red:['Y']}},{bans:{blue:[],red:[]},picks:{blue:['Z'],red:[]}}]);
  assert.deepEqual([...locked].sort(), ['X','Y','Z']);
});
