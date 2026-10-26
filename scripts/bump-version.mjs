// Ajoute ?v=<version> à tous les imports JS et aux liens de index.html, pour que les navigateurs
// rechargent toujours la dernière version après une mise à jour. Usage : node scripts/bump-version.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const v = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk(join(root, 'js')).filter(f => f.endsWith('.js'))) {
  const src = readFileSync(f, 'utf8');
  // seulement les spécificateurs relatifs ('./x.js', '../x.js')
  const out = src.replace(/((?:from|import)\s*\(?\s*['"])(\.\.?\/[^'"]+?\.js)(\?v=\d+)?(['"])/g, `$1$2?v=${v}$4`);
  if (out !== src) writeFileSync(f, out);
}
const idx = join(root, 'index.html');
writeFileSync(idx, readFileSync(idx, 'utf8').replace(/(css\/style\.css|js\/main\.js)(\?v=\d+)?/g, `$1?v=${v}`));
console.log('version', v);
