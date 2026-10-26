// Test bout en bout : deux joueurs en mode local (?local=1). Usage : node e2e/draft.spec.mjs [baseUrl]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';

const BASE = process.argv[2] || 'http://localhost:8080/';
const shots = process.env.SHOTS || '';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route(/ddragon|fonts\.(googleapis|gstatic)/, r => r.abort());
const errors = [];
const newPage = async () => { const p = await context.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => errors.push(e.message)); return p; };

const A = await newPage(), B = await newPage();
await A.goto(BASE + '?local=1');
await A.click('[data-act=create]');
await A.waitForSelector('.code');
const url = A.url();
assert.match(url, /game=[A-Z2-9]{4}/);
await B.goto(url);
await A.waitForSelector('text=Adversaire');
await A.click('[data-act=team][data-v=GEN]'); await A.click('[data-act=side][data-v=blue]'); await A.click('[data-act=format][data-v=bo3]');
await B.waitForSelector('[data-act=team][data-v=GEN][disabled]');
await B.click('[data-act=team][data-v=T1]'); await B.click('[data-act=side][data-v=red]');
await A.waitForSelector('[data-act=start]:not([disabled])');
if (shots) await A.screenshot({ path: shots + '/lobby.png' });

// 3e joueur
const C = await newPage(); await C.goto(url);
await C.waitForSelector('text=Partie complète'); await C.close();

await A.click('[data-act=start]');
// Sélectionner un champion ne doit pas redessiner l'écran (pas de rechargement des images)
{
  await A.waitForSelector('.draft'); await B.waitForSelector('.draft');
  const P = (await A.$('[data-act=lock]')) ? A : B;
  await P.evaluate(() => { document.querySelector('.grid').dataset.mark = '1'; });
  await P.click('.champ:not([disabled])');
  assert.equal(await P.evaluate(() => document.querySelector('.grid').dataset.mark), '1', 'la grille a été redessinée au clic');
  assert.ok(await P.$('.champ.sel'), 'champion sélectionné');
  assert.ok(await P.$('[data-act=lock]:not([disabled])'), 'bouton actif');
  await P.fill('[data-input=search]', 'zz-aucun');
  assert.equal(await P.evaluate(() => document.querySelector('.grid').dataset.mark), '1', 'la grille a été redessinée à la recherche');
  assert.equal(await P.$$eval('.grid .champ:not([hidden])', e => e.length), 0);
  await P.fill('[data-input=search]', '');
}

async function playGame(n) {
  await A.waitForSelector('.draft'); await B.waitForSelector('.draft');
  for (let i = 0; i < 20; i++) {
    for (let tries = 0; ; tries++) {
      assert.ok(tries < 200, `aucun joueur ne peut agir à l'étape ${i}`);
      const p = (await A.$(`.draft[data-step="${i}"] [data-act=lock]`)) ? A : (await B.$(`.draft[data-step="${i}"] [data-act=lock]`)) ? B : null;
      if (!p) { await A.waitForTimeout(50); continue; }
      try {
        await p.click(`.draft[data-step="${i}"] .champ:not([disabled])`, { timeout: 2000 });
        await p.click(`.draft[data-step="${i}"] [data-act=lock]:not([disabled])`, { timeout: 2000 });
      } catch { continue; }
      break;
    }
    for (const p of [A, B]) await p.waitForFunction((k) => { const d = document.querySelector('.draft'); return !d || +d.dataset.step > k; }, i);
    if (n === 1 && i === 9 && shots) await A.screenshot({ path: shots + '/draft.png' });
  }
  await A.waitForSelector('[data-act=setRoles]'); await B.waitForSelector('[data-act=setRoles]');
  if (n === 1 && shots) await A.screenshot({ path: shots + '/roles.png' });
  await A.click('[data-act=setRoles]'); await B.click('[data-act=setRoles]');
  await A.waitForSelector('.result'); await B.waitForSelector('.result');
  const pa = await A.$$eval('.pct', els => els.map(e => parseInt(e.textContent)));
  assert.equal(pa[0] + pa[1], 100);
  assert.equal(await A.textContent('.winner').then(t => t.split('·')[0]), await B.textContent('.winner').then(t => t.split('·')[0]));
  if (n === 1 && shots) await A.screenshot({ path: shots + '/result.png', fullPage: true });
}

await playGame(1);
const g1Picks = await A.$$eval('.lanes .lc .muted', els => els.map(e => e.textContent));
await A.click('[data-act=nextGame]');
const chooser = await Promise.race([A.waitForSelector('[data-act=chooseSide]').then(() => A), B.waitForSelector('[data-act=chooseSide]').then(() => B)]);
await chooser.click('[data-act=chooseSide][data-v=red]');
await A.waitForSelector('.draft');
// fearless : un champion pické en game 1 est désactivé avec un cadenas
const lockedNames = await A.$$eval('.champ[disabled] .lock', els => els.map(e => e.parentElement.querySelector('.nm').textContent));
assert.ok(g1Picks.every(n => lockedNames.includes(n)), 'tous les picks de la game 1 doivent être verrouillés');
await playGame(2);
let games = 2;
while (!(await A.$('[data-act=home]')) || await A.$('[data-act=nextGame]')) {
  await A.click('[data-act=nextGame]');
  const ch = await Promise.race([A.waitForSelector('[data-act=chooseSide]').then(() => A), B.waitForSelector('[data-act=chooseSide]').then(() => B)]);
  await ch.click('[data-act=chooseSide][data-v=blue]');
  await playGame(++games);
}
assert.ok(await A.$('.recap'), 'récap de série affiché');
assert.ok(await A.$('[data-act=rematch]'), 'revanche pour l\'hôte');
console.log(`Série terminée en ${games} games`);

// Chrono : sans action, l'étape avance après 30 s
const D = await newPage(), E = await newPage();
await D.clock.install(); await E.clock.install();
await D.goto(BASE + '?local=1'); await D.click('[data-act=create]'); await D.waitForSelector('.code');
await E.goto(D.url()); await D.waitForSelector('text=Adversaire');
await D.click('[data-act=team][data-v=HLE]'); await D.click('[data-act=side][data-v=blue]');
await E.click('[data-act=team][data-v=DK]'); await E.click('[data-act=side][data-v=red]');
await D.click('[data-act=start]'); await D.waitForSelector('.draft');
assert.equal(await D.$$eval('.ban.filled', e => e.length), 0);
await D.clock.runFor(31000); await E.clock.runFor(31000);
await D.waitForTimeout(500); await D.clock.runFor(500);
// les deux horloges simulées avancent séparément : au moins une action aléatoire a été jouée
assert.ok(await D.$$eval('.ban.filled', e => e.length) >= 1, 'ban aléatoire après expiration');
console.log('Chrono OK');

assert.deepEqual(errors, [], 'erreurs JS: ' + errors.join(' | '));
await browser.close();
console.log('E2E PASS');
