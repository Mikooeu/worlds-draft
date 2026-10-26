// Construit data/worlds.json à partir de data/raw/teams.csv et data/raw/games.txt.
// Usage : node scripts/build-data.mjs [date-de-mise-à-jour]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { champKey } from '../js/champKey.js';
export { champKey };

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];

export function buildData(teamsCsv, gamesTxt, updatedAt) {
  const [header, ...rows] = teamsCsv.trim().split(/\r?\n/);
  const cols = header.split(',');
  const teams = {}, players = {};
  for (const line of rows) {
    const v = Object.fromEntries(line.split(',').map((x, i) => [cols[i], x.trim()]));
    teams[v.tag] = { tag: v.tag, name: v.name, region: v.region, playable: v.region !== 'PLAYIN', wins: 0, losses: 0, players: Object.fromEntries(ROLES.map(r => [r, v[r]])) };
    for (const r of ROLES) players[v[r]] = { team: v.tag, role: r, champs: {} };
  }
  const champions = {}, matchups = Object.fromEntries(ROLES.map(r => [r, {}])), duos = {};
  const bump = (o, k, win) => { o[k] ??= { games: 0, wins: 0 }; o[k].games++; if (win) o[k].wins++; };

  for (const line of gamesTxt.trim().split(/\r?\n/).filter(Boolean)) {
    const [gameId, wTag, lTag, wPicks, lPicks] = line.split('|');
    const byRole = {};
    for (const [tag, list, win] of [[wTag, wPicks, true], [lTag, lPicks, false]]) {
      if (!teams[tag]) throw new Error(`game ${gameId}: équipe inconnue ${tag}`);
      teams[tag][win ? 'wins' : 'losses']++;
      const entries = list.split(';').map(s => { const i = s.indexOf(':'); return [s.slice(0, i).trim(), s.slice(i + 1).trim()]; });
      if (entries.length !== 5) throw new Error(`game ${gameId}: ${tag} n'a pas 5 picks`);
      for (const [player, champName] of entries) {
        const p = players[player];
        if (!p || p.team !== tag) throw new Error(`game ${gameId}: joueur ${player} absent du roster de ${tag}`);
        const k = champKey(champName);
        champions[k] ??= { name: champName, games: 0, wins: 0, roles: {} };
        champions[k].games++; if (win) champions[k].wins++;
        champions[k].roles[p.role] = (champions[k].roles[p.role] || 0) + 1;
        bump(p.champs, k, win);
        (byRole[p.role] ??= {})[win ? 'w' : 'l'] = k;
      }
      const side = win ? 'w' : 'l';
      const adc = byRole.adc?.[side], sup = byRole.support?.[side];
      if (adc && sup) bump(duos, `${adc}|${sup}`, win);
    }
    for (const r of ROLES) {
      const { w, l } = byRole[r] || {};
      if (!w || !l) throw new Error(`game ${gameId}: rôle ${r} incomplet`);
      const [a, b] = [w, l].sort();
      bump(matchups[r], `${a}|${b}`, a === w);
    }
  }
  return { updatedAt, teams, players, champions, matchups, duos };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const opt = f => { try { return readFileSync(new URL(f, root), 'utf8'); } catch { return ''; } };
  // Play-In : équipes éliminées comptées pour les stats seulement (région PLAYIN, non jouables)
  const playinRosters = opt('data/raw/playin-rosters.csv').trim().split(/\r?\n/).slice(1).join('\n');
  const teamsCsv = readFileSync(new URL('data/raw/teams.csv', root), 'utf8').trim() + (playinRosters ? '\n' + playinRosters : '');
  const gamesTxt = readFileSync(new URL('data/raw/games.txt', root), 'utf8').trim() + '\n' + opt('data/raw/playin.txt').trim();
  const d = buildData(teamsCsv, gamesTxt, process.argv[2] || new Date().toISOString().slice(0, 10));
  writeFileSync(new URL('data/worlds.json', root), JSON.stringify(d));
  const games = Object.values(d.teams).reduce((n, t) => n + t.wins + t.losses, 0) / 2;
  console.log(`worlds.json : ${Object.keys(d.teams).length} équipes, ${games} games, ${Object.keys(d.champions).length} champions`);
}
