import { esc, champIcon, champName, ROLE_FR } from './common.js?v=202610291717';
import { ROLES } from '../logic/winrate.js?v=202610291717';

export function renderRoles(s, data, me, ui) {
  const g = s.games[s.games.length - 1];
  const side = s.seats[me].side, team = data.teams[side === 'blue' ? g.blueTeam : g.redTeam];
  const done = !!g.roles[side];
  const oppDone = !!g.roles[side === 'blue' ? 'red' : 'blue'];
  const roles = g.roles[side] || ui.roles;
  return `<div class="roles-wrap">
    <div style="text-align:center"><h2>Attribue les rôles</h2>
    <p class="muted">Place chaque champion sur un poste : c'est le joueur de ce poste qui le jouera.</p>
    <div class="timer" data-timer>30</div></div>
    <div class="panel" style="display:grid;gap:12px">
      ${ROLES.map(r => `<div class="role-row"><div class="rl">${ROLE_FR[r]}<div class="muted small" style="text-transform:none;font-family:Inter">${esc(team.players[r])}</div></div>
        <div style="display:flex;gap:10px;align-items:center"><div style="width:48px">${champIcon(data, roles[r])}</div>
        <select data-input="role" data-role="${r}" aria-label="Champion joué par ${esc(team.players[r])} (${ROLE_FR[r]})" ${done ? 'disabled' : ''} style="flex:1">${g.picks[side].map(id => `<option value="${esc(id)}" ${roles[r] === id ? 'selected' : ''}>${esc(champName(data, id))}</option>`).join('')}</select></div></div>`).join('')}
    </div>
    <div style="text-align:center">${done
      ? `<p class="muted">Rôles validés. ${oppDone ? '' : 'En attente de l\'adversaire…'}</p>`
      : `<button class="btn btn-gold" data-act="setRoles">Valider les rôles</button><p class="muted small">${oppDone ? 'L\'adversaire a validé.' : ''}</p>`}</div>
  </div>`;
}
