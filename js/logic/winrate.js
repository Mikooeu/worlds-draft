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
function matchup(data, role, a, b) {
  const m = data.matchups?.[role] || {};
  const direct = m[`${a}|${b}`];
  if (direct) return { games: direct.games, wr: smooth(direct.wins, direct.games, 0.5) };
  const rev = m[`${b}|${a}`];
  if (rev) return { games: rev.games, wr: smooth(rev.games - rev.wins, rev.games, 0.5) };
  return { games: 0, wr: 0.5 };
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
  const eqB = teamWr(data, blue.team), eqR = teamWr(data, red.team);
  S += logit(eqB) - logit(eqR);
  const pBlue = 1 / (1 + Math.exp(-C * S));
  const pRed = 1 - pBlue;
  const displayBlue = Math.round(pBlue * 100);
  let winner;
  if (pBlue !== pRed) winner = pBlue > pRed ? 'blue' : 'red';
  else winner = eqR > eqB ? 'red' : 'blue';
  return { pBlue, pRed, displayBlue, displayRed: 100 - displayBlue, winner, lanes, teamWr: { blue: eqB, red: eqR } };
}
