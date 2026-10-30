import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveData } from '../js/data.js';
import { CHAMP_POSITIONS } from '../js/champPositions.js';
import { createGame, applyAction } from '../js/logic/game.js';
import { DRAFT_ORDER } from '../js/logic/draftOrder.js';
import { aiChoose, aiRoles, AI_ID } from '../js/logic/ai.js';
import { ROLES } from '../js/logic/winrate.js';

const raw = JSON.parse(fs.readFileSync(new URL('../data/worlds.json', import.meta.url)));
const dd = Object.keys(CHAMP_POSITIONS).map(id => ({ id, name: id }));
const data = resolveData(raw, dd);
const champIds = Object.keys(data.champions);
let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ctx = () => ({ data, champIds, now: 1000, rng });
const act = (s, a) => applyAction(s, a, ctx());

function aiLobby(level = 'hard') {
  let s = createGame('ABCD', 'H', 1000);
  s = act(s, { type: 'setOpponent', playerId: 'H', mode: 'ai', level });
  s = act(s, { type: 'setTeam', playerId: 'H', team: 'GEN' });
  s = act(s, { type: 'setAiTeam', playerId: 'H', team: 'T1' });
  s = act(s, { type: 'setSide', playerId: 'H', side: 'blue' });
  return s;
}

test('lobby vs IA : siège IA, side opposé automatique, équipe choisie par l\'hôte', () => {
  const s = aiLobby();
  assert.equal(s.guestId, null); assert.deepEqual(s.ai, { level: 'hard' });
  assert.equal(s.seats[AI_ID].team, 'T1'); assert.equal(s.seats[AI_ID].side, 'red');
  const s2 = act(s, { type: 'setSide', playerId: 'H', side: 'red' });
  assert.equal(s2.seats[AI_ID].side, 'blue');
  assert.equal(act(s, { type: 'setAiTeam', playerId: 'H', team: 'GEN' }), s, 'pas la même équipe que l\'hôte');
  // un ami qui rejoint remplace l'IA
  const j = act(s, { type: 'join', playerId: 'X' });
  assert.equal(j.guestId, 'X'); assert.equal(j.ai, null); assert.equal(j.seats[AI_ID], undefined);
  assert.deepEqual(j.seats.X, { team: null, side: null }); assert.equal(j.seats.H.team, 'GEN');
  assert.equal(act(j, { type: 'setOpponent', playerId: 'H', mode: 'ai', level: 'easy' }), j, 'un ami a déjà rejoint');
  assert.equal(act(s, { type: 'join', playerId: AI_ID }), s);
  // personne ne rejoint une partie déjà lancée contre l'IA
  const started = act(s, { type: 'start', playerId: 'H' });
  assert.equal(act(started, { type: 'join', playerId: 'X' }), started);
});
test('l\'IA est l\'adversaire par défaut, niveau moyen', () => {
  const s = createGame('ABCD', 'H', 1000);
  assert.deepEqual(s.ai, { level: 'medium' }); assert.ok(s.seats[AI_ID]);
});

for (const level of ['easy', 'medium', 'hard']) {
  test(`IA ${level} : draft complète, 5 champions qui couvrent les 5 postes`, () => {
    let s = act(aiLobby(level), { type: 'start', playerId: 'H' });
    for (let i = 0; i < DRAFT_ORDER.length; i++) {
      const pid = DRAFT_ORDER[i].side === 'red' ? AI_ID : 'H';
      const champ = pid === AI_ID ? aiChoose(s, data, champIds, level, rng) : aiChoose(s, data, champIds, 'medium', rng);
      const next = act(s, { type: 'draft', playerId: pid, step: i, champ });
      assert.notEqual(next, s, `étape ${i} refusée (${champ})`); s = next;
    }
    const g = s.games[0];
    const roles = aiRoles(data, 'T1', g.picks.red);
    assert.deepEqual(new Set(Object.values(roles)), new Set(g.picks.red));
    const fit = ROLES.filter(r => data.champions[roles[r]].positions.includes(r)).length;
    assert.ok(fit >= 4, `rôles cohérents (${fit}/5)`);
  });
}

test('IA difficile : bannit ce que l\'adversaire joue le mieux', () => {
  const s = act(aiLobby('hard'), { type: 'start', playerId: 'H' }); // step 0 = ban rouge (IA)
  const ban = aiChoose(s, data, champIds, 'hard', rng);
  const gen = Object.values(data.teams.GEN.players);
  assert.ok(gen.some(p => data.players[p]?.champs?.[ban]?.games), `${ban} est joué par GEN`);
});
