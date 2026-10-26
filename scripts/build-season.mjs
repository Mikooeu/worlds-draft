// Construit data/season.json (matchups de lane et duos bot du dernier split des grandes régions)
// à partir de data/raw/season/*.txt : "<id>|<5 picks gagnant top;jungle;mid;adc;support>|<5 picks perdant>".
// Usage : node scripts/build-season.mjs "Libellé du split"
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { champKey } from '../js/champKey.js';

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];

export function buildSeason(filesByRegion, label) {
  const matchups = Object.fromEntries(ROLES.map(r => [r, {}])), duos = {}, pairs = {};
  const bump = (o, k, win) => { o[k] ??= { games: 0, wins: 0 }; o[k].games++; if (win) o[k].wins++; };
  const seen = new Set(); let games = 0;
  for (const text of Object.values(filesByRegion)) {
    for (const line of text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
      const [id, w, l] = line.split('|');
      if (seen.has(id)) continue;
      const W = (w || '').split(';').map(s => champKey(s.trim())), L = (l || '').split(';').map(s => champKey(s.trim()));
      if (W.length !== 5 || L.length !== 5 || [...W, ...L].some(x => !x)) throw new Error(`game ${id}: ligne invalide`);
      seen.add(id); games++;
      ROLES.forEach((r, i) => { const [a, b] = [W[i], L[i]].sort(); bump(matchups[r], `${a}|${b}`, a === W[i]); });
      bump(duos, `${W[3]}|${W[4]}`, true); bump(duos, `${L[3]}|${L[4]}`, false);
      for (const [T, win] of [[W, true], [L, false]]) for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) bump(pairs, [T[i], T[j]].sort().join('|'), win);
    }
  }
  return { label, games, matchups, duos, pairs };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = new URL('../data/raw/season/', import.meta.url);
  const files = Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.txt')).map(f => [f, readFileSync(new URL(f, dir), 'utf8')]));
  const s = buildSeason(files, process.argv[2] || 'Dernier split');
  writeFileSync(new URL('../data/season.json', import.meta.url), JSON.stringify(s));
  console.log(`season.json : ${s.games} games (${Object.keys(files).join(', ')})`);
}
