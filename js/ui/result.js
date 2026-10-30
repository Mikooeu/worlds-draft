import { ROLES } from '../logic/winrate.js?v=202610301535';
import { esc, teamBadge, champIcon, champName, ROLE_FR, pct } from './common.js?v=202610301535';
import { seriesLine } from './draft.js?v=202610301535';

const games = (n) => `${n} partie${n > 1 ? 's' : ''}`;
const SRC = { worlds: 'Worlds', season: 'Split été' };
const srcTag = (x) => (x?.source ? `<span class="src">${SRC[x.source]}</span>` : '');
const wrCls = (p) => (p >= 0.55 ? 'good' : p <= 0.45 ? 'bad' : '');

export function renderResult(s, data, me) {
  const g = s.games[s.games.length - 1], r = g.result;
  const tb = data.teams[g.blueTeam], tr = data.teams[g.redTeam];
  const myTeam = s.seats[me].team;
  const won = r.winnerTeam === myTeam;
  const end = s.phase === 'seriesEnd';
  const seriesWinnerTag = end ? Object.keys(s.wins).find(t => s.wins[t] === Math.max(...Object.values(s.wins))) : null;
  return `<div class="result">
    <div class="muted small" style="text-align:center">${esc(seriesLine(s, data))}</div>
    <div class="score-head">
      <div class="side blue">${teamBadge(tb, 'lg')}<div><div class="pct blue">${r.displayBlue} %</div><div class="muted">${esc(tb.name)}</div></div></div>
      <div class="vs">VS</div>
      <div class="side red"><div><div class="pct red">${r.displayRed} %</div><div class="muted">${esc(tr.name)}</div></div>${teamBadge(tr, 'lg')}</div>
    </div>
    <div class="winbar"><div class="b" style="width:${r.displayBlue}%"></div><div class="r" style="width:${r.displayRed}%"></div></div>
    <div class="winner">${esc(data.teams[r.winnerTeam].name)} remporte la game · ${won ? 'Victoire !' : 'Défaite'}</div>
    <div class="panel" style="overflow-x:auto">
      <table class="lanes">
      <colgroup><col class="c-role"><col class="c-player"><col class="c-wr hide-m"><col class="c-mu"><col class="c-wr hide-m"><col class="c-player"></colgroup>
      <thead><tr><th>Poste</th><th>Blue</th><th class="c hide-m">Winrate</th><th class="c">Matchup</th><th class="c hide-m">Winrate</th><th class="r">Red</th></tr></thead><tbody>
      ${r.lanes.map(l => `<tr>
        <td class="role">${ROLE_FR[l.role]}</td>
        <td><div class="lc">${champIcon(data, l.blue.champ)}<div><b>${esc(l.blue.player)}</b><div class="muted small">${esc(champName(data, l.blue.champ))}</div></div></div></td>
        <td class="c hide-m"><div class="wr ${wrCls(l.blue.wr)}">${pct(l.blue.wr)}</div></td>
        <td class="c mu">${l.matchupBlue.games ? `<div class="mu-v"><span class="${wrCls(l.matchupBlue.wr)}">${pct(l.matchupBlue.wr)}</span> / <span class="${wrCls(1 - l.matchupBlue.wr)}">${pct(1 - l.matchupBlue.wr)}</span></div><div class="small">${l.matchupBlue.games} face-à-face ${srcTag(l.matchupBlue)}</div>` : 'Jamais joué'}</td>
        <td class="c hide-m"><div class="wr ${wrCls(l.red.wr)}">${pct(l.red.wr)}</div></td>
        <td class="r"><div class="lc r">${champIcon(data, l.red.champ)}<div><b>${esc(l.red.player)}</b><div class="muted small">${esc(champName(data, l.red.champ))}</div></div></div></td>
      </tr>`).join('')}
      ${r.synergy ? `<tr class="duo-row">
        <td class="role">Synergie</td>
        <td><span class="muted small">Composition complète</span></td>
        <td class="c hide-m"><div class="wr ${wrCls(r.synergy.blue.wr)}">${pct(r.synergy.blue.wr)}</div><div class="muted small">${r.synergy.blue.known}/10 paires</div></td>
        <td class="c mu">Équipe</td>
        <td class="c hide-m"><div class="wr ${wrCls(r.synergy.red.wr)}">${pct(r.synergy.red.wr)}</div><div class="muted small">${r.synergy.red.known}/10 paires</div></td>
        <td class="r"><span class="muted small">Composition complète</span></td>
      </tr>` : ''}
      </tbody></table>
      <p class="muted small">Winrate du joueur sur ce champion aux Worlds. S'il ne l'a jamais joué, on prend le winrate du champion sur le tournoi, sinon 50 %. Synergie : winrate moyen des paires de champions de l'équipe jouées ensemble. Matchups et synergies : Worlds en priorité, sinon dernier split des grandes régions. Les petits échantillons sont ramenés vers 50 %.</p>
    </div>
    ${end ? `<div class="panel recap"><h3 style="color:var(--gold)">${esc(data.teams[seriesWinnerTag].name)} remporte la série ${Math.max(...Object.values(s.wins))}–${Math.min(...Object.values(s.wins))}</h3>
      ${s.games.map((x, i) => `<div class="g"><span>Game ${i + 1} · ${esc(x.blueTeam)} vs ${esc(x.redTeam)}</span><span>${x.result.displayBlue} % – ${x.result.displayRed} % · <b>${esc(x.result.winnerTeam)}</b></span></div>`).join('')}</div>` : ''}
    <div class="result-foot">
      ${end
        ? (me === s.hostId ? '<button class="btn btn-gold" data-act="rematch">Revanche</button>' : '<span class="muted">L\'hôte peut lancer une revanche.</span>')
        : '<button class="btn btn-gold" data-act="nextGame">Game suivante</button>'}
      <button class="btn btn-ghost" data-act="home">Quitter</button>
    </div>
  </div>`;
}

export function renderSideChoice(s, data, me) {
  const chooser = s.sideChooser === me;
  const t = data.teams[s.seats[s.sideChooser].team];
  return `<div class="center-msg"><div style="display:grid;gap:1.125rem;justify-items:center">
    <div class="muted small">${esc(seriesLine(s, data))}</div>
    ${teamBadge(t, 'lg')}
    <h2>${chooser ? 'Tu as perdu la game : choisis ton side' : `${esc(t.name)} choisit son side…`}</h2>
    ${chooser ? `<div class="choice-row"><button class="btn btn-blue" data-act="chooseSide" data-v="blue">Blue side · first pick</button><button class="btn btn-red" data-act="chooseSide" data-v="red">Red side · first ban</button></div>` : ''}
  </div></div>`;
}

// Récit accéléré de la game (avant le tableau des résultats)
// Simulation de la game : HUD façon diffusion (kills, horloge, objectifs, avance en or) + fil des actions
export function renderNarrative(s, data) {
  const g = s.games[s.games.length - 1];
  const tb = data.teams[g.blueTeam], tr = data.teams[g.redTeam];
  const comp = (side) => `<div class="hud-comp">${ROLES.map(r => champIcon(data, g.roles?.[side]?.[r] || g.picks[side][ROLES.indexOf(r)])).join('')}</div>`;
  const team = (t, side) => `<div class="hud-team ${side}">
      <div class="hud-id">${teamBadge(t, 'lg')}<div><div class="hud-name">${esc(t.name)}</div><div class="hud-obj" id="obj-${side}"></div></div></div>
      ${comp(side)}
    </div>`;
  return `<div class="result narr">
    <h2 class="sr-only">Simulation de la game ${s.games.length}</h2>
    <div class="hud">
      ${team(tb, 'blue')}
      <div class="hud-mid">
        <div class="hud-kills"><span class="k blue" id="k-blue">0</span><span class="hud-clock" id="hud-clock">00:00</span><span class="k red" id="k-red">0</span></div>
        <div class="hud-meta">${s.format.toUpperCase()}, game ${s.games.length}</div>
      </div>
      ${team(tr, 'red')}
    </div>
    <div class="lead" aria-hidden="true">
      <div class="lead-track"><div class="lead-fill" id="lead-fill"></div><span class="lead-mid"></span></div>
      <div class="lead-label" id="lead-label">Or égal</div>
    </div>
    <ol class="feed" id="feed" aria-live="polite" aria-label="Actions de la game, la plus récente en haut"></ol>
    <div class="result-foot"><button class="btn btn-ghost" data-act="skipNarr">Passer à l'analyse</button></div>
  </div>`;
}
const KEY = new Set(['comeback', 'baron', 'ace', 'nexus']);
export const feedItem = (e) => `<li class="feed-item ${e.side} ${KEY.has(e.kind) ? 'key' : ''} ${e.kind}"><span class="feed-time">${e.time}</span><p class="feed-text">${esc(e.text)}</p></li>`;
const kGold = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} k` : `${n}`);
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
// Met à jour le HUD sans redessiner l'écran
export function updateNarrHud(sc, data, g) {
  const $ = (id) => document.getElementById(id);
  if (!$('hud-clock')) return;
  $('hud-clock').textContent = sc.time;
  $('k-blue').textContent = sc.blue.kills; $('k-red').textContent = sc.red.kills;
  for (const side of ['blue', 'red']) {
    const t = sc[side];
    $('obj-' + side).textContent = [plural(t.towers, 'tour'), plural(t.dragons, 'dragon'), ...(t.barons ? [plural(t.barons, 'Nashor').replace('Nashors', 'Nashor')] : [])].join(', ');
  }
  const max = 8000, w = Math.min(1, Math.abs(sc.lead) / max) * 50;
  const fill = $('lead-fill');
  fill.className = 'lead-fill ' + (sc.lead > 0 ? 'blue' : sc.lead < 0 ? 'red' : '');
  fill.style.left = sc.lead > 0 ? `${50 - w}%` : '50%'; fill.style.width = `${w}%`;
  const leader = sc.lead > 0 ? data.teams[g.blueTeam] : data.teams[g.redTeam];
  const lab = $('lead-label');
  lab.className = 'lead-label ' + (sc.lead > 0 ? 'blue' : sc.lead < 0 ? 'red' : '');
  lab.textContent = Math.abs(sc.lead) < 300 ? 'Or égal' : `${leader.name} +${kGold(Math.abs(sc.lead))} d'or`;
}
