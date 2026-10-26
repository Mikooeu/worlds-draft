# Mettre Worlds Draft en ligne

Compte 15 à 20 minutes, **sur un ordinateur**. C'est gratuit et il n'y a aucune carte bancaire à donner.

Il y a trois parties :
1. Firebase, qui synchronise la draft entre les deux joueurs.
2. GitHub Pages, qui héberge le site.
3. Un test à deux.

---

## 1. Firebase (environ 8 min)

1. Va sur **https://console.firebase.google.com** et connecte-toi avec ton compte Google.
2. Clique sur **Créer un projet**, nomme-le par exemple `worlds-draft`, puis valide. Tu peux désactiver Google Analytics, il ne sert à rien ici.
3. **Activer la connexion anonyme**
   - Dans le menu de gauche : **Créer → Authentication**, puis **Commencer**.
   - Onglet **Mode de connexion** : choisis **Anonyme**, active-le, puis **Enregistrer**.
4. **Créer la base de données**
   - Menu de gauche : **Créer → Realtime Database**, puis **Créer une base de données**.
   - Emplacement : **Belgique (europe-west1)**.
   - Choisis **Démarrer en mode verrouillé**, puis **Activer**.
   - Onglet **Règles** : efface tout, colle le contenu du fichier `database.rules.json` du projet, puis **Publier**.
5. **Récupérer la configuration**
   - Clique sur la roue dentée en haut à gauche, puis **Paramètres du projet**.
   - En bas, dans **Vos applications**, clique sur l'icône **</>** (Web).
   - Donne un nom (`worlds-draft`), ne coche pas « Hosting », puis **Enregistrer l'application**.
   - Firebase affiche un bloc `const firebaseConfig = { ... }`. Garde-le ouvert.
6. Ouvre le fichier **`js/config.js`** du projet avec un éditeur de texte (Bloc-notes suffit). Recopie les valeurs entre les guillemets `''` :

```js
export const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'worlds-draft-xxxx.firebaseapp.com',
  databaseURL: 'https://worlds-draft-xxxx-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'worlds-draft-xxxx',
  appId: '1:1234:web:abcd',
};
```

> Si `databaseURL` n'apparaît pas dans le bloc, copie l'adresse affichée en haut de la page **Realtime Database**.
> Ces clés ne sont pas secrètes : elles sont faites pour être dans un site public. C'est le fichier de règles qui protège la base.

## 2. GitHub Pages (environ 7 min)

1. Crée un compte sur **https://github.com** si tu n'en as pas.
2. En haut à droite, clique sur **+**, puis **New repository**.
   - Nom : `worlds-draft`
   - Visibilité : **Public**
   - Puis **Create repository**.
3. Sur la page du dépôt, clique sur le lien **uploading an existing file**.
4. Dézippe `worlds-draft.zip` et glisse **tout son contenu** dans la page : les dossiers `css`, `js`, `data` et le fichier `index.html` doivent être à la racine, pas dans un sous-dossier. Ensuite, **Commit changes**.
5. Va dans **Settings → Pages**.
   - Source : **Deploy from a branch**
   - Branche : **main**, dossier **/(root)**, puis **Save**.
6. Patiente 1 à 2 minutes. L'adresse du site s'affiche en haut de la page : `https://TON-PSEUDO.github.io/worlds-draft/`.
7. De retour dans Firebase : **Authentication → Paramètres → Domaines autorisés → Ajouter un domaine**, puis saisis `TON-PSEUDO.github.io`.

## 3. Tester

1. Ouvre le site et clique sur **Créer une partie**, puis **Copier le lien**.
2. Ouvre ce lien dans un autre navigateur ou sur un autre appareil, ou envoie-le à un pote.
3. Chacun choisit une équipe et un side, puis l'hôte lance la draft.

Si l'accueil affiche « Impossible de créer la partie », vérifie dans l'ordre :
- que `js/config.js` est bien rempli, avec les guillemets ;
- que la connexion **Anonyme** est activée ;
- que les règles ont bien été publiées.

## Limites de l'offre gratuite Firebase

L'offre gratuite Spark accepte **100 connexions simultanées**, donc environ **50 parties en même temps**. C'est largement suffisant entre potes. Si le site devient populaire, il faudra passer à l'offre payante à l'usage (Blaze).

## Mettre à jour les stats des Worlds

Les stats sont dans `data/worlds.json`. Pour les mettre à jour après de nouveaux matchs, demande à Claude de les regénérer. Il te suffira ensuite de remplacer ce seul fichier sur GitHub : ouvre le fichier dans le dépôt, puis **⋯ → Delete file**, puis **Add file → Upload files**.

## Jouer sans Firebase (test rapide)

Tant que `js/config.js` est vide, le site fonctionne en **mode local** : ouvre deux onglets du même navigateur avec le lien de la partie. C'est pratique pour tester, mais ça ne marche pas entre deux ordinateurs.
