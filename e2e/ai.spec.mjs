// E2E : partie solo contre l'IA (mode local). Usage : node e2e/ai.spec.mjs [baseUrl]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';

const BASE = process.argv[2] || 'http://localhost:8080/';
const shots = process.env.SHOTS || '';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route(/ddragon|fonts\.(googleapis|gstatic)/, r => r.abort());
const errors = [];
const A = await context.newPage(); A.setDefaultTimeout(10000); A.on('pageerror', e => errors.push(e.message));
await A.goto(BASE + '?local=1');
await A.click('[data-act=create]');
await A.waitForSelector('[data-act=opponent][data-v=hard]');
await A.click('[data-act=opponent][data-v=hard]');
await A.waitForSelector('text=IA · Difficile');
assert.equal(await A.$('[data-act=copy]'), null, 'pas de lien à partager contre l\'IA');
await A.click('[data-act=team][data-v=GEN]');
await A.waitForSelector('[data-act=teamFor][data-v=ai][aria-pressed=true]'); // bascule auto sur l'équipe de l'IA
await A.click('[data-act=team][data-v=T1]');
await A.click('[data-act=side][data-v=red]');
await A.waitForSelector('.side-card.blue >> text=IA');
if (shots) await A.screenshot({ path: shots + '/ai-lobby.png' });
await A.click('[data-act=start]:not([disabled])');
await A.waitForSelector('.draft');
for (let i = 0; i < 20; i++) {
  await A.waitForSelector(`.draft[data-step="${i}"]`, { timeout: 15000 });
  if (await A.$(`.draft[data-step="${i}"] [data-act=lock]`)) {
    await A.click(`.draft[data-step="${i}"] .champ:not([aria-disabled=true])`);
    await A.click(`.draft[data-step="${i}"] [data-act=lock]:not([disabled])`);
  }
  await A.waitForFunction((k) => { const d = document.querySelector('.draft'); return !d || +d.dataset.step > k || d.querySelector('.turn')?.textContent.includes('finales'); }, i, { timeout: 15000 });
}
await A.waitForSelector('[data-act=setRoles]', { timeout: 15000 });
await A.click('[data-act=setRoles]');
await A.waitForSelector('[data-act=skipNarr]', { timeout: 15000 });
await A.click('[data-act=skipNarr]');
await A.waitForSelector('.pct');
const pa = await A.$$eval('.pct', els => els.map(e => parseInt(e.textContent)));
assert.equal(pa[0] + pa[1], 100);
if (shots) await A.screenshot({ path: shots + '/ai-result.png', fullPage: true });
assert.deepEqual(errors, []);
console.log('E2E IA PASS');
await browser.close();
