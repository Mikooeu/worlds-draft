// Réducteur pur de la partie. applyAction renvoie LA MÊME référence si l'action est invalide.
import { DRAFT_ORDER } from './draftOrder.js?v=202610291745';
import { availableChampions, fearlessLocked } from './availability.js?v=202610291745';
import { seriesWinner, WINS_NEEDED } from './series.js?v=202610291745';
import { computeResult, ROLES } from './winrate.js?v=202610291745';
import { autoAssignRoles } from './roles.js?v=202610291745';

export const ACTION_MS = 30000;
export const REVEAL_MS = 5000;
const SIDES = ['blue', 'red'];

export function createGame(code, hostId, now) {
  return {
    code, phase: 'lobby', format: 'bo1', hostId, guestId: null,
    seats: { [hostId]: { team: null, side: null } },
    games: [], wins: {}, step: 0, deadline: null, sideChooser: null, createdAt: now, series: 0,
  };
}

// Firebase supprime les tableaux/objets vides et les null : on les remet.
export function normalize(raw) {
  if (!raw) return raw;
  const s = { ...raw };
  s.guestId = s.guestId ?? null;
  s.seats = { ...(s.seats || {}) };
  for (const k of [s.hostId, s.guestId]) if (k && !s.seats[k]) s.seats[k] = {};
  for (const k of Object.keys(s.seats)) s.seats[k] = { team: null, side: null, ...s.seats[k] };
  s.series = s.series ?? 0;
  s.presel = s.presel ?? null;
  s.wins = { ...(s.wins || {}) };
  s.step = s.step ?? 0; s.deadline = s.deadline ?? null; s.sideChooser = s.sideChooser ?? null;
  s.format = s.format || 'bo1';
  s.games = (Array.isArray(s.games) ? s.games : Object.values(s.games || {})).map(g => ({
    ...g,
    bans: { blue: [...(g.bans?.blue || [])], red: [...(g.bans?.red || [])] },
    picks: { blue: [...(g.picks?.blue || [])], red: [...(g.picks?.red || [])] },
    roles: { blue: g.roles?.blue || null, red: g.roles?.red || null },
    result: g.result || null,
  }));
  return s;
}

const other = (s, pid) => (pid === s.hostId ? s.guestId : s.hostId);
const isPlayer = (s, pid) => pid === s.hostId || (pid && pid === s.guestId);
const currentGame = (s) => s.games[s.games.length - 1];
const playerOnSide = (s, side) => Object.keys(s.seats).find(k => s.seats[k].side === side);

function beginGame(s, now) {
  const blue = playerOnSide(s, 'blue'), red = playerOnSide(s, 'red');
  s.games = [...s.games, {
    blueTeam: s.seats[blue].team, redTeam: s.seats[red].team,
    bans: { blue: [], red: [] }, picks: { blue: [], red: [] },
    roles: { blue: null, red: null }, result: null,
  }];
  s.phase = 'draft'; s.step = 0; s.deadline = now + ACTION_MS; s.sideChooser = null; s.presel = null;
  return s;
}

function doDraft(s, champ, ctx) {
  const g = currentGame(s);
  const avail = availableChampions(ctx.champIds, g, fearlessLocked(s.games.slice(0, -1)));
  if (!avail.includes(champ)) return null;
  const { side, type } = DRAFT_ORDER[s.step];
  const key = type === 'ban' ? 'bans' : 'picks';
  const ng = { ...g, [key]: { ...g[key], [side]: [...g[key][side], champ] } };
  s.games = [...s.games.slice(0, -1), ng];
  s.step += 1; s.presel = null;
  s.deadline = ctx.now + ACTION_MS;
  if (s.step === DRAFT_ORDER.length) {
    // 5 s pour voir les deux compositions avant l'attribution des rôles
    s.phase = 'roles'; s.revealUntil = ctx.now + REVEAL_MS; s.deadline = ctx.now + REVEAL_MS + ACTION_MS;
  }
  return s;
}

function validRoles(roles, picks) {
  if (!roles) return false;
  const vals = ROLES.map(r => roles[r]);
  return vals.every(Boolean) && new Set(vals).size === 5 && vals.every(v => picks.includes(v));
}

function finishGame(s, ctx) {
  const g = currentGame(s);
  const roles = {
    blue: g.roles.blue || autoAssignRoles(g.picks.blue, ctx.data),
    red: g.roles.red || autoAssignRoles(g.picks.red, ctx.data),
  };
  const r = computeResult(ctx.data, { team: g.blueTeam, roles: roles.blue }, { team: g.redTeam, roles: roles.red });
  const winnerTeam = r.winner === 'blue' ? g.blueTeam : g.redTeam;
  const result = { pBlue: r.pBlue, displayBlue: r.displayBlue, displayRed: r.displayRed, winner: r.winner, winnerTeam, lanes: r.lanes, synergy: r.synergy };
  s.games = [...s.games.slice(0, -1), { ...g, roles, result }];
  s.wins = { ...s.wins, [winnerTeam]: (s.wins[winnerTeam] || 0) + 1 };
  s.phase = seriesWinner(s.format, s.wins) ? 'seriesEnd' : 'result';
  s.deadline = null;
  return s;
}

export function applyAction(state, action, ctx) {
  const s0 = normalize(state);
  if (!s0) return state;
  const s = { ...s0, seats: { ...s0.seats } };
  const pid = action.playerId;
  const out = reduce(s, action, pid, ctx);
  return out || state;
}

function reduce(s, a, pid, ctx) {
  switch (a.type) {
    case 'join': {
      if (isPlayer(s, pid) || s.guestId || s.phase !== 'lobby' || !pid) return null;
      s.guestId = pid; s.seats[pid] = { team: null, side: null };
      return s;
    }
    case 'setTeam': {
      if (s.phase !== 'lobby' || !isPlayer(s, pid) || !ctx.data.teams[a.team] || ctx.data.teams[a.team].playable === false) return null;
      const o = other(s, pid);
      if (o && s.seats[o]?.team === a.team) return null;
      // re-cliquer sur sa propre équipe la libère
      s.seats[pid] = { ...s.seats[pid], team: s.seats[pid].team === a.team ? null : a.team };
      return s;
    }
    case 'setSide': {
      if (s.phase !== 'lobby' || !isPlayer(s, pid) || !SIDES.includes(a.side)) return null;
      const o = other(s, pid);
      if (o && s.seats[o]?.side === a.side) return null;
      // re-cliquer sur son propre side le libère
      s.seats[pid] = { ...s.seats[pid], side: s.seats[pid].side === a.side ? null : a.side };
      return s;
    }
    case 'randomSides': {
      if (s.phase !== 'lobby' || !isPlayer(s, pid) || !s.guestId) return null;
      const hostBlue = ctx.rng() < 0.5;
      s.seats[s.hostId] = { ...s.seats[s.hostId], side: hostBlue ? 'blue' : 'red' };
      s.seats[s.guestId] = { ...s.seats[s.guestId], side: hostBlue ? 'red' : 'blue' };
      return s;
    }
    case 'setFormat': {
      if (s.phase !== 'lobby' || pid !== s.hostId || !(a.format in WINS_NEEDED) || s.format === a.format) return null;
      s.format = a.format; return s;
    }
    case 'start': {
      if (s.phase !== 'lobby' || pid !== s.hostId || !s.guestId) return null;
      const ok = [s.hostId, s.guestId].every(p => s.seats[p]?.team && s.seats[p]?.side);
      if (!ok) return null;
      s.wins = { [s.seats[s.hostId].team]: 0, [s.seats[s.guestId].team]: 0 };
      return beginGame(s, ctx.now);
    }
    case 'draft': {
      if (s.phase !== 'draft' || a.step !== s.step) return null;
      if (pid !== playerOnSide(s, DRAFT_ORDER[s.step].side)) return null;
      return doDraft(s, a.champ, ctx);
    }
    case 'preselect': {
      if (s.phase !== 'draft' || a.step !== s.step) return null;
      if (pid !== playerOnSide(s, DRAFT_ORDER[s.step].side)) return null;
      const g = currentGame(s);
      if (!availableChampions(ctx.champIds, g, fearlessLocked(s.games.slice(0, -1))).includes(a.champ)) return null;
      if (s.presel?.step === a.step && s.presel?.champ === a.champ) return null;
      s.presel = { step: a.step, champ: a.champ };
      return s;
    }
    case 'timeout': {
      if (!isPlayer(s, pid) || a.step !== s.step || s.deadline == null || ctx.now < s.deadline) return null;
      if (s.phase === 'draft') {
        const g = currentGame(s);
        const avail = availableChampions(ctx.champIds, g, fearlessLocked(s.games.slice(0, -1)));
        if (!avail.length) return null;
        const pre = s.presel?.step === s.step && avail.includes(s.presel.champ) ? s.presel.champ : null;
        return doDraft(s, pre || avail[Math.floor(ctx.rng() * avail.length)], ctx);
      }
      if (s.phase === 'roles') return finishGame(s, ctx);
      return null;
    }
    case 'setRoles': {
      if (s.phase !== 'roles' || !isPlayer(s, pid)) return null;
      const side = s.seats[pid].side, g = currentGame(s);
      if (g.roles[side] || !validRoles(a.roles, g.picks[side])) return null;
      const roles = Object.fromEntries(ROLES.map(r => [r, a.roles[r]]));
      s.games = [...s.games.slice(0, -1), { ...g, roles: { ...g.roles, [side]: roles } }];
      if (s.games[s.games.length - 1].roles[SIDES.find(x => x !== side)]) return finishGame(s, ctx);
      return s;
    }
    case 'nextGame': {
      if (s.phase !== 'result' || !isPlayer(s, pid)) return null;
      const g = currentGame(s);
      const loserTeam = g.result.winnerTeam === g.blueTeam ? g.redTeam : g.blueTeam;
      s.sideChooser = Object.keys(s.seats).find(k => s.seats[k].team === loserTeam);
      s.phase = 'sideChoice';
      return s;
    }
    case 'chooseSide': {
      if (s.phase !== 'sideChoice' || pid !== s.sideChooser || !SIDES.includes(a.side)) return null;
      const o = other(s, pid);
      s.seats[pid] = { ...s.seats[pid], side: a.side };
      s.seats[o] = { ...s.seats[o], side: a.side === 'blue' ? 'red' : 'blue' };
      return beginGame(s, ctx.now);
    }
    case 'reset': {
      if (s.phase === 'lobby' || pid !== s.hostId) return null;
      s.phase = 'lobby'; s.games = []; s.wins = {}; s.step = 0; s.deadline = null; s.sideChooser = null;
      s.series = (s.series || 0) + 1;
      return s;
    }
    case 'rematch': {
      if (s.phase !== 'seriesEnd' || pid !== s.hostId) return null;
      s.phase = 'lobby'; s.games = []; s.wins = {}; s.step = 0; s.deadline = null; s.sideChooser = null;
      s.series = (s.series || 0) + 1;
      return s;
    }
    default: return null;
  }
}
