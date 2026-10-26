import test from 'node:test'; import assert from 'node:assert/strict';
import { buildSeason } from '../scripts/build-season.mjs';

test('buildSeason aggregates lane matchups and bot duos from role-ordered picks', () => {
  const s = buildSeason({
    LCK: `1|Gnar;Vi;Cassiopeia;Kalista;Renata Glasc|Sion;Lee Sin;Orianna;Jhin;Alistar
2|Gnar;Vi;Orianna;Kalista;Renata Glasc|Sion;Lee Sin;Cassiopeia;Jhin;Alistar`,
    LEC: `\n3|Jax;Vi;Cassiopeia;Ezreal;Karma|Sion;Lee Sin;Orianna;Kalista;Renata Glasc\n`,
  }, 'Split été 2026');
  assert.equal(s.label, 'Split été 2026'); assert.equal(s.games, 3);
  assert.deepEqual(s.matchups.mid['cassiopeia|orianna'], { games: 3, wins: 2 });
  assert.deepEqual(s.duos['kalista|renata'], { games: 3, wins: 2 });
  assert.deepEqual(s.duos['jhin|alistar'], { games: 2, wins: 0 });
});
test('buildSeason rejects malformed lines with the game id', () => {
  assert.throws(() => buildSeason({ X: '9|A;B;C;D|E;F;G;H;I' }, 'x'), /9/);
});
