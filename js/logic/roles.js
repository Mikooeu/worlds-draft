import { ROLES } from './winrate.js';
// Affectation gloutonne : les couples (champion, rôle) les plus joués d'abord.
export function autoAssignRoles(champIds, data) {
  const cands = [];
  champIds.forEach((id, idx) => {
    for (const [role, games] of Object.entries(data.champions[id]?.roles || {})) {
      if (games > 0 && ROLES.includes(role)) cands.push({ id, role, games, idx });
    }
  });
  cands.sort((a, b) => b.games - a.games || a.idx - b.idx);
  const out = {}, used = new Set();
  for (const c of cands) if (!out[c.role] && !used.has(c.id)) { out[c.role] = c.id; used.add(c.id); }
  const freeRoles = ROLES.filter(r => !out[r]);
  for (const id of champIds) if (!used.has(id)) { out[freeRoles.shift()] = id; used.add(id); }
  return Object.fromEntries(ROLES.map(r => [r, out[r]]));
}
