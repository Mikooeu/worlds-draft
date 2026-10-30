// IA de draft : choisit un ban ou un pick pour le side de l'IA. Pur (rng injecté), testable.
// Facile : choix plausible mais aléatoire. Moyen : parmi les meilleurs, avec du hasard. Difficile : le meilleur choix.
import { DRAFT_ORDER } from './draftOrder.js?v=202610301522';
import { availableChampions, fearlessLocked } from './availability.js?v=202610301522';
import { ROLES, smooth, logit, playerChamp, matchup } from './winrate.js?v=202610301522';
import { autoAssignRoles } from './roles.js?v=202610301522';

export const AI_ID = 'ai';
export const AI_LEVELS = ['easy', 'medium', 'hard'];
const SIDES = ['blue', 'red'];

const fits = (data, id, role) => (data.champions[id]?.positions || []).includes(role);

// À quel point un joueur est fort et à l'aise sur un champion (échelle logit)
function comfort(data, player, id) {
  const pc = playerChamp(data, player, id);
  const meta = data.champions[id]?.games || 0;
  return logit(pc.wr) + 0.25 * Math.log1p(pc.games) + 0.08 * Math.log1p(meta);
}
function pairLogit(data, a, b) {
  const key = [a, b].sort().join('|');
  const w = data.pairs?.[key], s = data.season?.pairs?.[key];
  const p = w?.games ? w : s?.games ? s : null;
  return p ? logit(smooth(p.wins, p.games, 0.5)) : 0;
}
const filled = (data, picks) => {
  if (!picks.length) return {};
  const r = autoAssignRoles(picks, data);
  return Object.fromEntries(ROLES.filter(x => r[x]).map(x => [x, r[x]]));
};

// Valeur d'un pick (champion, rôle) pour une équipe, compte tenu de ce qui est déjà pické
function pickValue(data, teamTag, role, id, myPicks, enemyRoles) {
  const player = data.teams[teamTag].players[role];
  let v = comfort(data, player, id);
  const foe = enemyRoles[role];
  if (foe) v += logit(matchup(data, role, id, foe).wr);
  for (const p of myPicks) v += pairLogit(data, id, p) / 4;
  return v;
}

function choose(scored, level, rng) {
  scored.sort((a, b) => b.v - a.v);
  if (!scored.length) return null;
  if (level === 'hard') {
    const top = scored.filter(x => x.v >= scored[0].v - 0.03);
    return top[Math.floor(rng() * top.length)].id;
  }
  const pool = scored.slice(0, level === 'medium' ? 6 : 25);
  const T = level === 'medium' ? 0.35 : 1.5;
  const w = pool.map(x => Math.exp((x.v - pool[0].v) / T));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i].id; }
  return pool[pool.length - 1].id;
}

export function aiChoose(state, data, champIds, level = 'medium', rng = Math.random) {
  const { side, type } = DRAFT_ORDER[state.step] || {};
  if (!side) return null;
  const g = state.games[state.games.length - 1];
  const foeSide = SIDES.find(x => x !== side);
  const myTeam = side === 'blue' ? g.blueTeam : g.redTeam, foeTeam = side === 'blue' ? g.redTeam : g.blueTeam;
  const avail = availableChampions(champIds, g, fearlessLocked(state.games.slice(0, -1)));
  const myPicks = g.picks[side], foePicks = g.picks[foeSide];
  const myRoles = filled(data, myPicks), foeRoles = filled(data, foePicks);
  const myOpen = ROLES.filter(r => !myRoles[r]), foeOpen = ROLES.filter(r => !foeRoles[r]);
  const scored = [];
  if (type === 'ban') {
    // retirer ce que l'adversaire jouerait le mieux sur ses postes encore libres
    for (const id of avail) {
      const roles = foeOpen.filter(r => fits(data, id, r));
      if (!roles.length) continue;
      scored.push({ id, v: Math.max(...roles.map(r => pickValue(data, foeTeam, r, id, foePicks, myRoles))) });
    }
  } else {
    for (const id of avail) {
      const roles = myOpen.filter(r => fits(data, id, r));
      if (!roles.length) continue;
      scored.push({ id, v: Math.max(...roles.map(r => pickValue(data, myTeam, r, id, myPicks, foeRoles))) });
    }
  }
  return choose(scored, level, rng) ?? avail[Math.floor(rng() * avail.length)] ?? null;
}

// Meilleure répartition des 5 champions sur les 5 postes (120 permutations)
export function aiRoles(data, teamTag, picks, foeRoles = {}) {
  let best = null, bestV = -Infinity;
  const perm = (arr, k = 0) => {
    if (k === arr.length) {
      const roles = Object.fromEntries(ROLES.map((r, i) => [r, arr[i]]));
      let v = 0;
      for (const r of ROLES) v += pickValue(data, teamTag, r, roles[r], [], foeRoles) + (fits(data, roles[r], r) ? 3 : 0);
      if (v > bestV) { bestV = v; best = roles; }
      return;
    }
    for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; }
  };
  perm([...picks]);
  return best;
}
