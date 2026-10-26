export const WINS_NEEDED = Object.freeze({ bo1: 1, bo3: 2, bo5: 3 });
export function seriesWinner(format, wins) {
  const need = WINS_NEEDED[format];
  for (const [tag, w] of Object.entries(wins)) if (w >= need) return tag;
  return null;
}
