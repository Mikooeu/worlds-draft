import { ROLES } from './winrate.js?v=202610280003';
// Affectation gloutonne : les couples (champion, rôle) les plus joués d'abord.
export function autoAssignRoles(champIds, data) {
  const cands = [];
  champIds.forEach((id, idx) => {
    const c = data.champions[id] || {};
    for (const [role, games] of Object.entries(c.roles || {})) {
      if (games > 0 && ROLES.includes(role)) cands.push({ id, role, games, idx });
    }
    // postes habituels : poids faible, servent quand le champion n'a pas (ou peu) été joué aux Worlds
    (c.positions || []).forEach((role, k) => cands.push({ id, role, games: 0.5 - k * 0.01, idx }));
  });
  cands.sort((a, b) => b.games - a.games || a.idx - b.idx);
  const out = {}, used = new Set();
  for (const c of cands) if (!out[c.role] && !used.has(c.id)) { out[c.role] = c.id; used.add(c.id); }
  const freeRoles = ROLES.filter(r => !out[r]);
  for (const id of champIds) if (!used.has(id)) { out[freeRoles.shift()] = id; used.add(id); }
  return Object.fromEntries(ROLES.map(r => [r, out[r]]));
}
