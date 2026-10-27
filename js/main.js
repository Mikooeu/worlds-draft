import { loadData } from './data.js?v=202610271053';
import { openStore } from './store/store.js?v=202610271053';
import { createGame, normalize } from './logic/game.js?v=202610271053';
import { autoAssignRoles } from './logic/roles.js?v=202610271053';
import { ROLES } from './logic/winrate.js?v=202610271053';
import { toast, resetButton } from './ui/common.js?v=202610271053';
import { createTimeoutGate } from './timeouts.js?v=202610271053';
import { renderHome } from './ui/home.js?v=202610271053';
import { renderLobby } from './ui/lobby.js?v=202610271053';
import { renderDraft, applyDraftFilters, showSelection } from './ui/draft.js?v=202610271053';
import { renderRoles } from './ui/roles.js?v=202610271053';
import { renderResult, renderSideChoice } from './ui/result.js?v=202610271053';

const app = document.getElementById('app');
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let data, store, state = null, code = null, unsub = null, joinTried = false;
const ui = { sel: null, search: '', role: 'all', roles: null, key: '' };
const timeouts = createTimeoutGate();

const me = () => store.playerId;
const ctx = () => ({ data, champIds: data.champList.map(c => c.id), now: store.now(), rng: Math.random });
const dispatch = (action) => store.dispatch(code, { ...action, playerId: me() }, ctx())
  .catch((err) => { console.error(err); toast('Connexion perdue, réessaie'); return false; });

function gameUrl(c) {
  const u = new URL(location.href);
  u.search = ''; u.searchParams.set('game', c);
  if (store.mode === 'local') u.searchParams.set('local', '1');
  return u.toString();
}

function render() {
  if (!code) { app.innerHTML = renderHome(data); return; }
  if (state === undefined) { app.innerHTML = '<div class="loading">Connexion à la partie…</div>'; return; }
  if (state === null) { app.innerHTML = renderHome(data, `La partie ${code} n'existe pas (ou plus).`); return; }
  if (!state.seats[me()]) {
    app.innerHTML = renderHome(data, state.guestId ? 'Partie complète : deux joueurs y sont déjà.' : 'Connexion…');
    return;
  }
  // réinitialise l'état local de l'UI à chaque nouvelle étape
  const key = `${state.phase}:${state.games.length}:${state.step}`;
  if (key !== ui.key) {
    ui.key = key; ui.sel = null;
    if (state.phase === 'roles') {
      const g = state.games[state.games.length - 1];
      ui.roles = autoAssignRoles(g.picks[state.seats[me()].side], data);
    }
  }
  const focused = document.activeElement?.dataset?.input === 'search';
  const caret = focused ? document.activeElement.selectionStart : null;
  const scroll = app.querySelector('.grid')?.scrollTop;
  switch (state.phase) {
    case 'lobby': app.innerHTML = renderLobby(state, data, me()); break;
    case 'draft': app.innerHTML = renderDraft(state, data, me(), ui); break;
    case 'roles': app.innerHTML = renderRoles(state, data, me(), ui); break;
    case 'result': case 'seriesEnd': app.innerHTML = renderResult(state, data, me()); break;
    case 'sideChoice': app.innerHTML = renderSideChoice(state, data, me()); break;
  }
  const rb = resetButton(state, me());
  if (rb) (app.querySelector('.dcenter') || app).insertAdjacentHTML('beforeend', rb);
  if (state.phase === 'draft') applyDraftFilters(app, ui);
  if (focused) { const i = app.querySelector('[data-input="search"]'); i?.focus(); i?.setSelectionRange(caret, caret); }
  if (scroll != null) { const gr = app.querySelector('.grid'); if (gr) gr.scrollTop = scroll; }
  tick();
}

function openGame(c) {
  code = c; state = undefined; joinTried = false;
  history.replaceState(null, '', gameUrl(c));
  unsub?.();
  unsub = store.subscribe(c, (raw) => {
    state = raw ? normalize(raw) : null;
    if (state && !state.seats[me()] && !state.guestId && state.phase === 'lobby' && !joinTried) {
      joinTried = true; dispatch({ type: 'join' });
    }
    render();
  });
  render();
}

async function createNew() {
  let c;
  for (let i = 0; i < 10; i++) {
    c = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
    if (!(await store.exists(c))) break;
  }
  await store.create(createGame(c, me(), store.now()));
  openGame(c);
}

// Chrono + envoi du timeout quand il expire (les deux clients l'envoient, le réducteur n'en garde qu'un)
function tick() {
  const el = app.querySelector('[data-timer]');
  if (!state || state.deadline == null) { if (el) el.textContent = ''; return; }
  const left = Math.max(0, Math.ceil((state.deadline - store.now()) / 1000));
  if (el) { el.textContent = left; el.classList.toggle('low', left <= 10); }
  if (store.now() > state.deadline + 300 && (state.phase === 'draft' || state.phase === 'roles')) {
    const k = timeouts.take(state);
    if (k) dispatch({ type: 'timeout', step: state.step }).then(ok => { if (!ok) setTimeout(() => timeouts.release(k), 1000); });
  }
}
setInterval(tick, 250);

app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'create': b.disabled = true; createNew().catch(err => { console.error(err); toast('Impossible de créer la partie'); b.disabled = false; }); break;
    case 'copy':
      try { await navigator.clipboard.writeText(gameUrl(code)); toast('Lien copié !'); }
      catch { prompt('Copie ce lien :', gameUrl(code)); }
      break;
    case 'team': dispatch({ type: 'setTeam', team: v }); break;
    case 'side': dispatch({ type: 'setSide', side: v }); break;
    case 'randomSides': dispatch({ type: 'randomSides' }); break;
    case 'format': dispatch({ type: 'setFormat', format: v }); break;
    case 'start': dispatch({ type: 'start' }); break;
    case 'role': ui.role = v; applyDraftFilters(app, ui); break;
    case 'sel': ui.sel = v; showSelection(app, data, ui); break;
    case 'lock': if (ui.sel) dispatch({ type: 'draft', step: state.step, champ: ui.sel }).then(ok => { if (!ok) toast('Action refusée'); }); break;
    case 'setRoles': dispatch({ type: 'setRoles', roles: ui.roles }); break;
    case 'nextGame': dispatch({ type: 'nextGame' }); break;
    case 'chooseSide': dispatch({ type: 'chooseSide', side: v }); break;
    case 'rematch': dispatch({ type: 'rematch' }); break;
    case 'reset':
      if (b.dataset.confirm) { dispatch({ type: 'reset' }); break; }
      b.dataset.confirm = '1'; b.textContent = 'Confirmer ?';
      setTimeout(() => { if (b.isConnected) { delete b.dataset.confirm; b.textContent = 'Reset'; } }, 3000);
      break;
    case 'home': unsub?.(); unsub = null; code = null; state = null; history.replaceState(null, '', location.pathname + (store.mode === 'local' ? '?local=1' : '')); render(); break;
  }
});
app.addEventListener('dblclick', (e) => {
  const b = e.target.closest('[data-act="sel"]');
  if (b && !b.disabled && state?.phase === 'draft') dispatch({ type: 'draft', step: state.step, champ: b.dataset.v });
});
// Retour arrière dans la recherche : efface tout le mot d'un coup
app.addEventListener('keydown', (e) => {
  if (e.target.dataset?.input !== 'search' || e.key !== 'Backspace' || !e.target.value) return;
  e.preventDefault();
  e.target.value = ''; ui.search = ''; applyDraftFilters(app, ui);
});
app.addEventListener('input', (e) => {
  if (e.target.dataset.input === 'search') { ui.search = e.target.value; applyDraftFilters(app, ui); }
});
app.addEventListener('change', (e) => {
  if (e.target.dataset.input !== 'role') return;
  const role = e.target.dataset.role, champ = e.target.value;
  const prevRole = ROLES.find(r => ui.roles[r] === champ);
  if (prevRole && prevRole !== role) ui.roles[prevRole] = ui.roles[role]; // échange
  ui.roles[role] = champ;
  render();
});
app.addEventListener('submit', (e) => {
  if (e.target.dataset.form !== 'join') return;
  e.preventDefault();
  const c = new FormData(e.target).get('code').toString().trim().toUpperCase();
  if (/^[A-Z2-9]{4}$/.test(c)) openGame(c); else toast('Code invalide');
});

(async function init() {
  try {
    [data, store] = await Promise.all([loadData(), openStore()]);
  } catch (err) {
    console.error(err);
    app.innerHTML = '<div class="center-msg">Impossible de charger le jeu. Vérifie ta connexion puis recharge la page.</div>';
    return;
  }
  const c = new URLSearchParams(location.search).get('game');
  if (c && /^[A-Z2-9]{4}$/i.test(c)) openGame(c.toUpperCase()); else render();
})();
