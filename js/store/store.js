import { firebaseConfig } from '../config.js?v=202610262005';
import { createLocalStore } from './localStore.js?v=202610262005';

function localPlayerId() {
  const k = 'wd.playerId';
  let id = sessionStorage.getItem(k);   // un id par onglet en mode local pour jouer à deux dans le même navigateur
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(k, id); }
  return id;
}

export async function openStore() {
  const local = new URLSearchParams(location.search).get('local') === '1' || !firebaseConfig.apiKey;
  if (local) return Object.assign(createLocalStore({ playerId: localPlayerId() }), { mode: 'local' });
  const { createFirebaseStore } = await import('./firebaseStore.js?v=202610262005');
  return Object.assign(await createFirebaseStore(firebaseConfig), { mode: 'online' });
}
