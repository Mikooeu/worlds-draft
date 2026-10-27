import { esc, teamBadge, shortName } from './common.js?v=202610270138';

function seatCard(s, data, pid, label) {
  const seat = s.seats[pid] || {};
  const team = seat.team && data.teams[seat.team];
  return `<div class="panel seat ${seat.side || ''}">
    ${team ? teamBadge(team, 'lg') : '<span class="badge lg" style="background:#222">?</span>'}
    <div><div class="who">${label}</div>
    <div class="muted small">${team ? esc(team.name) : 'Choisit son équipe…'} · ${seat.side ? (seat.side === 'blue' ? 'Blue side' : 'Red side') : 'side ?'}</div></div>
  </div>`;
}

export function renderLobby(s, data, me) {
  const isHost = me === s.hostId;
  const opp = isHost ? s.guestId : s.hostId;
  const mySeat = s.seats[me], oppSeat = opp ? s.seats[opp] : {};
  const playable = Object.values(data.teams).filter(t => t.playable !== false);
  const regions = [...new Set(playable.map(t => t.region))];
  const ready = s.guestId && [s.hostId, s.guestId].every(p => s.seats[p]?.team && s.seats[p]?.side);
  const fmt = f => `<button class="choice ${s.format === f ? 'on' : ''}" data-act="format" data-v="${f}" ${isHost ? '' : 'disabled'}>${f.toUpperCase()}</button>`;
  return `<div class="wrap">
    <div class="lobby-head">
      <div><h2>Lobby</h2><div class="muted small">Partage ce lien à ton adversaire</div></div>
      <div style="display:flex;align-items:center;gap:14px"><span class="code">${esc(s.code)}</span><button class="btn btn-ghost" data-act="copy">Copier le lien</button></div>
    </div>
    <div class="lobby-grid">
      <div class="${'me'}">${seatCard(s, data, me, 'Toi' + (isHost ? ' (hôte)' : ''))}</div>
      ${opp ? seatCard(s, data, opp, 'Adversaire') : '<div class="panel seat"><span class="badge lg" style="background:#222">…</span><div><div class="who">En attente d\'un adversaire</div><div class="muted small">Envoie-lui le lien ou le code</div></div></div>'}
    </div>
    <div class="panel">
      <h3 class="section-title">Ton équipe</h3>
      ${regions.map(r => `<div class="muted small" style="margin:10px 0 6px">${esc(r)}</div><div class="teams">${
        playable.filter(t => t.region === r).map(t => {
          const cls = mySeat?.team === t.tag ? 'mine' : (oppSeat?.team === t.tag ? 'theirs' : '');
          return `<button class="team-btn ${cls}" data-act="team" data-v="${t.tag}" ${oppSeat?.team === t.tag ? 'disabled' : ''}>${teamBadge(t)}<span class="tn" title="${esc(t.name)}">${esc(shortName(t))}<span class="rec">${t.wins}V – ${t.losses}D</span></span></button>`;
        }).join('')}</div>`).join('')}
      <h3 class="section-title">Ton side</h3>
      <div class="choice-row">
        <button class="choice blue ${mySeat?.side === 'blue' ? 'on' : ''}" data-act="side" data-v="blue" ${oppSeat?.side === 'blue' ? 'disabled' : ''}>Blue side · first pick</button>
        <button class="choice red ${mySeat?.side === 'red' ? 'on' : ''}" data-act="side" data-v="red" ${oppSeat?.side === 'red' ? 'disabled' : ''}>Red side · first ban</button>
        <button class="choice" data-act="randomSides" ${opp ? '' : 'disabled'} title="Tire au sort le side des deux joueurs">🎲 Random</button>
      </div>
      <h3 class="section-title">Format ${isHost ? '' : '<span class="muted small">(choisi par l\'hôte)</span>'}</h3>
      <div class="choice-row">${fmt('bo1')}${fmt('bo3')}${fmt('bo5')}</div>
      ${s.format !== 'bo1' ? '<p class="muted small">Fearless : un champion pické dans une game précédente ne peut plus être pické dans la série.</p>' : ''}
    </div>
    <div class="lobby-foot">
      <span class="muted small">${ready ? (isHost ? 'Tout est prêt !' : 'En attente du lancement par l\'hôte…') : 'Chaque joueur choisit une équipe et un side différents. Reclique sur ton choix pour le libérer.'}</span>
      ${isHost ? `<button class="btn btn-gold" data-act="start" ${ready ? '' : 'disabled'}>Lancer la draft</button>` : ''}
    </div>
  </div>`;
}
