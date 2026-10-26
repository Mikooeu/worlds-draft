# Worlds Draft 2026

Draft League of Legends à deux joueurs, en temps réel, avec les équipes des Worlds 2026. Le % de victoire est calculé à partir des stats du tournoi (winrate joueur/champion, matchups de lane, niveau d'équipe).

- Mise en ligne : voir `docs/MISE-EN-LIGNE.md`
- Spécification : `docs/superpowers/specs/2026-10-26-worlds-draft-design.md`
- Données brutes : `data/raw/` → `node scripts/build-data.mjs AAAA-MM-JJ` régénère `data/worlds.json`
- Tests : `npm test` (logique) et `node e2e/draft.spec.mjs http://localhost:8080/` (bout en bout, Playwright)

Stats : gol.gg, Worlds 2026 Main Event. Icônes : Riot Data Dragon. Projet de fan non affilié à Riot Games.
- Avant chaque mise en ligne : `node scripts/bump-version.mjs` (force les navigateurs à recharger les fichiers)
