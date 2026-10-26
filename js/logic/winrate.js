export const ROLES = Object.freeze(['top', 'jungle', 'mid', 'adc', 'support']);
export const K = 5;      // poids du lissage
export const C = 0.5;    // coefficient d'échelle

export function smooth(wins, games, prior, k = K) {
  return (wins + k * prior) / (games + k);
}
const logit = (p) => Math.log(p / (1 - p));

function teamWr(data, tag) {
  const t = data.teams[tag];
  return smooth(t.wins, t.wins + t.losses, 0.5);
}
function champWr(data, id) {
  const c = data.champions[id];
  return c && c.games > 0 ? smooth(c.wins, c.games, 0.5) : 0.5;
}
function playerChamp(data, playerName, id) {
  const pc = data.players[playerName]?.champs?.[id];
  const prior = champWr(data, id);
  if (!pc || !pc.games) return { games: 0, wr: prior };
  return { games: pc.games, wr: smooth(pc.wins, pc.games, prior) };
}
// Cherche une paire (a|b) dans une table, dans les deux sens. Renvoie { games, wins } du point de vue de a.
function lookupPair(m, a, b) {
  const d = m?.[`${a}|${b}`];
  if (d && d.games) return { games: d.games, wins: d.wins };
  const r = m?.[`${b}|${a}`];
  if (r && r.games) return { games: r.games, wins: r.games - r.wins };
  return null;
}
// Worlds d'abord ; sinon dernier split des grandes régions ; sinon neutre.
function pairStat(worldsTable, seasonTable, a, b) {
  for (const [src, table] of [['worlds', worldsTable], ['season', seasonTable]]) {
    const p = lookupPair(table, a, b);
    if (p) return { games: p.games, wr: smooth(p.wins, p.games, 0.5), source: src };
  }
  return { games: 0, wr: 0.5, source: null };
}
const matchup = (data, role, a, b) => pairStat(data.matchups?.[role], data.season?.matchups?.[role], a, b);
// duo bot : clé adc|support, sans notion de sens
function duo(data, adc, sup) {
  for (const [src, table] of [['worlds', data.duos], ['season', data.season?.duos]]) {
    const d = table?.[`${adc}|${sup}`];
    if (d && d.games) return { games: d.games, wr: smooth(d.wins, d.games, 0.5), source: src };
  }
  return { games: 0, wr: 0.5, source: null };
}

export function computeResult(data, blue, red) {
  let S = 0;
  const lanes = ROLES.map((role) => {
    const bp = data.teams[blue.team].players[role], rp = data.teams[red.team].players[role];
    const bc = blue.roles[role], rc = red.roles[role];
    const b = playerChamp(data, bp, bc), r = playerChamp(data, rp, rc);
    const mu = matchup(data, role, bc, rc);
    S += logit(b.wr) - logit(r.wr) + logit(mu.wr);
    return { role, blue: { player: bp, champ: bc, ...b }, red: { player: rp, champ: rc, ...r }, matchupBlue: mu };
  });
  const duoB = duo(data, blue.roles.adc, blue.roles.support), duoR = duo(data, red.roles.adc, red.roles.support);
  S += logit(duoB.wr) - logit(duoR.wr);
  const eqB = teamWr(data, blue.team), eqR = teamWr(data, red.team);
  S += logit(eqB) - logit(eqR);
  const pBlue = 1 / (1 + Math.exp(-C * S));
  const pRed = 1 - pBlue;
  const displayBlue = Math.round(pBlue * 100);
  let winner;
  if (pBlue !== pRed) winner = pBlue > pRed ? 'blue' : 'red';
  else winner = eqR > eqB ? 'red' : 'blue';
  return { pBlue, pRed, displayBlue, displayRed: 100 - displayBlue, winner, lanes, duo: { blue: duoB, red: duoR }, teamWr: { blue: eqB, red: eqR } };
}
