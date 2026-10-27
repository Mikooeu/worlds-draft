import { esc } from './common.js?v=202610271621';
import { ROLES } from '../logic/winrate.js?v=202610271621';

const pctRaw = (w, n) => `${Math.round((w / n) * 100)} %`;

// Contenu de la petite case affichée au survol (ou appui long) d'un champion pendant la draft.
export function champTooltip(data, id, myTeamTag) {
  const c = data.champions[id] || { name: id, games: 0, wins: 0, positions: [] };
  const lines = [`<div class="tip-name">${esc(c.name)}</div>`];
  if (!c.games) {
    lines.push('<div class="tip-row muted">Pas encore joué aux Worlds</div>');
  } else {
    lines.push(`<div class="tip-row"><span>Winrate</span><b>${pctRaw(c.wins, c.games)}</b><span class="muted">${c.games} game${c.games > 1 ? 's' : ''}</span></div>`);
    if (data.totalGames) lines.push(`<div class="tip-row"><span>Pick rate</span><b>${pctRaw(c.games, data.totalGames)}</b></div>`);
  }
  const team = myTeamTag && data.teams[myTeamTag];
  if (team) {
    const played = ROLES.map(r => team.players[r]).find(p => data.players[p]?.champs?.[id]?.games);
    if (played) {
      const s = data.players[played].champs[id];
      lines.push(`<div class="tip-row tip-player">${esc(played)} : ${s.wins}V / ${s.games}</div>`);
    } else {
      const role = (c.positions || [])[0];
      if (role) lines.push(`<div class="tip-row tip-player muted">${esc(team.players[role])} ne l'a jamais joué aux Worlds</div>`);
    }
  }
  return lines.join('');
}
