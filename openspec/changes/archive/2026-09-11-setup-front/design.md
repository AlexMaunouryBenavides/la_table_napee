## Context

`client/` est le template React Router v7 par défaut : `app/welcome/`,
`routes/home.tsx`, une police Inter chargée depuis Google Fonts, un `ErrorBoundary` en
anglais. Tailwind v4 et `@recipe/types` sont déjà branchés, rien d'autre.

En face, l'API est figée et connue :

- préfixe global `/api`, routes en français ;
- CORS avec `origin: FRONT_ORIGIN` exact et `credentials: true` — **le navigateur est
  explicitement prévu comme appelant** ;
- authentification par cookies `httpOnly`, avec **rotation** du jeton de
  rafraîchissement et détection de vol par famille ;
- erreurs de forme unique `{ statusCode, message, timestamp, path }`, plus `details[]`
  en validation ;
- listes paginées enveloppées `{ donnees, total, page, limite }`, sauf les 4 listes de
  catégories et les avis d'une recette, renvoyés en tableau nu.

Et la conception du front est prête : `design/ecrans.md` (14 écrans, chacun rattaché à
ses routes) et un handoff de maquettes haute fidélité hors dépôt, dont la colonne
« Notes d'implémentation » fait partie de la spécification.

## Goals / Non-Goals

**Goals :**

- Une seule façon d'appeler l'API, qui rend le refresh transparent invisible aux
  écrans.
- Les tokens du handoff traduits une fois, pour que plus aucun écran n'écrive une
  valeur en dur.
- Les composants que plusieurs écrans partagent, écrits une fois.
- Les trois coquilles et l'ossature de routes des 14 écrans.
- Les écrans système 404 / 403 / 500, qui sont de l'infrastructure d'erreur, pas des
  pages.

**Non-Goals :**

- Les écrans 1 à 11. Ils viendront un par un.
- Les tests des écrans eux-mêmes : le harnais est posé ici (D9), mais il ne sert dans
  ce change qu'à la couche d'accès API et aux composants porteurs de règle.
- Le déploiement, les polices auto-hébergées optimisées, le SEO.
- Les vraies photos de recettes : les aplats du handoff restent en place.

## Decisions

### D1 — SPA (`ssr: false`) plutôt que rendu serveur

**Choix** : passer `react-router.config.ts` à `ssr: false` et charger les données par
`clientLoader` / `clientAction`. Le routage, les `ErrorBoundary` par segment,
`useNavigation()` et l'URL comme source de vérité restent ceux du framework mode.

**Pourquoi** : l'authentification passe par cookie `httpOnly` sur une **autre origine**
que le front. En SSR, le loader tourne sur le serveur Node du front : il faudrait
recopier à la main l'en-tête `Cookie` de la requête entrante vers chaque appel API,
**puis** relayer les `Set-Cookie` de l'API vers la réponse du navigateur — y compris
ceux d'une rotation déclenchée par un refresh en plein loader. Chaque loader devrait
renvoyer ses `headers`, et un oubli déconnecte l'utilisateur sans message.

Dans le navigateur, `credentials: 'include'` suffit : le cookie part tout seul, la
rotation arrive toute seule. C'est précisément ce que la configuration CORS de l'API
(origine exacte + `credentials: true`) prévoit déjà.

**Alternatives écartées** :

- _SSR avec relais de cookies_ : correct mais coûteux en plomberie, pour un bénéfice
  (premier rendu peuplé) que le handoff a déjà abandonné — il dessine un squelette pour
  chaque écran.
- _SSR pour la coquille, `clientLoader` pour les données_ : deux modèles mentaux en
  même temps, sans rien résoudre.

**Ce qu'on accepte** : pas de SEO côté serveur. Si un jour le référencement compte, le
`prerender` de React Router traitera les pages publiques sans changer les écrans.

### D2 — `app/acces-api/`, un module par ressource au-dessus d'un seul `appelerApi`

```
app/acces-api/
  appeler-api.ts      ← URL de base, credentials, parsing, erreur typée, refresh
  erreur-api.ts       ← la classe d'erreur qui porte statusCode / message / details
  session.ts          ← GET /utilisateurs/moi, l'état « connecté » et le rôle
  recettes.ts  avis.ts  utilisateurs.ts  categories.ts  ingredients.ts
```

Les écrans n'appellent jamais `appelerApi` directement : ils appellent
`listerRecettes(criteres)`, qui type son retour depuis `@recipe/types`. Le jour où une
route bouge, un seul fichier bouge.

### D3 — Le refresh vit dans `appelerApi`, avec une promesse partagée

Sur `401`, `appelerApi` appelle `POST /auth/rafraichissement` puis rejoue la requête
**une seule fois** — un drapeau passé au rejeu interdit la récursion. Les appels
parallèles qui prennent `401` en même temps partagent **la même** promesse de
rafraîchissement (une variable de module, remise à `null` à la fin) : un seul appel
part, sinon la rotation invaliderait la famille de jetons et déconnecterait
l'utilisateur au premier écran qui charge deux listes.

`POST /auth/rafraichissement` et `POST /auth/connexion` sont eux-mêmes exclus du
mécanisme : un `401` dessus est une vraie fin de session.

### D4 — Tokens en `@theme`, composants en classes utilitaires

`theme.css` du handoff devient un bloc `@theme` dans `app/app.css` : `--color-ardoise`,
`--color-nappe`, `--font-titre`, `--text-*`, `--radius-*`, `--shadow-*`, `--spacing:
4px`. Les composants n'écrivent que des classes Tailwind dérivées de ces tokens
(`bg-ardoise`, `text-encre-70`, `rounded-carte`). Les classes maison du handoff
(`lt-btn`, `lt-champ`) **ne sont pas reprises** — elles n'existaient que pour rendre les
maquettes lisibles hors build.

Le mode sombre du template (`dark:bg-gray-950`) disparaît : le handoff ne définit qu'un
thème.

### D5 — Polices par `@fontsource`, pas par Google Fonts

Cormorant Garamond, Maitree et Ruthie arrivent en dépendances npm et sont servies par
le site. Pas de requête tierce, pas de dépendance réseau externe, et les piles de repli
du handoff (Georgia, Brush Script MT) restent déclarées. Le `preconnect` Google du
template est supprimé.

### D6 — Arborescence en français, une page par écran

```
app/
  acces-api/      ← D2
  composants/     ← Bouton, Champ, Bandeau, EtatVide, Squelette, Pagination,
                    ModaleConfirmation, Etoiles, EtiquetteRole
  coquilles/      ← EnTeteSite, CoquilleAuth, CoquilleBackOffice
  routes/         ← un fichier par écran de design/ecrans.md
  app.css  root.tsx  routes.ts
```

Un composant n'est « partagé » que s'il sert **deux** écrans. Tant qu'il n'en sert
qu'un, il reste dans le fichier de l'écran : ce change ne crée pas les composants
spécifiques (`ChampAutocompletion`, `ListeReordonnable`, `CrudCategorie`), ils naîtront
avec leur écran.

### D7 — La session chargée par la racine, le rôle jamais deviné

`root.tsx` charge `GET /utilisateurs/moi` en `clientLoader` et expose la session aux
enfants. Un `401` vaut « visiteur », pas une erreur. **Tant que la session n'a pas
répondu, un écran protégé n'affiche ni son contenu ni un `403`** — il affiche un
squelette : un 403 affiché à tort est pire qu'une demi-seconde d'attente.

La navigation du back-office est **construite** depuis le rôle : un modérateur ne reçoit
jamais le markup des entrées Utilisateurs et Catégories. Ce n'est pas un contrôle de
sécurité — l'API refuse de toute façon — c'est une interface qui ne ment pas.

### D8 — Pas de bibliothèque d'état ; Zustand le jour où il en faut une

L'état « serveur » vit dans les `clientLoader`, qui apportent déjà chargement,
revalidation après action, erreurs par segment et annulation des navigations
périmées. L'état d'écran vit dans `useState`, les critères de liste dans l'URL, et la
session dans le loader racine. Il ne reste donc rien à stocker ailleurs.

**Pas de React Query** : empilé sur les loaders, il donne deux caches et deux sources
de vérité pour la même donnée. Le kit classe `react-query.md` en `preference`, et la
convention du projet gagne sur une preference — mais la tâche 11.3 de
`setup-authentification` le nomme encore, il faudra la reformuler en la cochant.

**Si un état transverse apparaît vraiment** (et seulement à ce moment-là) : **Zustand**,
choisi par le projet. On ne l'installe pas d'avance.

### D9 — Vitest + Testing Library, posés en premier

Le socle s'écrit en TDD comme le reste du projet. Vitest (il partage la config Vite
déjà là) plus `@testing-library/react` et `jsdom` sont la première tâche du change ;
`npm test` du workspace `client` les lance.

Ce qui se teste vraiment ici : `appeler-api` (forme d'erreur, `credentials`, refresh
rejoué **une seule fois**, promesse partagée entre appels parallèles) et les composants
qui portent une règle (`Etoiles` avec `noteMoyenne: null`, `Pagination` qui écrit
l'URL, `ModaleConfirmation` et son piège à focus). Le reste — mise en page, coquilles,
écrans système — se vérifie à l'œil contre la maquette : un test d'instantané sur du
balisage de présentation coûte plus qu'il ne rapporte.

### D10 — Les écarts du handoff tranchés en faveur du contrat

Le handoff nomme `POST /authentification/connexion` (c'est `/auth/connexion`),
`GET /avis?limite=5` et `POST /ingredients` (aucun des deux n'existe). `design/ecrans.md`
et `design/routes-api.md` font foi. Conséquence immédiate ici : la coquille du
back-office ne prévoit pas de tuile « derniers avis ».

## Risks / Trade-offs

- **Pas de SSR → premier rendu vide pour un moteur de recherche.** → Assumé : projet
  personnel, et `prerender` reste disponible plus tard sans toucher aux écrans.
- **Le refresh partagé est le point le plus délicat du change.** Mal fait, il produit
  des déconnexions aléatoires et difficiles à reproduire, parce que la rotation
  invalide la famille de jetons. → Une seule implémentation, isolée dans
  `appeler-api.ts`, et c'est le premier endroit à regarder devant tout bug de session.
- **Traduire les tokens à la main est mécanique et donc faux quelque part.** → On
  compare une fois le rendu d'une page témoin avec la maquette correspondante, plutôt
  que de relire la table de correspondance.
- **Le socle peut grossir tout seul.** Écrire onze composants « au cas où » avant le
  premier écran, c'est construire à l'aveugle. → La règle « deux écrans avant d'être
  partagé » tient ; les composants du socle sont ceux que le handoff nomme déjà comme
  partagés.
- **`ssr: false` change le contrat de déploiement** : le client devient un paquet
  statique, plus un serveur Node. → C'est plus simple à héberger, à revoir au lot 6.

## Migration Plan

Rien à migrer : `client/` n'a jamais servi. Le template par défaut (`app/welcome/`,
`routes/home.tsx`, le `links` Google Fonts, le mode sombre) est supprimé dans le même
mouvement que la pose du socle — le laisser en place produirait un site à deux styles.

## Open Questions

- **`limite` par défaut** : le handoff utilise 12 (panneau recettes), 20 (utilisateurs,
  catalogue). À figer dans `Pagination` comme défaut surchargeable.
