// Clé de comparaison des noms de champions (sources de stats ≠ Data Dragon).
const ALIASES = { wukong: 'monkeyking', renataglasc: 'renata', nunuwillump: 'nunu' };
export function champKey(name) {
  const k = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  return ALIASES[k] || k;
}
