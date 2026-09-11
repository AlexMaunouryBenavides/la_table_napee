# Avancement du projet — La Table Nappée

> **Ce fichier se tient à la main.** Il consolide ce qu'aucune commande ne sait dire
> seule : `npx openspec list` ne voit que les _changes_ en cours (les archivés
> disparaissent, le front n'en a aucun), et `git log` ne dit pas ce qui reste.
>
> Sources croisées pour l'écrire : `git log`, `npx openspec list`,
> `openspec/changes/*/tasks.md`, `design/routes-api.md` (le contrat = la liste
> exhaustive de ce qu'il faut construire), `design/ecrans.md` (la liste exhaustive des
> écrans), `docs/etapes-general.md` (le plan global).
>
> **Dernière vérification : 2026-09-11** — branche `setup-authentification`, socle du
> front écrit (change `setup-front`, groupes 1 à 9).
>
> Les RÈGLES d'ingénierie vivent maintenant dans `eng-kit/` (dépôt séparé, ignoré ici) :
> `docs/conventions/` et `docs/guides/` ont été supprimés.

---

## Vue d'ensemble

```
GLOBAL   ████████████████░░░░   78 %
```

| Lot                                        | Poids | Avancement | Barre                  |
| ------------------------------------------ | ----: | ---------: | ---------------------- |
| 1. Conception                              |  10 % |      100 % | `████████████████████` |
| 2. Mise en place (socle)                   |  30 % |      100 % | `████████████████████` |
| 3. Features API (les 37 routes du contrat) |  25 % |      100 % | `████████████████████` |
| 4. Tests                                   |  10 % |       75 % | `███████████████░░░░░` |
| 5. Front                                   |  20 % |       25 % | `█████░░░░░░░░░░░░░░░` |
| 6. Déploiement                             |   5 % |        0 % | `░░░░░░░░░░░░░░░░░░░░` |

Les poids sont un jugement, pas une science : ils disent seulement que le front pèse
autant qu'un quart du back. Le global en découle (somme pondérée).

**En une phrase** : le back est terminé, le **socle du front est posé et prouvé dans un
navigateur** (tokens, couche d'accès API avec refresh transparent, composants partagés,
coquilles, écrans système) ; restent les onze écrans de contenu, puis le déploiement.

---

## 1. Conception — 100 %

`████████████████████`

| Élément                      | État | Où                                           |
| ---------------------------- | ---- | -------------------------------------------- |
| Cas d'usage (UC-01 → UC-16)  | ✅   | `design/use-cases-recettes.md`               |
| Modélisation base de données | ✅   | `docs/database.sql`                          |
| Contrat des routes de l'API  | ✅   | `design/routes-api.md`                       |
| Maquette front               | ✅   | `design/ecrans.md` + le handoff (hors dépôt) |

**Sur la maquette** : `design/ecrans.md` liste les **14 écrans**, chacun rattaché à ses
routes et à ses UC — aucun écran sans route, aucune route orpheline. Le rendu détaillé
vit dans `design_handoff_la_table_nappee/` : 14 maquettes HTML haute fidélité (desktop
et mobile, états chargement / vide / erreur) et `theme.css` (les tokens, à coller dans
`app/app.css`). **Ce dossier est volontairement hors dépôt** (`.gitignore`) : c'est une
référence de conception locale, pas du code du projet — ses classes maison (`lt-btn`,
`lt-champ`) sont à traduire en Tailwind, jamais à recopier.

**Reste ouvert (sciemment)** : les 4 décisions de `design/routes-api.md` § 5 — forme
des étapes, syntaxe de tri, note moyenne dans les listes, favoris (reporté). À trancher
au moment d'écrire l'écran ou la feature concernée.

---

## 2. Mise en place (socle) — 100 %

`████████████████████`

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
| Seeds d'EXEMPLE (volume)                 | ✅   | `npm run seed:exemples` (faker, idempotent)           |
| Authentification & rôles                 | ✅   | `api/src/auth/` — détail ci-dessous                   |

### 2.a Authentification — 34/37 tâches, mais côté serveur c'est fini

Fait : Argon2, inscription, connexion, cookies `httpOnly`/`Secure`/`SameSite=Lax`,
refresh persisté hashé, rotation, détection de vol par famille, déconnexion, stratégie
passport-jwt lisant le cookie, `JwtAuthGuard`, `@Roles()` + `RolesGuard`, hiérarchie
admin ⊃ modérateur ⊃ utilisateur (`auth/hierarchie-roles.ts`), `@UtilisateurCourant()`,
le contrôle de propriété anti-IDOR appliqué sur les avis, et la protection du dernier
admin (auto-rétrogradation comme `DELETE /moi`).

Depuis l'adoption du kit : **deny-by-default** (`nest-authz.r1`) — l'API est fermée par
défaut par un `APP_GUARD` global, seules les routes `@Public()` sont ouvertes ;
algorithme JWT épinglé (`passport.r3`) ; erreurs serveur et refus d'accès journalisés
(`error-handling.r8`, `security.r9`).

**Les 3 tâches restantes (groupe 11) sont du front** et se feront dans le lot 5 :
formulaires connexion/inscription, appels avec `credentials: 'include'` sans aucun jeton
en JS, refresh transparent sur 401. Le change `setup-authentification` ne se fermera
donc qu'avec les premiers écrans protégés.

### 2.b Couche de données — terminée et archivée

Les 28 tâches sont cochées et le change est archivé
(`openspec/changes/archive/2026-09-10-setup-couche-donnees`).

---

## 3. Features API — 37 routes sur 37 (100 %)

`████████████████████`

Référence : `design/routes-api.md`. Chaque ligne = une part du contrat.

| Routes                                                                                          | UC            | Où                                                               |
| ----------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `POST /auth/inscription` · `connexion` · `rafraichissement` · `deconnexion`                     | UC-04, UC-05  | `api/src/auth/auth.controller.ts`                                |
| `GET /recettes` (pagination, tri, 9 filtres) · `GET /recettes/:id`                              | UC-01 → 03    | `api/src/recettes/`                                              |
| `GET` et `POST /recettes/:id/avis`                                                              | UC-02, UC-06  | `api/src/avis/avis-de-recette.controller.ts`                     |
| `PATCH` et `DELETE /avis/:id`                                                                   | UC-07/08/14   | `api/src/avis/avis.controller.ts`                                |
| `POST` · `PATCH` · `DELETE /recettes`                                                           | UC-11/12/13   | `api/src/recettes/`                                              |
| `/utilisateurs/moi` en GET · PATCH · DELETE + `PATCH /moi/mot-de-passe`                         | UC-09, UC-09b | `api/src/utilisateurs/`                                          |
| `GET /utilisateurs` · `PATCH /:id/role` · `DELETE /:id`                                         | UC-16         | `api/src/utilisateurs/administration-utilisateurs.controller.ts` |
| `GET /ingredients?recherche=`                                                                   | support UC-11 | `api/src/ingredients/`                                           |
| `/regimes`, `/criteres-sante`, `/types-aliment`, `/nationalites` en GET · POST · PATCH · DELETE | UC-03, UC-15  | `api/src/categories/`                                            |

**Le contrat est couvert intégralement. Plus aucune route à écrire.** Le plan API en
cinq étapes (tests avis, ingrédients, catégories, seeds d'exemple, suivi OpenSpec) est
terminé.

---

## 4. Tests — 75 %

`███████████████░░░░░`

| Élément                                               | État |
| ----------------------------------------------------- | ---- |
| Jest unitaire (`npm test`) — 17 tests, 5 suites, vert | ✅   |
| Jest e2e (`npm run test:e2e`) + supertest             | ✅   |
| Base de test isolée + garde-fou anti-écrasement       | ✅   |
| Helpers (`test/app-de-test.ts`, `test/aide-auth.ts`)  | ✅   |
| 14 fichiers e2e — 111 tests, vert (sérialisés)        | ✅   |
| Factories / fixtures (`test/fixtures.ts`)             | ✅   |
| Tests sur toutes les features API                     | ✅   |
| Guide de tests (`setup-tests` 1.1 / 1.2)              | ❌   |
| e2e dans la CI (`setup-tests` 6.1 / 6.2)              | ❌   |

`setup-tests` est à **14/18** : il ne reste que ces deux sujets.

**Reste à faire — et comment**

- **e2e dans la CI** : le workflow ne lance que `npm test`. Ajouter un service MySQL au
  job, `npm run migration:run:test`, puis `npm run test:e2e --workspace api`, et
  vérifier que le merge est bloqué si un test échoue.
- **Guide de tests** : optionnel maintenant que l'infra existe et qu'elle s'imite par
  l'exemple. À écrire seulement si le besoin se fait sentir.

---

## 5. Front — 25 %

`█████░░░░░░░░░░░░░░░`

Le change **`setup-front`** a posé le socle (groupes 1 à 9 sur 9). 76 tests côté client,
`npm run verify` vert, et les écrans vérifiés dans un vrai navigateur.

### Ce qui existe

| Brique                                          | Où                                       |
| ----------------------------------------------- | ---------------------------------------- |
| Harnais Vitest + Testing Library                | `client/vite.config.ts`, `client/test/`  |
| Les 43 tokens du handoff en `@theme`            | `client/app/app.css`                     |
| Polices auto-hébergées (`@fontsource`)          | pas de requête tierce                    |
| Couche d'accès API unique + refresh transparent | `client/app/acces-api/`                  |
| Session et rôles depuis le serveur              | `root.tsx`, `session-courante.ts`        |
| Composants partagés (9)                         | `client/app/composants/`                 |
| Trois coquilles, nav construite depuis le rôle  | `client/app/coquilles/`                  |
| Ossature des 14 routes                          | `client/app/routes.ts`                   |
| Écrans système 404 / 403 / 500                  | `composants/page-impasse.tsx` et voisins |

### Décisions structurantes

- **SPA (`ssr: false`)** : l'auth passe par cookie `httpOnly` sur une autre origine.
  Dans le navigateur, `credentials: 'include'` suffit ; en SSR il aurait fallu relayer
  chaque `Set-Cookie`, rotation comprise. Le SEO se rattrapera par `prerender`.
- **Pas de react-query** : les `clientLoader` tiennent l'état serveur. Si un état
  transverse apparaît un jour, ce sera **Zustand**.
- Le refresh vit dans `appeler-api.ts`, avec une **promesse partagée** : deux appels
  parallèles ne déclenchent qu'un seul rafraîchissement, sinon la rotation invalide la
  famille de jetons et déconnecte l'utilisateur.

### Reste à faire — les onze écrans

Dans l'ordre : catalogue → détail d'une recette → connexion / inscription → avis →
mon compte → back-office (recettes, éditeur, utilisateurs, catégories). L'accueil
existe en version minimale (liste réelle + trois états) ; il reste à l'habiller.

Chaque écran apporte son module d'accès API et ses composants propres : la règle tenue
tout au long du socle est qu'un fichier naît **avec son premier consommateur**, jamais
avant — knip le vérifie.

---

## 6. Déploiement — 0 %

`░░░░░░░░░░░░░░░░░░░░`

Rien : pas d'hébergement choisi, pas de variables de production, pas de nom de domaine.
À traiter en dernier. Le seul point à ne pas oublier le jour venu : `Secure` sur les
cookies impose HTTPS, et `FRONT_ORIGIN` doit pointer le domaine réel, jamais `*`.

---

## Dette et écarts repérés

| Point                                                 | Quoi en faire                     |
| ----------------------------------------------------- | --------------------------------- |
| Note moyenne absente des listes (`routes-api.md` § 5) | trancher : agrégation, jamais N+1 |
| Aucun change OpenSpec ne couvre le front              | à créer avant d'attaquer le lot 5 |
| e2e absents de la CI                                  | voir le lot 4                     |

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

Après chaque écran terminé : cocher les cases du `tasks.md` concerné, mettre à jour la
liste du lot 5, recalculer le pourcentage du lot (écrans faits ÷ 14), puis le global
(somme pondérée du tableau de tête). Et changer la date de « dernière vérification ».
