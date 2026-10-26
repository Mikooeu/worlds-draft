import { esc, teamBadge, champIcon, champName, ROLE_FR, pct } from './common.js?v=202610261835';
import { seriesLine } from './draft.js?v=202610261835';

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
        <td class="c hide-m"><div class="wr ${wrCls(l.blue.wr)}">${pct(l.blue.wr)}</div><div class="muted small">${games(l.blue.games)}</div></td>
        <td class="c mu">${l.matchupBlue.games ? `<div class="mu-v"><span class="${wrCls(l.matchupBlue.wr)}">${pct(l.matchupBlue.wr)}</span> / <span class="${wrCls(1 - l.matchupBlue.wr)}">${pct(1 - l.matchupBlue.wr)}</span></div><div class="small">${l.matchupBlue.games} face-à-face ${srcTag(l.matchupBlue)}</div>` : 'Jamais joué'}</td>
        <td class="c hide-m"><div class="wr ${wrCls(l.red.wr)}">${pct(l.red.wr)}</div><div class="muted small">${games(l.red.games)}</div></td>
        <td class="r"><div class="lc r">${champIcon(data, l.red.champ)}<div><b>${esc(l.red.player)}</b><div class="muted small">${esc(champName(data, l.red.champ))}</div></div></div></td>
      </tr>`).join('')}
      ${r.duo ? `<tr class="duo-row">
        <td class="role">Duo bot</td>
        <td><span class="muted small">${esc(champName(data, r.lanes[3].blue.champ))} + ${esc(champName(data, r.lanes[4].blue.champ))}</span></td>
        <td class="c hide-m">${r.duo.blue.games ? `<div class="wr ${wrCls(r.duo.blue.wr)}">${pct(r.duo.blue.wr)}</div><div class="muted small">${games(r.duo.blue.games)} ${srcTag(r.duo.blue)}</div>` : '<span class="muted small">Jamais joué</span>'}</td>
        <td class="c mu">Synergie</td>
        <td class="c hide-m">${r.duo.red.games ? `<div class="wr ${wrCls(r.duo.red.wr)}">${pct(r.duo.red.wr)}</div><div class="muted small">${games(r.duo.red.games)} ${srcTag(r.duo.red)}</div>` : '<span class="muted small">Jamais joué</span>'}</td>
        <td class="r"><span class="muted small">${esc(champName(data, r.lanes[3].red.champ))} + ${esc(champName(data, r.lanes[4].red.champ))}</span></td>
      </tr>` : ''}
      </tbody></table>
      <p class="muted small">Winrate du joueur sur ce champion aux Worlds. S'il ne l'a jamais joué, on prend le winrate du champion sur le tournoi, sinon 50 %. Matchups et duos : Worlds en priorité, sinon dernier split des grandes régions. Les petits échantillons sont ramenés vers 50 %.</p>
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
  return `<div class="center-msg"><div style="display:grid;gap:18px;justify-items:center">
    <div class="muted small">${esc(seriesLine(s, data))}</div>
    ${teamBadge(t, 'lg')}
    <h2>${chooser ? 'Tu as perdu la game : choisis ton side' : `${esc(t.name)} choisit son side…`}</h2>
    ${chooser ? `<div class="choice-row"><button class="btn btn-blue" data-act="chooseSide" data-v="blue">Blue side · first pick</button><button class="btn btn-red" data-act="chooseSide" data-v="red">Red side · first ban</button></div>` : ''}
  </div></div>`;
}
