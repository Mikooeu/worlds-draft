// Ordre de draft défini par le créateur du jeu (20 actions).
const seq = 'Rb Bb Rb Bb Rb Bb Bp Rp Rp Bp Bp Rp Bb Rb Bb Rb Rp Bp Bp Rp'.split(' ');
export const DRAFT_ORDER = Object.freeze(seq.map(s => Object.freeze({
  side: s[0] === 'B' ? 'blue' : 'red',
  type: s[1] === 'b' ? 'ban' : 'pick',
})));
