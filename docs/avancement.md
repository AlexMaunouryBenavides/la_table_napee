# Avancement du projet — La Table Nappée

> **Ce fichier se tient à la main.** Il consolide ce qu'aucune commande ne sait dire
> seule : `npx openspec list` ne voit que les _changes_ en cours (les archivés
> disparaissent, le front n'en a aucun), et `git log` ne dit pas ce qui reste.
>
> Sources croisées pour l'écrire : `git log`, `npx openspec list`,
> `openspec/changes/*/tasks.md`, `design/routes-api.md` (le contrat = la liste
> exhaustive de ce qu'il faut construire), `docs/etapes-general.md` (le plan global).
>
> **Dernière vérification : 2026-09-10** — commit `9f329fa` + le travail non commité
> de la branche `setup-authentification` (feature avis, puis adaptation à `eng-kit`).
>
> Les RÈGLES d'ingénierie vivent maintenant dans `eng-kit/` (dépôt séparé, ignoré ici) :
> `docs/conventions/` et `docs/guides/` ont été supprimés.

---

## Vue d'ensemble

```
GLOBAL   ████████████░░░░░░░░   59 %
```

| Lot                                        | Poids | Avancement | Barre                  |
| ------------------------------------------ | ----: | ---------: | ---------------------- |
| 1. Conception                              |  10 % |       75 % | `███████████████░░░░░` |
| 2. Mise en place (socle)                   |  30 % |       95 % | `███████████████████░` |
| 3. Features API (les 37 routes du contrat) |  25 % |       57 % | `███████████░░░░░░░░░` |
| 4. Tests                                   |  10 % |       75 % | `███████████████░░░░░` |
| 5. Front                                   |  20 % |        2 % | `░░░░░░░░░░░░░░░░░░░░` |
| 6. Déploiement                             |   5 % |        0 % | `░░░░░░░░░░░░░░░░░░░░` |

Les poids sont un jugement, pas une science : ils disent seulement que le front pèse
autant qu'un quart du back. Le global en découle (somme pondérée).

**En une phrase** : le socle back est fini et solide, mais seules 10 routes sur 37
existent, et le front n'a pas commencé.

---

## 1. Conception — 75 %

`███████████████░░░░░`

| Élément                      | État | Où                             |
| ---------------------------- | ---- | ------------------------------ |
| Cas d'usage (UC-01 → UC-16)  | ✅   | `design/use-cases-recettes.md` |
| Modélisation base de données | ✅   | `docs/database.sql`            |
| Contrat des routes de l'API  | ✅   | `design/routes-api.md`         |
| **Maquette front**           | ❌   | —                              |

**Reste à faire — et comment**

- **Maquette front** : le seul trou de la phase conception, et il bloque le lot 5. Pas
  besoin de Figma : une liste d'écrans (liste des recettes, détail, connexion,
  inscription, mon compte, panneau de modération) avec, pour chacun, les données
  affichées et les actions possibles. Un `design/ecrans.md` suffit.
- **4 décisions laissées ouvertes** dans `design/routes-api.md` § 5, à trancher au
  moment d'écrire la feature concernée : forme des étapes (tableau vs sous-ressource),
  syntaxe de tri, note moyenne dans les listes, favoris (reporté).

---

## 2. Mise en place (socle) — 95 %

`███████████████████░`

| Étape                                    | État | Preuve                                                |
| ---------------------------------------- | ---- | ----------------------------------------------------- |
| Monorepo npm (workspaces)                | ✅   | `package.json`                                        |
| Outillage qualité (`npm run verify`)     | ✅   | change archivé `setup-outillage-qualite`              |
| Fondations transverses API               | ✅   | change archivé `setup-fondations-api`                 |
| Base MySQL + docker                      | ✅   | `api/docker-compose.yml`, `api/src/config/`           |
| CI GitHub Actions                        | 🟡   | `.github/workflows/ci.yml` (les e2e n'y tournent pas) |
| Entités TypeORM                          | ✅   | `api/src/*/entities/`                                 |
| Migration initiale (DDL → migration n°1) | ✅   | `api/src/migrations/1786718528873-SchemaInitial.ts`   |
| Seeds de RÉFÉRENCE                       | ✅   | `api/src/seeds/donnees-reference.ts`                  |
| Seeds d'EXEMPLE (volume)                 | ❌   | faker non installé                                    |
| Authentification & rôles                 | 🟡   | `api/src/auth/` — détail ci-dessous                   |

### 2.a Authentification — 30/37 tâches (`setup-authentification`)

Fait : Argon2, inscription, connexion, cookies `httpOnly`/`Secure`/`SameSite=Lax`,
refresh persisté hashé, rotation, détection de vol par famille, déconnexion, stratégie
passport-jwt lisant le cookie, `JwtAuthGuard`, `@Roles()` + `RolesGuard`, hiérarchie
admin ⊃ modérateur ⊃ utilisateur (`auth/hierarchie-roles.ts`), `@UtilisateurCourant()`,
et le contrôle de propriété anti-IDOR (10.1/10.2) appliqué sur les avis.

Depuis l'adoption du kit : **deny-by-default** (`nest-authz.r1`) — l'API est fermée par
défaut par un `APP_GUARD` global, seules les routes `@Public()` sont ouvertes ;
algorithme JWT épinglé (`passport.r3`) ; erreurs serveur et refus d'accès journalisés
(`error-handling.r8`, `security.r9`).

**Reste à faire — et comment**

- **10.3 anti-auto-rétrogradation du dernier admin** : **fait** avec F3 — règle du
  service `utilisateurs`, appliquée aussi à `DELETE /moi`.
- **11.x intégration client** (formulaires, `credentials: 'include'`, refresh
  transparent sur 401) : appartient de fait au lot 5, à faire au premier écran protégé.
- **12.1 / 12.3 vérifications de sécurité** : deux tests e2e — un `403` pour rôle
  insuffisant, un `403` pour modification de l'avis d'autrui.

### 2.b Couche de données — 23/28 tâches (`setup-couche-donnees`)

**Reste à faire — et comment**

- **6.2 validation des énums là où elles entrent** (`@IsIn(DIFFICULTES)`,
  `@IsIn(UNITES)`…) : déjà fait sur le DTO de query des recettes ; le reste arrive
  mécaniquement avec les DTO d'écriture (F1).
- **7.2 / 7.5 seeds d'exemple** : installer `@faker-js/faker` en dev et étendre
  `api/src/seeds/seed.ts` (script idempotent déjà en place) pour générer ~50 recettes.
  C'est le ticket **F0**, utile surtout pour éprouver pagination et filtres.
- **8.1 / 8.2 DTO d'entrée par cas d'usage** : ne se fait pas d'un bloc, c'est une ligne
  de chaque feature ci-dessous. À re-vérifier à chaque DTO : jamais `password_hash`,
  jamais `role` en entrée utilisateur.

---

## 3. Features API — 21 routes sur 37 (57 %)

`███████████░░░░░░░░░`

Référence : `design/routes-api.md`. Chaque ligne = une route du contrat.

### ✅ Fait (21 routes)

| Routes                                                                       | UC            | Où                                                               |
| ---------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `POST /auth/inscription` · `connexion` · `rafraichissement` · `deconnexion`  | UC-04, UC-05  | `api/src/auth/auth.controller.ts`                                |
| `GET /recettes` (pagination, tri, 9 filtres) · `GET /recettes/:id`           | UC-01 → 03    | `api/src/recettes/`                                              |
| `GET` et `POST /recettes/:id/avis`                                           | UC-02, UC-06  | `api/src/avis/avis-de-recette.controller.ts`                     |
| `PATCH` et `DELETE /avis/:id`                                                | UC-07/08/14   | `api/src/avis/avis.controller.ts`                                |
| `POST` · `PATCH` · `DELETE /recettes` (F1)                                   | UC-11/12/13   | `api/src/recettes/`                                              |
| `/utilisateurs/moi` en GET · PATCH · DELETE + `PATCH /moi/mot-de-passe` (F2) | UC-09, UC-09b | `api/src/utilisateurs/`                                          |
| `GET /utilisateurs` · `PATCH /:id/role` · `DELETE /:id` (F3)                 | UC-16         | `api/src/utilisateurs/administration-utilisateurs.controller.ts` |
| `GET /ingredients?recherche=` (F5)                                           | support UC-11 | `api/src/ingredients/`                                           |

### ❌ Reste à faire (16 routes)

| Ticket | Périmètre                 | Routes | UC    | Comment (l'essentiel à ne pas rater)                                                                                                                                                                        |
| ------ | ------------------------- | -----: | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F0** | Seeds d'exemple           |      0 | —     | faker + `seed.ts`. Débloque le test réel des filtres et de la pagination.                                                                                                                                   |
| **F4** | Catégories (4 ressources) |     16 | UC-15 | Le même patron 4 fois : lecture publique, écriture admin. **Ne pas factoriser d'emblée** (`eng-kit/rules/shared/clean-code.md`). Traduire le refus `ON DELETE RESTRICT` de MySQL en `409`, jamais en `500`. |

**F1, F2, F3 et F5 sont faits.** Ordre pour la suite : **F4 → F0**.

---

## 4. Tests — 75 %

`███████████████░░░░░`

Le change `setup-tests` affiche **0/18** dans OpenSpec, mais c'est faux : l'infra a été
écrite en cours de route sans que les cases soient cochées. La réalité :

| Élément                                               | État |
| ----------------------------------------------------- | ---- |
| Jest unitaire (`npm test`) — 17 tests, 5 suites, vert | ✅   |
| Jest e2e (`npm run test:e2e`) + supertest             | ✅   |
| Base de test isolée + garde-fou anti-écrasement       | ✅   |
| Helpers (`test/app-de-test.ts`, `test/aide-auth.ts`)  | ✅   |
| 12 fichiers e2e — 95 tests, vert (sérialisés)         | ✅   |
| Guide de tests                                        | ❌   |
| Factories / fixtures (`test/fixtures.ts`)             | ✅   |
| e2e dans la CI                                        | ❌   |
| Tests sur la feature avis                             | ✅   |

**Reste à faire — et comment**

- **Cocher les groupes 2 à 5** de `openspec/changes/setup-tests/tasks.md` : ils sont
  faits, c'est le suivi qui ment.
- **e2e dans la CI** : le workflow ne lance que `npm test`. Ajouter un service MySQL au
  job, `npm run migration:run:test`, puis `npm run test:e2e --workspace api`.
- **Factories** : au premier test qui a besoin d'une recette complète (F1), plutôt que
  de recopier un objet à dix champs dans chaque fichier.
- **`docs/guides/tests.md`** : optionnel maintenant que l'infra existe.

---

## 5. Front — 2 %

`░░░░░░░░░░░░░░░░░░░░`

**Rien n'a commencé.** `client/` est encore le template React Router v7 par défaut
(`app/root.tsx`, `app/routes/home.tsx`, `app/welcome/`). Tailwind v4 est installé,
`@recipe/types` est déjà lié.

**Reste à faire — et comment**

1. Poser les écrans (dépend de la maquette du lot 1) et `app/routes.ts`.
2. Une couche d'accès API **unique** (`fetch` avec `credentials: 'include'` —
   obligatoire, l'auth passe par cookie) plutôt qu'un `fetch` dispersé par route.
3. Refresh transparent : sur `401`, appeler `/auth/rafraichissement` puis rejouer la
   requête **une seule fois**. Aucun token en JS, jamais de `localStorage`.
4. Écrans dans l'ordre : liste → détail → connexion/inscription → avis → mon compte →
   panneau de modération.
5. Créer un change OpenSpec `setup-front` : aujourd'hui aucun change ne couvre le
   front, donc rien ne le suit.

---

## 6. Déploiement — 0 %

`░░░░░░░░░░░░░░░░░░░░`

Rien : pas d'hébergement choisi, pas de variables de production, pas de nom de domaine.
À traiter en dernier. Le seul point à ne pas oublier le jour venu : `Secure` sur les
cookies impose HTTPS, et `FRONT_ORIGIN` doit pointer le domaine réel, jamais `*`.

---

## Dette et écarts repérés

| Point                                                                     | Quoi en faire                     |
| ------------------------------------------------------------------------- | --------------------------------- |
| Tâches OpenSpec faites mais non cochées (auth 10.x/12.x, données 6.2/8.x) | le suivi ment, le corriger        |
| Note moyenne absente des listes (`routes-api.md` § 5)                     | trancher : agrégation, jamais N+1 |
| Aucun change OpenSpec ne couvre le front                                  | à créer avant d'attaquer le lot 5 |

---

## Plan pour terminer l'API

> **Objectif courant : boucler l'API. Le front vient après.** Les étapes sont dans
> l'ordre d'exécution ; chacune suit la même boucle — je propose les tests, tu les
> valides, je les fais passer, on commite.

**Ce qui reste ne contient plus rien de conceptuellement difficile** : sur les 17
routes manquantes, 16 sont le même patron CRUD répété quatre fois et 1 est une simple
requête de recherche. Le difficile (transaction + N+1, anti-IDOR, rotation de jetons,
dernier admin) est derrière.

| #     | Étape                                       | Routes | Pourquoi dans cet ordre                                                                                                                                                      |
| ----- | ------------------------------------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ | ~~**Tests e2e de la feature avis**~~        |      0 | **Fait** — 14 tests e2e, le contrôle de propriété est tenu (tâche 12.3 close).                                                                                               |
| ~~2~~ | ~~**F5 — autocomplétion des ingrédients**~~ |      1 | **Fait** — enveloppe paginée, recherche insensible à la casse, 8 tests e2e.                                                                                                  |
| 3     | **F4 — catégories (4 ressources)**          |     16 | Le gros du volume restant, mais répétitif. Lecture publique, écriture admin. **Ne pas factoriser d'emblée** ; traduire le `RESTRICT` de MySQL en `409`.                      |
| 4     | **F0 — seeds d'exemple (faker)**            |      0 | Pas bloquant pour l'API, mais indispensable pour éprouver pagination et filtres pour de vrai, et pour amorcer le front. Couvre les tâches 7.2/7.5 de `setup-couche-donnees`. |
| 5     | **Synchroniser le suivi OpenSpec**          |      0 | Cocher ce qui est fait (auth 10.1→10.3, 12.1, 12.3, 12.4 ; données 6.2, 8.1, 8.2 ; tests 2→5) et archiver ce qui est clos.                                                   |

À la fin de l'étape 5, l'API couvre les **37 routes du contrat** et le lot 3 est à
100 %.

### Reporté sciemment (décidé, pas oublié)

| Point                                                              | Raison                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Anti-bruteforce **par compte** (`authentication.r2`)               | le throttler par IP couvre partiellement ; demande une colonne en base |
| `code` stable + `requestId` dans les erreurs (`error-handling.r7`) | la forme d'erreur est figée par `routes-api.md`, changement à assumer  |
| e2e dans la CI, et tout le CD                                      | priorité au développement local                                        |
| Versionnement d'URL, HATEOAS (`api-design.r11`, `r12`)             | sur-ingénierie pour un projet personnel                                |
| Favoris                                                            | reporté par le design, purement additif                                |

---

## Comment mettre à jour ce fichier

Après chaque feature terminée : cocher les cases du `tasks.md` concerné, mettre à jour
la ligne correspondante du lot 3, recalculer le pourcentage du lot (routes faites ÷
routes du contrat), puis le global (somme pondérée du tableau de tête). Et changer la
date de « dernière vérification ».
