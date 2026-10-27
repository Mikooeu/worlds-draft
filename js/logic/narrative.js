// Récit accéléré d'une game, généré à partir du résultat calculé.
// Tirage pondéré (avec retournements possibles) mais déterministe : même graine => même récit chez les deux joueurs.
// La game se termine toujours par la victoire de l'équipe désignée par le calcul.

function rngFrom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const nth = (n) => (n === 1 ? 'premier' : `${n}e`);
const ROLE_FR = { top: 'top', jungle: 'jungle', mid: 'mid', adc: 'bot', support: 'bot' };

export function generateNarrative(data, game, result, seed) {
  const rng = rngFrom(String(seed));
  const W = result.winner, L = W === 'blue' ? 'red' : 'blue';
  const teamName = (side) => data.teams[side === 'blue' ? game.blueTeam : game.redTeam]?.name || side;
  const champ = (id) => data.champions?.[id]?.name || id;
  const who = (side, lane) => `${lane[side].player} (${champ(lane[side].champ)})`;
  // probabilité qu'un événement tourne en faveur du vainqueur : proche du % calculé, plus ouverte en début de game
  const pWin = W === 'blue' ? result.pBlue : 1 - result.pBlue;
  const sideFor = (bias) => (rng() < Math.min(0.85, Math.max(0.35, pWin + bias)) ? W : L);
  // lane du premier sang : pondérée par l'écart de winrate, mais pas déterministe
  const laneWeight = (l) => 1 + Math.abs((l.blue.wr ?? 0.5) - (l.red.wr ?? 0.5)) * 6;
  const lanePick = () => {
    const ws = result.lanes.map(laneWeight), tot = ws.reduce((a, b) => a + b, 0);
    let x = rng() * tot;
    for (let i = 0; i < ws.length; i++) { x -= ws[i]; if (x <= 0) return result.lanes[i]; }
    return result.lanes[result.lanes.length - 1];
  };

  const ev = [];
  const add = (sec, side, text) => ev.push({ sec, time: fmt(sec), side, text });
  let t = 150 + Math.floor(rng() * 200);

  // Début de game : premier sang, souvent mais pas toujours du côté de la lane favorisée
  const fbLane = lanePick();
  const laneFav = (fbLane.blue.wr ?? 0.5) >= (fbLane.red.wr ?? 0.5) ? 'blue' : 'red';
  const fbSide = rng() < 0.62 ? laneFav : (laneFav === 'blue' ? 'red' : 'blue');
  const fbOther = fbSide === 'blue' ? 'red' : 'blue';
  add(t, fbSide, `Premier sang ! ${who(fbSide, fbLane)} élimine ${who(fbOther, fbLane)} en ${ROLE_FR[fbLane.role]}.`);

  // Milieu de game : objectifs et escarmouches (le perdant peut mener)
  let gold = fbSide === W ? 1 : -1; // > 0 : le vainqueur mène
  let dragons = { blue: 0, red: 0 };
  const mid = [
    () => { const s = sideFor(-0.12); dragons[s]++; return [s, `${teamName(s)} sécurise son ${nth(dragons[s])} dragon.`]; },
    () => { const s = sideFor(-0.1); return [s, `${teamName(s)} prend les larves du Néant et met la pression en top.`]; },
    () => { const s = sideFor(-0.08), l = lanePick(), o = s === 'blue' ? 'red' : 'blue'; return [s, `Gank réussi : ${who(s, l)} punit ${who(o, l)}.`]; },
    () => { const s = sideFor(-0.05); return [s, `${teamName(s)} détruit la première tour ${pick(rng, ['du mid', 'du bot', 'du top'])}.`]; },
    () => { const s = sideFor(-0.03); return [s, `Escarmouche autour du Héraut : avantage ${teamName(s)} (${2 + Math.floor(rng() * 2)} kills).`]; },
    () => { const s = sideFor(0); dragons[s]++; return [s, `${teamName(s)} remporte le combat au dragon (${nth(dragons[s])} dragon).`]; },
  ];
  const n = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    t += 120 + Math.floor(rng() * 160);
    const [s, text] = pick(rng, mid)();
    gold += s === W ? 1 : -1;
    add(t, s, text);
  }

  // Retournement : si le perdant mène, le vainqueur revient ; sinon le perdant tente un coup d'éclat
  t += 100 + Math.floor(rng() * 120);
  if (gold < 0) {
    add(t, W, `Retournement ! ${teamName(W)} gagne un teamfight décisif en défense et revient dans la partie.`);
  } else if (rng() < 0.55) {
    add(t, L, `${teamName(L)} attrape un joueur isolé et vole un objectif : la game n'est pas finie !`);
  }

  // Fin de game : Nashor, combat final, Nexus pour le vainqueur
  t += 150 + Math.floor(rng() * 150);
  const baronSide = rng() < 0.8 ? W : L;
  add(t, baronSide, baronSide === W
    ? `${teamName(W)} tue le Baron Nashor et pousse avec le buff.`
    : `${teamName(L)} prend le Baron Nashor… mais ${teamName(W)} défend bien la base.`);
  t += 90 + Math.floor(rng() * 120);
  const carry = pick(rng, result.lanes);
  add(t, W, `Teamfight final : ${who(W, carry)} fait la différence, ${teamName(W)} fait un ace.`);
  t += 30 + Math.floor(rng() * 40);
  add(t, W, `${teamName(W)} détruit le Nexus et remporte la game !`);
  return ev;
}
