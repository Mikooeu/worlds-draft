import test from 'node:test'; import assert from 'node:assert/strict';
import { buildData, champKey } from '../scripts/build-data.mjs';
import { resolveData } from '../js/data.js';

const teams = `tag,name,region,top,jungle,mid,adc,support
AAA,Team A,X,a1,a2,a3,a4,a5
BBB,Team B,Y,b1,b2,b3,b4,b5`;
const games = `1|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|b1:Wukong;b2:Lee Sin;b3:Syndra;b4:Kai'Sa;b5:Renata Glasc
2|BBB|AAA|b3:Ahri;b1:Gnar;b2:Vi;b4:Jhin;b5:Rell|a1:KSante;a2:Jarvan IV;a3:Syndra;a4:Ezreal;a5:Nunu & Willump`;

test('champKey normalizes names and aliases', () => {
  assert.equal(champKey('Wukong'), 'monkeyking');
  assert.equal(champKey('Renata Glasc'), 'renata');
  assert.equal(champKey("Kai'Sa"), 'kaisa');
  assert.equal(champKey('Nunu & Willump'), 'nunu');
  assert.equal(champKey('Jarvan IV'), 'jarvaniv');
});
test('buildData aggregates teams, players, champions and lane matchups', () => {
  const d = buildData(teams, games, '2026-10-25');
  assert.deepEqual([d.teams.AAA.wins, d.teams.AAA.losses], [1, 1]);
  assert.deepEqual(d.teams.BBB.players, { top: 'b1', jungle: 'b2', mid: 'b3', adc: 'b4', support: 'b5' });
  assert.deepEqual(d.players.a3.champs, { ahri: { games: 1, wins: 1 }, syndra: { games: 1, wins: 0 } });
  assert.deepEqual(d.champions.ahri, { name: 'Ahri', games: 2, wins: 2, roles: { mid: 2 } });
  // rôle depuis le roster, pas depuis l'ordre de la ligne (b3 listé en premier)
  assert.equal(d.players.b3.champs.ahri.games, 1);
  // clé triée, victoires du point de vue du premier champion
  assert.deepEqual(d.matchups.mid['ahri|syndra'], { games: 2, wins: 2 });
  assert.deepEqual(d.matchups.top['gnar|monkeyking'], { games: 1, wins: 1 });
  assert.deepEqual(d.matchups.top['gnar|ksante'], { games: 1, wins: 1 });
  const total = Object.values(d.teams).reduce((n, t) => n + t.wins + t.losses, 0);
  assert.equal(total, 4);
});
test('buildData throws on player not in the team roster', () => {
  assert.throws(() => buildData(teams, `3|AAA|BBB|b1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|b1:Sion;b2:Vi;b3:Ahri;b4:Jhin;b5:Rell`, 'x'), /b1/);
});
test('resolveData maps keys to Data Dragon ids and adds unplayed champions', () => {
  const d = buildData(teams, games, '2026-10-25');
  const dd = ['Gnar','Vi','Ahri','Jhin','Rell','MonkeyKing:Wukong','LeeSin:Lee Sin','Syndra','Kaisa:Kai\'Sa','Renata:Renata Glasc','KSante:K\'Sante','JarvanIV:Jarvan IV','Ezreal','Nunu:Nunu & Willump','Teemo']
    .map(s => { const [id, name] = s.split(':'); return { id, name: name || id }; });
  const r = resolveData(d, dd);
  assert.equal(r.champions.MonkeyKing.games, 1);
  assert.equal(r.champions.Teemo.games, 0);
  assert.equal(r.players.a2.champs.JarvanIV.games, 1);
  assert.deepEqual(r.matchups.mid['Ahri|Syndra'], { games: 2, wins: 2 });
  assert.equal(r.unknown.length, 0);
  assert.deepEqual(r.champList.map(c => c.id).slice(0, 3), ['Ahri', 'Ezreal', 'Gnar']); // trié par nom
});
test('resolveData keeps unknown stat champions instead of dropping them', () => {
  const d = buildData(teams, games, 'x');
  const r = resolveData(d, [{ id: 'Gnar', name: 'Gnar' }]);
  assert.ok(r.unknown.includes('Ahri'));
  assert.equal(r.champions.ahri.games, 2);
});
