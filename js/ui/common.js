export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ROLE_FR = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'ADC', support: 'Support' };

const TEAM_COLORS = {
  GEN: '#aa8a00', HLE: '#f37321', T1: '#e2012d', DK: '#1d3c6e', BLG: '#00a3e0', TES: '#e60012', IG: '#2c2c2c', AL: '#7a2ea0',
  G2: '#333333', MKOI: '#4c2a85', KC: '#0d4fd0', TL: '#0a2240', LYON: '#003a70', LOS: '#d4a017', CFO: '#0b8a5d', TSW: '#5a6470',
};
export function teamBadge(team, size = '') {
  const c = TEAM_COLORS[team.tag] || '#444';
  const fallback = `<span class=\\'badge ${size}\\' style=\\'background:${c}\\'>${esc(team.tag)}</span>`;
  return `<span class="logo ${size}" title="${esc(team.name)}"><img src="img/teams/${esc(team.tag)}.webp" alt="${esc(team.tag)}" onerror="this.parentElement.outerHTML='${fallback}'"></span>`;
}
export function champIcon(data, id, extra = '') {
  if (!id) return `<div class="champ-icon ${extra}"></div>`;
  const url = data.iconUrl(id), name = data.champions[id]?.name || id;
  return url
    ? `<img class="champ-icon ${extra}" src="${url}" alt="${esc(name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'champ-icon',textContent:this.alt}))">`
    : `<div class="champ-icon ${extra}">${esc(name)}</div>`;
}
export const champName = (data, id) => data.champions[id]?.name || id;
export const pct = (p) => `${Math.round(p * 100)} %`;

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
