import { esc, shortName } from './common.js?v=202610301516';
import { ROLES } from '../logic/winrate.js?v=202610301516';

const pctRaw = (w, n) => `${Math.round((w / n) * 100)} %`;

// Contenu de la petite case affichée au survol (ou appui long) d'un champion pendant la draft.
// opts.opponent : pendant un ban, on montre le joueur adverse (c'est son champion qu'on retire)
export function champTooltip(data, id, myTeamTag, opts = {}) {
  const c = data.champions[id] || { name: id, games: 0, wins: 0, positions: [] };
  const count = c.games ? `<span class="tip-count muted">${c.games} game${c.games > 1 ? 's' : ''}</span>` : '';
  const lines = [`<div class="tip-head"><span class="tip-name">${esc(c.name)}</span>${count}</div>`];
  if (!c.games) {
    lines.push('<div class="tip-row muted">Pas encore joué aux Worlds</div>');
  } else {
    lines.push(`<div class="tip-stats"><span>Winrate</span><b>${pctRaw(c.wins, c.games)}</b>${data.totalGames ? `<span>Pick rate</span><b>${pctRaw(c.games, data.totalGames)}</b>` : ''}</div>`);
  }
  const team = myTeamTag && data.teams[myTeamTag];
  const tag = opts.opponent ? '<span class="tip-tag">Adversaire</span> ' : '';
  if (team && opts.opponent) {
    // Ban : bilan de toute l'équipe adverse sur ce champion (plusieurs joueurs peuvent le jouer)
    let games = 0, wins = 0;
    for (const r of ROLES) { const s = data.players[team.players[r]]?.champs?.[id]; if (s) { games += s.games; wins += s.wins; } }
    lines.push(games
      ? `<div class="tip-row tip-player">${tag}${esc(shortName(team))} : ${wins}V / ${games}</div>`
      : `<div class="tip-row tip-player muted">${tag}${esc(shortName(team))} ne l'a jamais joué aux Worlds</div>`);
  } else if (team) {
    const played = ROLES.map(r => team.players[r]).find(p => data.players[p]?.champs?.[id]?.games);
    if (played) {
      const s = data.players[played].champs[id];
      lines.push(`<div class="tip-row tip-player">${tag}${esc(played)} : ${s.wins}V / ${s.games}</div>`);
    } else {
      const role = (c.positions || [])[0];
      if (role) lines.push(`<div class="tip-row tip-player muted">${tag}${esc(team.players[role])} ne l'a jamais joué aux Worlds</div>`);
    }
  }
  return lines.join('');
}
