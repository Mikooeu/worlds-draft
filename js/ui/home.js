import { esc, teamBadge } from './common.js?v=202610301535';
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const frDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]}` : iso; };
export function renderHome(data, msg = '') {
  const teams = Object.values(data.teams).filter(t => t.playable !== false);
  return `<div class="home"><div class="home-card">
    <div class="hero"><h1 class="hero-title">Worlds Draft <span class="yr">2026</span></h1>
    <p class="hero-sub">Affronte un ami en draft avec les meilleures équipes du monde.</p></div>
    <div class="logo-wall" aria-label="Les ${teams.length} équipes jouables">${teams.map(t => teamBadge(t)).join('')}</div>
    ${msg ? `<div class="panel">${esc(msg)}</div>` : ''}
    <button class="btn btn-gold" data-act="create">Créer une partie</button>
    <div class="divider">ou rejoindre avec un code</div>
    <form class="join-row" data-form="join"><input name="code" maxlength="4" placeholder="CODE" autocomplete="off" aria-label="Code de la partie"><button class="btn btn-ghost" type="submit">Rejoindre</button></form>
    <p class="muted small">Stats des Worlds à jour au ${esc(frDate(data.updatedAt))}, ${data.totalGames || 0} games analysées.</p>
  </div></div>`;
}
