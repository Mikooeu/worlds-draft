import test from 'node:test'; import assert from 'node:assert/strict';
import { buildData } from '../scripts/build-data.mjs';
import { resolveData } from '../js/data.js';
import { champTooltip } from '../js/ui/tooltip.js';

const teams = `tag,name,region,top,jungle,mid,adc,support
AAA,Team A,X,a1,a2,a3,a4,a5
BBB,Team B,Y,b1,b2,b3,b4,b5`;
const games = `1|AAA|BBB|a1:Gnar;a2:Vi;a3:Ahri;a4:Jhin;a5:Rell|b1:Sion;b2:Lee Sin;b3:Syndra;b4:Ezreal;b5:Karma
2|BBB|AAA|b1:Sion;b2:Lee Sin;b3:Ahri;b4:Ezreal;b5:Karma|a1:Gnar;a2:Vi;a3:Syndra;a4:Jhin;a5:Rell`;
const dd = ['Gnar','Vi','Ahri','Jhin','Rell','Sion','LeeSin','Syndra','Ezreal','Karma','Teemo'].map(id => ({ id, name: id === 'LeeSin' ? 'Lee Sin' : id }));
const d = resolveData(buildData(teams, games, 'x'), dd);

test('build-data counts total Worlds games', () => { assert.equal(d.totalGames ?? buildData(teams, games, 'x').totalGames, 2); });
test('tooltip: winrate with games, pick rate, and my player line', () => {
  const t = champTooltip(d, 'Ahri', 'AAA');
  assert.match(t, /Ahri/); assert.match(t, /Winrate<\/span><b>100 %/); assert.match(t, /2 games/); assert.match(t, /Pick rate[^%]*100 %/);
  assert.match(t, /a3 : 1V \/ 1/);           // le joueur de mon équipe qui l'a joué
  const s = champTooltip(d, 'Syndra', 'AAA');
  assert.match(s, /a3 : 0V \/ 1/);
  const g = champTooltip(d, 'Gnar', 'BBB');
  assert.match(g, /b1 ne l'a jamais joué/);   // joueur du poste habituel de Gnar (top)
});
test('tooltip: champion never played at Worlds', () => {
  const t = champTooltip(d, 'Teemo', 'AAA');
  assert.match(t, /Pas encore joué aux Worlds/); assert.doesNotMatch(t, /0 %/);
});
test('tooltip during bans shows the whole opposing team record, labelled', () => {
  const t = champTooltip(d, 'Ahri', 'BBB', { opponent: true });
  assert.match(t, /Adversaire/); assert.match(t, /BBB : 1V \/ 1/); assert.doesNotMatch(t, /b3/);
  // deux joueurs de la même équipe sur le même champion : bilans additionnés
  const g3 = `3|BBB|AAA|b1:Ahri;b2:Lee Sin;b3:Syndra;b4:Ezreal;b5:Karma|a1:Gnar;a2:Vi;a3:Teemo;a4:Jhin;a5:Rell`;
  const d2 = resolveData(buildData(teams, games + '\n' + g3, 'x'), dd);
  assert.match(champTooltip(d2, 'Ahri', 'BBB', { opponent: true }), /BBB : 2V \/ 2/);
  assert.match(champTooltip(d, 'Teemo', 'BBB', { opponent: true }), /BBB ne l'a jamais joué/);
});
