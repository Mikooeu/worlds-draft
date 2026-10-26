export function fearlessLocked(previousGames) {
  const set = new Set();
  for (const g of previousGames) for (const side of ['blue', 'red']) for (const c of (g.picks?.[side] || [])) set.add(c);
  return [...set];
}
export function availableChampions(allIds, game, locked = []) {
  const taken = new Set(locked);
  for (const side of ['blue', 'red']) {
    for (const c of (game.bans?.[side] || [])) taken.add(c);
    for (const c of (game.picks?.[side] || [])) taken.add(c);
  }
  return allIds.filter(id => !taken.has(id));
}
