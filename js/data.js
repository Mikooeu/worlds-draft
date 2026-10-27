// Charge les stats du tournoi et la liste des champions Data Dragon, puis les relie.
import { champKey } from './champKey.js?v=202610271053';
import { CHAMP_POSITIONS } from './champPositions.js?v=202610271053';
const ROLE_ORDER = ['top', 'jungle', 'mid', 'adc', 'support'];

export function resolveData(raw, ddragon, rawSeason = null) {
  const byKey = new Map();
  for (const c of ddragon) { byKey.set(champKey(c.id), c); byKey.set(champKey(c.name), c); }
  const unknown = [];
  const idOf = k => byKey.get(k)?.id ?? k;
  const champions = {};
  for (const c of ddragon) champions[c.id] = { id: c.id, name: c.name, games: 0, wins: 0, roles: {} };
  for (const [k, c] of Object.entries(raw.champions)) {
    const dd = byKey.get(k);
    if (!dd) unknown.push(c.name);
    const id = dd?.id ?? k;
    champions[id] = { id, name: dd?.name ?? c.name, games: c.games, wins: c.wins, roles: { ...c.roles } };
  }
  for (const c of Object.values(champions)) {
    const set = new Set([...(CHAMP_POSITIONS[c.id] || []), ...Object.keys(c.roles).filter(r => c.roles[r] > 0)]);
    c.positions = ROLE_ORDER.filter(r => set.has(r));
  }
  const players = {};
  for (const [n, p] of Object.entries(raw.players)) {
    players[n] = { ...p, champs: Object.fromEntries(Object.entries(p.champs).map(([k, v]) => [idOf(k), v])) };
  }
  const matchups = {};
  for (const [role, m] of Object.entries(raw.matchups)) {
    matchups[role] = Object.fromEntries(Object.entries(m).map(([key, v]) => {
      const [a, b] = key.split('|'); return [`${idOf(a)}|${idOf(b)}`, v];
    }));
  }
  const mapPairs = (m = {}) => Object.fromEntries(Object.entries(m).map(([key, v]) => {
    const [a, b] = key.split('|'); return [`${idOf(a)}|${idOf(b)}`, v];
  }));
  const duos = mapPairs(raw.duos);
  const pairs = mapPairs(raw.pairs);
  const season = {
    label: rawSeason?.label || null,
    matchups: Object.fromEntries(Object.entries(rawSeason?.matchups || {}).map(([r, m]) => [r, mapPairs(m)])),
    duos: mapPairs(rawSeason?.duos),
    pairs: mapPairs(rawSeason?.pairs),
  };
  const champList = Object.values(champions)
    .map(c => ({ id: c.id, name: c.name, known: byKey.has(champKey(c.id)) }))
    .sort((x, y) => x.name.localeCompare(y.name));
  return { updatedAt: raw.updatedAt, teams: raw.teams, players, champions, matchups, duos, pairs, season, champList, unknown };
}

export async function loadData() {
  const raw = await (await fetch('data/worlds.json', { cache: 'no-cache' })).json();
  let rawSeason = null;
  try { const r = await fetch('data/season.json', { cache: 'no-cache' }); if (r.ok) rawSeason = await r.json(); } catch {}
  let ddragon = [], version = null;
  try {
    version = (await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json())[0];
    const j = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`)).json();
    ddragon = Object.values(j.data).map(c => ({ id: c.id, name: c.name }));
  } catch (e) { console.warn('Data Dragon indisponible, champions limités aux stats du tournoi', e); }
  const data = resolveData(raw, ddragon, rawSeason);
  data.iconUrl = id => (version && data.champList.find(c => c.id === id)?.known)
    ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png` : null;
  return data;
}
