// Transport Firebase Realtime Database : chaque action est appliquée dans une transaction.
import { applyAction } from '../logic/game.js?v=202610301346';

const V = '10.12.0';
const base = `https://www.gstatic.com/firebasejs/${V}`;

export async function createFirebaseStore(config) {
  const [{ initializeApp }, auth, db] = await Promise.all([
    import(`${base}/firebase-app.js`), import(`${base}/firebase-auth.js`), import(`${base}/firebase-database.js`),
  ]);
  const app = initializeApp(config);
  const a = auth.getAuth(app);
  const cred = a.currentUser ? { user: a.currentUser } : await auth.signInAnonymously(a);
  const database = db.getDatabase(app);
  let offset = 0;
  db.onValue(db.ref(database, '.info/serverTimeOffset'), s => { offset = s.val() || 0; });
  const gameRef = code => db.ref(database, 'games/' + code);

  return {
    playerId: cred.user.uid,
    now: () => Date.now() + offset,
    async create(state) { await db.set(gameRef(state.code), state); },
    async exists(code) { return (await db.get(gameRef(code))).exists(); },
    subscribe(code, cb) { return db.onValue(gameRef(code), snap => cb(snap.val())); },
    async dispatch(code, action, ctx) {
      const res = await db.runTransaction(gameRef(code), cur => {
        if (cur == null) return cur;           // cache vide : Firebase relance avec la vraie valeur
        const next = applyAction(cur, action, ctx);
        return next === cur ? undefined : next; // undefined = annuler
      }, { applyLocally: true });
      return res.committed && res.snapshot.exists();
    },
    close() {},
  };
}
