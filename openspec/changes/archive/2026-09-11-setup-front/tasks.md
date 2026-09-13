## 1. Harnais de tests (avant toute ligne de socle)

- [x] 1.1 Installer Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` et `jsdom` dans le workspace `client`
- [x] 1.2 Configurer Vitest dans `vite.config.ts` (environnement `jsdom`, fichier de setup) et ajouter `"test": "vitest run"` aux scripts de `client`
- [x] 1.3 Écrire un test de fumée qui rend un composant trivial, le voir passer, et vérifier que `npm test` à la racine le lance
- [x] 1.4 Vérifier que `npm run verify` reste vert avec les nouveaux fichiers (lint, types, knip)

## 2. Nettoyage du template et tokens visuels

- [x] 2.1 Supprimer `app/welcome/`, `app/routes/home.tsx`, le `links` Google Fonts et le mode sombre de `app/app.css`
- [x] 2.2 Installer `@fontsource` pour Cormorant Garamond, Maitree et Ruthie, et les importer dans `app.css` avec leurs piles de repli
- [x] 2.3 Traduire `theme.css` du handoff en bloc `@theme` : couleurs, `--font-titre`/`--font-texte`/`--font-signature`, échelle 11→74 px, `--spacing: 4px`, rayons 4/8/12/16/999, ombres 1→4
- [x] 2.4 Poser `prefers-reduced-motion` et les transitions de base (`background`/`color`/`border-color` .18s)
- [x] 2.5 Passer `lang="fr"` sur `<html>` dans `root.tsx`
- [x] 2.6 Vérifier à l'œil contre `maquettes/tokens.html` qu'aucune valeur n'a dérivé

## 3. Couche d'accès API — le cœur du change

- [x] 3.1 **Proposer la liste des tests de `appeler-api`** (forme d'erreur, `details[]`, `credentials`, corps non-JSON, refresh rejoué une seule fois, pas de double rejeu sur 401, promesse partagée entre appels parallèles, `/auth/connexion` et `/auth/rafraichissement` exclus du mécanisme) et attendre validation
- [x] 3.2 Écrire ces tests, les voir échouer
- [x] 3.3 Écrire `acces-api/erreur-api.ts` : la classe d'erreur portant `statusCode`, `message`, `details`
- [x] 3.4 Écrire `acces-api/appeler-api.ts` : URL de base depuis l'environnement (préfixe `/api`), `credentials: 'include'`, parsing, levée d'`ErreurApi`
- [x] 3.5 Ajouter le refresh transparent : `POST /auth/rafraichissement` sur 401, rejeu unique, promesse de module partagée remise à `null` en fin d'appel
- [x] 3.6 Voir les tests passer
- [x] 3.7 Déclarer `VITE_URL_API` (et son défaut de développement) sans jamais y mettre de secret

## 4. Modules par ressource et session

- [x] 4.1 Écrire `acces-api/session.ts` : `GET /utilisateurs/moi`, `401` traduit en « visiteur » et non en erreur
- [x] 4.2 ~~Écrire les cinq modules de ressources~~ → **reporté sciemment** : aucun écran de ce change ne les appelle, et knip les signale comme fichiers morts. Chaque module naît avec son premier écran ; `recettes.ts` arrive donc en 9.1
- [x] 4.3 ~~Distinguer enveloppe et tableau nu dans les types de retour~~ → la distinction est écrite dans `design/ecrans.md` et dans la spec ; elle se pose au moment d'écrire chaque module, pas d'avance
- [x] 4.4 Écrire l'utilitaire de lecture des critères de liste depuis l'URL (recherche, filtres, tri, page) et d'écriture vers `URLSearchParams`, avec remise à `page=1` sur changement de critère
- [x] 4.5 Tester cet utilitaire : lecture d'une URL complète, valeurs absentes, page hors bornes, remise à 1
- [x] 4.6 Corriger `@recipe/types` : ses interfaces d'entités décrivaient un modèle que l'API n'a jamais implémenté — rien ne les importait, donc rien ne l'avait révélé
- [x] 4.7 Dette consignée dans `docs/avancement.md` : rien ne garde `@recipe/types` aligné sur l'API. Le garde-fou est un e2e côté API, hors du périmètre de ce change

## 5. Passage en SPA et ossature de routes

- [x] 5.1 Passer `react-router.config.ts` à `ssr: false`
- [x] 5.2 Charger la session dans le `clientLoader` de `root.tsx` et l'exposer aux enfants
- [x] 5.3 Écrire `app/routes.ts` : les 14 écrans de `design/ecrans.md`, en français, groupés par coquille, chaque fichier de route créé en page minimale
- [x] 5.4 Vérifier que chaque route déclarée correspond à un écran conçu, et réciproquement

## 6. Composants partagés

- [x] 6.1 **Proposer la liste des tests des composants porteurs de règle** (`Etoiles` avec `noteMoyenne: null`, `Pagination` qui écrit `?page=`, `ModaleConfirmation` et son piège à focus, `Bandeau` qui rend `details[]`) et attendre validation
- [x] 6.2 Écrire ces tests, les voir échouer
- [x] 6.3 `Bouton` — 4 variantes, 2 tailles, `chargement` avec `aria-busy` et clic bloqué, 44 px
- [x] 6.4 `Champ`, `Selecteur`, `Case` — libellé toujours visible, `aria-invalid` et message d'erreur, « (optionnel) » dans le libellé
- [x] 6.5 `Bandeau` — `role="alert"` ou `role="status"` selon le ton, rend `details[]`, focalisable après échec de soumission
- [x] 6.6 `Etoiles` — `null` donne « Pas encore notée », jamais cinq étoiles vides ; `aria-label` écrit la note et le nombre d'avis
- [x] 6.7 `Pagination` — lit l'enveloppe, écrit `?page=`, ellipse au-delà de 5 pages, flèches désactivées sans saut de hauteur
- [x] 6.8 `ModaleConfirmation` — bouton qui nomme l'action, focus piégé et posé sur Annuler, `Échap`, focus rendu au déclencheur, `motDeConfirmation` optionnel
- [x] 6.9 `EtatVide` — écrit en 9.1, avec son premier consommateur : l'état vide de l'écran d'accueil
- [x] 6.10 `Squelette` — géométrie du contenu final, `aria-busy`, animation neutralisée sous `prefers-reduced-motion`
- [x] 6.11 `EtiquetteRole` — le mot est toujours écrit, la couleur n'est jamais seule
- [x] 6.12 Voir les tests passer

## 7. Coquilles

- [x] 7.1 `EnTeteSite` — logotype, liens, recherche, et avatar ou boutons Connexion/Inscription selon la session
- [x] 7.2 `CoquilleAuth` — deux colonnes, vitrine `ardoise` et formulaire `nappe`
- [x] 7.3 `CoquilleBackOffice` — nav latérale 236 px **construite depuis le rôle** (aucune entrée interdite rendue), fil d'Ariane, tiroir en mobile
- [x] 7.4 Tant que la session n'a pas répondu : squelette, ni contenu protégé ni `403`
- [x] 7.5 Pied de page commun aux écrans publics

## 8. Écrans système

- [x] 8.1 `PageImpasse` — code chiffré `aria-hidden`, `h1` porteur de l'information, actions, bloc de détail optionnel
- [x] 8.2 404 — dans la coquille courante, navigation intacte
- [x] 8.3 403 — **dans la coquille du back-office, à l'URL demandée, sans redirection** ; nomme le rôle requis et le rôle courant ; variante 401 pour un visiteur
- [x] 8.4 500 — référence d'incident copiable, aucune trace technique (ni pile, ni requête, ni jeton)
- [x] 8.5 Remplacer l'`ErrorBoundary` anglais de `root.tsx` et brancher `isRouteErrorResponse` par segment

## 9. Preuve et clôture

- [x] 9.1 Écran de fumée : une page publique qui liste des recettes via la couche d'accès, avec ses trois états — elle prouve le socle de bout en bout
- [x] 9.2 Vérifié dans Chrome, **API éteinte** (Docker non lancé) : vitrine debout malgré l'API injoignable, bandeau `role="alert"`, session dégradée en visiteur, 404 avec sa navigation, 401 dans la coquille du back-office sans redirection, coquille d'authentification au bon rendu, console sans erreur autre que `ERR_CONNECTION_REFUSED`
- [x] 9.2b Vérifié avec la base, l'API et le client lancés : connexion (cookies posés, `document.cookie` vide côté JS), **jeton expiré rejoué sans clignotement** (`401` → `rafraichissement` → rejeu, un seul de chaque, l'écran ne montre rien), déconnexion (l'en-tête repasse à Connexion/Inscription immédiatement), et `403` sur `/panneau/utilisateurs` avec un compte modérateur — nommant les deux rôles, à l'URL demandée, sans redirection
- [x] 9.3 Chercher `localStorage`, `sessionStorage`, « token » et le motif `-[` dans `client/app` : aucune occurrence
- [x] 9.4 `npm test` et `npm run verify` verts, sortie à l'appui
- [x] 9.5 Groupe 11 de `setup-authentification` : 11.2 et 11.3 cochés (11.3 reformulée, sans react-query). **11.1 reste ouvert** — les formulaires arrivent avec les écrans 4 et 5, donc le change ne se ferme pas encore
- [x] 9.6 Mettre à jour `docs/avancement.md` : lot 5, pourcentage, date de vérification
