import { esc } from './common.js';
export function renderHome(data, msg = '') {
  return `<div class="home"><div class="home-card">
    <div><h1>Worlds <span>Draft</span> 2026</h1>
    <p class="muted">Affronte un ami en draft avec les équipes des Worlds. Le % de victoire est calculé à partir des stats réelles du tournoi.</p></div>
    ${msg ? `<div class="panel">${esc(msg)}</div>` : ''}
    <button class="btn btn-gold" data-act="create">Créer une partie</button>
    <div class="divider">ou rejoindre avec un code</div>
    <form class="join-row" data-form="join"><input name="code" maxlength="4" placeholder="CODE" autocomplete="off" aria-label="Code de la partie"><button class="btn btn-ghost" type="submit">Rejoindre</button></form>
    <p class="muted small">Stats des Worlds à jour au ${esc(data.updatedAt)} · ${Object.keys(data.teams).length} équipes</p>
  </div></div>`;
}
