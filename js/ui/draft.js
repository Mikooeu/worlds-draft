import { esc, teamBadge, champIcon, champName, ROLE_FR } from './common.js?v=202610261939';
import { DRAFT_ORDER } from '../logic/draftOrder.js?v=202610261939';
import { availableChampions, fearlessLocked } from '../logic/availability.js?v=202610261939';
import { ROLES } from '../logic/winrate.js?v=202610261939';

export function seriesLine(s, data) {
  if (s.format === 'bo1') return 'BO1';
  const [a, b] = Object.keys(s.wins);
  return `${s.format.toUpperCase()} · Game ${s.games.length} · ${data.teams[a].tag} ${s.wins[a]} – ${s.wins[b]} ${data.teams[b].tag}`;
}

export function renderDraft(s, data, me, ui) {
  const g = s.games[s.games.length - 1];
  const mySide = s.seats[me].side;
  const cur = DRAFT_ORDER[s.step];
  const myTurn = cur && cur.side === mySide;
  const locked = new Set(fearlessLocked(s.games.slice(0, -1)));
  const avail = new Set(availableChampions(data.champList.map(c => c.id), g, [...locked]));
  const teamB = data.teams[g.blueTeam], teamR = data.teams[g.redTeam];

  // index de l'action en cours dans chaque rangée
  const countBefore = (side, type) => DRAFT_ORDER.slice(0, s.step).filter(o => o.side === side && o.type === type).length;
  const slot = (side, type, i) => {
    const list = g[type === 'ban' ? 'bans' : 'picks'][side];
    const active = cur && cur.side === side && cur.type === type && countBefore(side, type) === i;
    const preview = active && myTurn && ui.sel ? ui.sel : null;
    const id = list[i] || preview;
    if (type === 'ban') return `<div class="ban ${list[i] ? 'filled' : ''} ${active ? 'active' : ''}" title="${esc(id ? champName(data, id) : '')}">${id ? champIcon(data, id) : ''}</div>`;
    return `<div class="pick ${active ? 'active' : ''} ${!list[i] && preview ? 'preview' : ''}">
      <div class="ph">${champIcon(data, id)}</div>
      <div><div class="label">${id ? esc(champName(data, id)) : (active ? 'En cours…' : '')}</div><div class="sub">${esc((side === 'blue' ? teamB : teamR).players[ROLES[i]])}</div></div></div>`;
  };
  const q = ui.search.trim().toLowerCase();
  const list = data.champList.filter(c => (!q || c.name.toLowerCase().includes(q))
    && (ui.role === 'all' || (data.champions[c.id]?.positions || []).includes(ui.role)));
  const turnText = !cur ? '' : myTurn ? `À toi : ${cur.type === 'ban' ? 'bannis' : 'choisis'} un champion` : `L'adversaire ${cur.type === 'ban' ? 'bannit' : 'choisit'}…`;

  return `<div class="draft" data-step="${s.step}">
    <div class="dhead">
      <div class="dteam blue">${teamBadge(teamB, 'lg')}<div><div class="name">${esc(teamB.name)}</div><div class="muted small">${mySide === 'blue' ? 'Toi' : 'Adversaire'} · Blue</div></div></div>
      <div class="dcenter"><div class="turn ${myTurn ? 'mine' : ''}">${esc(turnText)}</div><div class="timer" data-timer>30</div><div class="series-score">${esc(seriesLine(s, data))} · ${s.step < 6 ? 'Bans 1' : s.step < 12 ? 'Picks 1' : s.step < 16 ? 'Bans 2' : 'Picks 2'}</div></div>
      <div class="dteam red"><div style="text-align:right"><div class="name">${esc(teamR.name)}</div><div class="muted small">Red · ${mySide === 'red' ? 'Toi' : 'Adversaire'}</div></div>${teamBadge(teamR, 'lg')}</div>
    </div>
    <div class="bans">
      <div class="ban-row blue">${[0, 1, 2, 3, 4].map(i => slot('blue', 'ban', i)).join('')}</div>
      <div class="ban-row red">${[0, 1, 2, 3, 4].map(i => slot('red', 'ban', i)).join('')}</div>
    </div>
    <div class="dmain">
      <div class="picks blue">${[0, 1, 2, 3, 4].map(i => slot('blue', 'pick', i)).join('')}</div>
      <div class="pool">
        <div class="filters">
          <input data-input="search" placeholder="Rechercher un champion" value="${esc(ui.search)}" aria-label="Rechercher">
          ${['all', ...ROLES].map(r => `<button class="rolef ${ui.role === r ? 'on' : ''}" data-act="role" data-v="${r}">${r === 'all' ? 'Tous' : ROLE_FR[r]}</button>`).join('')}
        </div>
        <div class="grid">${list.map(c => {
          const ok = avail.has(c.id);
          return `<button class="champ ${ui.sel === c.id ? 'sel' : ''}" data-act="sel" data-v="${esc(c.id)}" ${ok && myTurn ? '' : 'disabled'} title="${esc(c.name)}">
            ${champIcon(data, c.id)}${locked.has(c.id) ? '<span class="lock" title="Fearless">🔒</span>' : ''}<span class="nm">${esc(c.name)}</span></button>`;
        }).join('') || '<p class="muted">Aucun champion.</p>'}</div>
      </div>
      <div class="picks red">${[0, 1, 2, 3, 4].map(i => slot('red', 'pick', i)).join('')}</div>
    </div>
    <div class="dfoot">${myTurn
      ? `<button class="btn btn-gold" data-act="lock" ${ui.sel && avail.has(ui.sel) ? '' : 'disabled'}>${cur.type === 'ban' ? 'Bannir' : 'Valider'}${ui.sel ? ' ' + esc(champName(data, ui.sel)) : ''}</button>`
      : '<span class="muted">En attente de l\'adversaire…</span>'}</div>
  </div>`;
}
