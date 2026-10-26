// Mini jeu de données au format de data/worlds.json (résolu, clés = id Data Dragon).
const roster = (p) => ({ top: p[0], jungle: p[1], mid: p[2], adc: p[3], support: p[4] });
export const miniData = {
  updatedAt: '2026-10-25',
  teams: {
    AAA: { tag: 'AAA', name: 'Team A', region: 'X', wins: 3, losses: 1, players: roster(['a1','a2','a3','a4','a5']) },
    BBB: { tag: 'BBB', name: 'Team B', region: 'Y', wins: 1, losses: 3, players: roster(['b1','b2','b3','b4','b5']) },
    CCC: { tag: 'CCC', name: 'Team C', region: 'Y', wins: 1, losses: 3, players: roster(['c1','c2','c3','c4','c5']) },
  },
  players: {
    a1: { team: 'AAA', role: 'top', champs: { Gnar: { games: 2, wins: 2 } } },
    a2: { team: 'AAA', role: 'jungle', champs: {} }, a3: { team: 'AAA', role: 'mid', champs: {} },
    a4: { team: 'AAA', role: 'adc', champs: {} }, a5: { team: 'AAA', role: 'support', champs: {} },
    b1: { team: 'BBB', role: 'top', champs: {} }, b2: { team: 'BBB', role: 'jungle', champs: {} },
    b3: { team: 'BBB', role: 'mid', champs: {} }, b4: { team: 'BBB', role: 'adc', champs: {} },
    b5: { team: 'BBB', role: 'support', champs: {} },
    c1: { team: 'CCC', role: 'top', champs: {} }, c2: { team: 'CCC', role: 'jungle', champs: {} },
    c3: { team: 'CCC', role: 'mid', champs: {} }, c4: { team: 'CCC', role: 'adc', champs: {} },
    c5: { team: 'CCC', role: 'support', champs: {} },
  },
  champions: {
    Gnar: { id: 'Gnar', name: 'Gnar', games: 2, wins: 2, roles: { top: 2 } },
    Ahri: { id: 'Ahri', name: 'Ahri', games: 10, wins: 7, roles: { mid: 10 } },
    Vi: { id: 'Vi', name: 'Vi', games: 4, wins: 1, roles: { jungle: 4 } },
    Jhin: { id: 'Jhin', name: 'Jhin', games: 6, wins: 3, roles: { adc: 6 } },
    Rell: { id: 'Rell', name: 'Rell', games: 3, wins: 2, roles: { support: 3 } },
    Galio: { id: 'Galio', name: 'Galio', games: 4, wins: 2, roles: { mid: 3, support: 1 } },
    Teemo: { id: 'Teemo', name: 'Teemo', games: 0, wins: 0, roles: {} },
    Sion: { id: 'Sion', name: 'Sion', games: 0, wins: 0, roles: {} },
    Ezreal: { id: 'Ezreal', name: 'Ezreal', games: 0, wins: 0, roles: {} },
    Lulu: { id: 'Lulu', name: 'Lulu', games: 0, wins: 0, roles: {} },
  },
  matchups: { mid: { 'Ahri|Galio': { games: 1, wins: 1 } } },
};
