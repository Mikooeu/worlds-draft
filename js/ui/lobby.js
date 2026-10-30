import { esc, teamBadge, shortName } from './common.js?v=202610301425';

const SIDE_LABEL = { blue: 'Blue side', red: 'Red side' };

// Carte « joueur » du bandeau VS : équipe, side et état de préparation
function playerCard(s, data, pid, label, align) {
  const seat = (pid && s.seats[pid]) || {};
  const team = seat.team && data.teams[seat.team];
  const ready = !!(seat.team && seat.side);
  const status = !pid ? 'En attente…' : ready ? 'Prêt' : !seat.team ? 'Choisit son équipe…' : 'Choisit son side…';
  return `<div class="pcard ${align} ${seat.side || ''} ${ready ? 'ready' : ''}">
    ${team ? teamBadge(team, 'lg') : `<span class="logo lg empty">${pid ? '?' : '…'}</span>`}
    <div class="pinfo">
      <div class="who">${label}</div>
      <div class="pteam">${team ? esc(team.name) : '&nbsp;'}</div>
      <div class="pmeta">${seat.side ? `<span class="chip ${seat.side}">${SIDE_LABEL[seat.side]}</span>` : ''}<span class="pstatus ${ready ? 'ok' : ''}">${ready ? '✓ ' : ''}${status}</span></div>
    </div>
  </div>`;
}

const step = (n, title, done, extra = '') => `<div class="step-head"><span class="step-n ${done ? 'done' : ''}">${done ? '✓' : n}</span><h3>${title}</h3>${extra}</div>`;

export const AI_LABEL = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

export function renderLobby(s, data, me, opts = {}) {
  const isHost = me === s.hostId;
  const opp = isHost ? s.guestId : s.hostId;
  const mySeat = s.seats[me] || {}, oppSeat = (opp && s.seats[opp]) || {};
  const playable = Object.values(data.teams).filter(t => t.playable !== false);
  const regions = [...new Set(playable.map(t => t.region))];
  const ready = s.guestId && [s.hostId, s.guestId].every(p => s.seats[p]?.team && s.seats[p]?.side);
  const vsAi = !!s.ai;
  const forAi = vsAi && isHost && opts.teamFor === 'ai';
  const pickSeat = forAi ? oppSeat : mySeat, otherSeat = forAi ? mySeat : oppSeat;
  const humanJoined = !!s.guestId && !vsAi;

  const sideCard = (side, title, desc) => {
    const mine = mySeat.side === side, theirs = oppSeat.side === side;
    return `<button class="choice side-card ${side} ${mine ? 'on' : ''}" data-act="side" data-v="${side}" ${theirs && !vsAi ? 'disabled' : ''} aria-pressed="${mine}">
      <span class="side-title">${title}</span><span class="side-desc">${desc}</span>
      <span class="side-owner">${mine ? 'Toi' : theirs ? (vsAi ? 'IA' : 'Adversaire') : 'Libre'}</span>
    </button>`;
  };
  const fmt = (f, sub) => `<button class="choice fmt ${s.format === f ? 'on' : ''}" data-act="format" data-v="${f}" ${isHost ? '' : 'disabled'} aria-pressed="${s.format === f}"><b>${f.toUpperCase()}</b><span>${sub}</span></button>`;

  const status = vsAi ? (ready ? 'Tout est prêt, lance la draft !' : !mySeat.team || !oppSeat.team ? 'Choisis ton équipe et celle de l\'IA.' : 'Choisis ton side, l\'IA prend l\'autre.')
    : !opp ? 'Envoie le lien à ton adversaire, ou joue contre l\'IA.'
    : ready ? (isHost ? 'Tout est prêt, lance la draft !' : 'Tout est prêt, l\'hôte va lancer la draft…')
    : 'Chaque joueur choisit une équipe et un side différents.';

  return `<div class="wrap lobby">
    <div class="lobby-head">
      <div><h2>Lobby</h2><div class="muted small">Code de la partie</div></div>
      <div class="share">${vsAi ? '' : `<span class="code">${esc(s.code)}</span><button class="btn btn-ghost" data-act="copy">Copier le lien</button>`}</div>
    </div>

    <div class="versus">
      ${playerCard(s, data, me, 'Toi' + (isHost ? ' · hôte' : ''), 'left')}
      <div class="vs-mid">VS</div>
      ${playerCard(s, data, opp, vsAi ? `IA · ${AI_LABEL[s.ai.level]}` : opp ? 'Adversaire' : 'En attente d\'un adversaire', 'right')}
    </div>


    ${isHost ? `<section class="panel step opp-step">
      ${step('VS', 'Adversaire', true, humanJoined ? '<span class="muted small hint">Un ami a rejoint la partie</span>' : '')}
      <div class="opp-modes">
        <button class="choice ${!vsAi ? 'on' : ''}" data-act="opponent" data-v="human" aria-pressed="${!vsAi}"><b>Un ami</b><span>Partage le lien</span></button>
        ${['easy', 'medium', 'hard'].map(l => `<button class="choice ${s.ai?.level === l ? 'on' : ''}" data-act="opponent" data-v="${l}" aria-pressed="${s.ai?.level === l}" ${humanJoined ? 'disabled' : ''}><b>IA · ${AI_LABEL[l]}</b><span>${{ easy: 'Drafts approximatives', medium: 'Joue ses points forts', hard: 'Draft optimisée' }[l]}</span></button>`).join('')}
      </div>
    </section>` : ''}
    <section class="panel step">
      ${step(1, vsAi && isHost ? 'Choisis les équipes' : 'Choisis ton équipe', !!mySeat.team && (!vsAi || !!oppSeat.team), vsAi && isHost
        ? `<div class="team-for" role="group" aria-label="Équipe à choisir"><button class="choice ${!forAi ? 'on' : ''}" data-act="teamFor" data-v="me" aria-pressed="${!forAi}">Ton équipe</button><button class="choice ${forAi ? 'on' : ''}" data-act="teamFor" data-v="ai" aria-pressed="${forAi}">Équipe de l'IA</button></div>`
        : '<span class="muted small hint">Reclique sur ton choix pour le libérer</span>')}
      <div class="regions">${regions.map(r => `<div class="region"><div class="region-name">${esc(r)}</div><div class="teams">${
        playable.filter(t => t.region === r).map(t => {
          const mine = pickSeat.team === t.tag, theirs = otherSeat.team === t.tag;
          return `<button class="team-btn ${mine ? 'mine' : ''} ${theirs ? 'theirs' : ''}" data-act="team" data-v="${t.tag}" ${theirs ? 'disabled' : ''} aria-pressed="${mine}">${teamBadge(t)}<span class="tn" title="${esc(t.name)}">${esc(shortName(t))}<span class="rec">${t.wins}V – ${t.losses}D</span></span>${theirs ? `<span class="taken">${forAi ? 'Toi' : vsAi ? 'IA' : 'Adversaire'}</span>` : ''}</button>`;
        }).join('')}</div></div>`).join('')}</div>
    </section>

    <div class="step-row">
      <section class="panel step">
        ${step(2, 'Choisis ton side', !!mySeat.side, `<button class="choice dice" data-act="randomSides" ${opp ? '' : 'disabled'} title="Tire au sort le side des deux joueurs">🎲 Random</button>`)}
        <div class="sides">${sideCard('blue', 'Blue side', 'First pick')}${sideCard('red', 'Red side', 'First ban')}</div>
      </section>
      <section class="panel step">
        ${step(3, 'Format', true, isHost ? '' : '<span class="muted small hint">Choisi par l\'hôte</span>')}
        <div class="fmts">${fmt('bo1', '1 game')}${fmt('bo3', 'Premier à 2')}${fmt('bo5', 'Premier à 3')}</div>
        <p class="muted small fearless">${s.format !== 'bo1' ? 'Fearless : un champion pick dans une partie précédente ne peut plus être pick durant la suite du BO.' : '&nbsp;'}</p>
      </section>
    </div>

    <div class="lobby-foot">
      <span class="foot-status ${ready ? 'ok' : ''}">${status}</span>
      ${isHost ? `<button class="btn btn-gold" data-act="start" ${ready ? '' : 'disabled'}>Lancer la draft</button>` : ''}
    </div>
  </div>`;
}
