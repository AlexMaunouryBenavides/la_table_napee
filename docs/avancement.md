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
> **Dernière vérification : 2026-09-13** — branche `setup-authentification` poussée,
> PR #3 ouverte, CI verte (`verify` + e2e). Les 14 écrans **fonctionnent** mais l'audit
> contre les maquettes a montré qu'**aucun n'est conforme** : reprise visuelle en cours,
> suivie dans `docs/ecarts-maquettes.md`.
>
> Les RÈGLES d'ingénierie vivent maintenant dans `eng-kit/` (dépôt séparé, ignoré ici) :
> `docs/conventions/` et `docs/guides/` ont été supprimés.

---

## Vue d'ensemble

```
GLOBAL   ██████████████████░░   90 %
```

| Lot                                        | Poids | Avancement | Barre                  |
| ------------------------------------------ | ----: | ---------: | ---------------------- |
| 1. Conception                              |  10 % |      100 % | `████████████████████` |
| 2. Mise en place (socle)                   |  30 % |      100 % | `████████████████████` |
| 3. Features API (les 37 routes du contrat) |  25 % |      100 % | `████████████████████` |
| 4. Tests                                   |  10 % |       95 % | `███████████████████░` |
| 5. Front                                   |  20 % |       80 % | `████████████████░░░░` |
| 6. Déploiement                             |   5 % |        0 % | `░░░░░░░░░░░░░░░░░░░░` |

Les poids sont un jugement, pas une science : ils disent seulement que le front pèse
autant qu'un quart du back. Le global en découle (somme pondérée).

**En une phrase** : le back est terminé et testé en CI ; le front fonctionne mais doit
être remis en conformité avec les maquettes ; le déploiement n'a pas commencé.

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

| Étape                                    | État | Preuve                                              |
| ---------------------------------------- | ---- | --------------------------------------------------- |
| Monorepo npm (workspaces)                | ✅   | `package.json`                                      |
| Outillage qualité (`npm run verify`)     | ✅   | change archivé `setup-outillage-qualite`            |
| Fondations transverses API               | ✅   | change archivé `setup-fondations-api`               |
| Base MySQL + docker                      | ✅   | `api/docker-compose.yml`, `api/src/config/`         |
| CI GitHub Actions                        | ✅   | `.github/workflows/ci.yml` (verify, tests, e2e)     |
| Entités TypeORM                          | ✅   | `api/src/*/entities/`                               |
| Migration initiale (DDL → migration n°1) | ✅   | `api/src/migrations/1786718528873-SchemaInitial.ts` |
| Seeds de RÉFÉRENCE                       | ✅   | `api/src/seeds/donnees-reference.ts`                |
| Seeds d'EXEMPLE (volume)                 | ✅   | `npm run seed:exemples` (faker, idempotent)         |
| Comptes d'exemple (un par rôle)          | ✅   | `admin@exemple.test` etc., mdp `Password123!`       |
| Authentification & rôles                 | ✅   | `api/src/auth/` — détail ci-dessous                 |

### 2.a Authentification — 37/37, change archivé

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

Le groupe 11 (le front de l'auth) est clos depuis les écrans de connexion et
d'inscription : formulaires, appels en `credentials: 'include'` sans **aucun** jeton en
JS, refresh transparent sur 401. Le change est archivé
(`openspec/changes/archive/2026-09-11-setup-authentification`).

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

## 4. Tests — 95 %

`███████████████████░`

| Élément                                               | État |
| ----------------------------------------------------- | ---- |
| Jest unitaire (`npm test`) — 17 tests, 5 suites, vert | ✅   |
| Vitest côté client — 214 tests, 38 fichiers, vert     | ✅   |
| Jest e2e (`npm run test:e2e`) + supertest             | ✅   |
| Base de test isolée + garde-fou anti-écrasement       | ✅   |
| Helpers (`test/app-de-test.ts`, `test/aide-auth.ts`)  | ✅   |
| 15 fichiers e2e — 117 tests, vert (sérialisés)        | ✅   |
| Factories / fixtures (`test/fixtures.ts`)             | ✅   |
| Tests sur toutes les features API                     | ✅   |
| e2e dans la CI (job `e2e`, MySQL jetable)             | ✅   |
| Guide de tests (`setup-tests` 1.1 / 1.2)              | ❌   |

**e2e dans la CI** (2026-09-13) : job `e2e` après `verify`, MySQL 8.4 en service,
`JWT_SECRET` tiré au hasard à chaque exécution. Pas de protection de branche GitHub
(6.2) : décision de tenir la barrière **avant chaque push** (verify + tests + e2e en
local). Au passage, `verify` lance désormais `typecheck` avant `lint` : sans les types
générés par `react-router typegen`, le lint échouait en CI alors qu'il passait en local.

**Reste** : le guide de tests, optionnel — l'infra s'imite par l'exemple.

---

## 5. Front — 80 %

`████████████████░░░░`

> **Conformité aux maquettes : à reprendre.** Les 14 écrans fonctionnent et sont testés,
> mais l'audit du 2026-09-13 (chaque écran comparé à sa planche) les montre tous
> simplifiés : en-tête, cartes, barres d'outils, tableaux. Liste écran par écran et
> suivi : **`docs/ecarts-maquettes.md`**. Les 20 % restants du lot, c'est ce travail.

Le change **`setup-front`** (57/57) est archivé : il a posé le socle. Depuis, **onze
écrans réels** ont été écrits par-dessus. 214 tests côté client, `npm run verify` vert,
et chaque écran vérifié dans un vrai navigateur avant d'être commité — c'est là que se
sont trouvés la plupart des défauts corrigés en chemin.

### Le socle

| Brique                                          | Où                                       |
| ----------------------------------------------- | ---------------------------------------- |
| Harnais Vitest + Testing Library                | `client/vite.config.ts`, `client/test/`  |
| Les 43 tokens du handoff en `@theme`            | `client/app/app.css`                     |
| Polices auto-hébergées (`@fontsource`)          | pas de requête tierce                    |
| Couche d'accès API unique + refresh transparent | `client/app/acces-api/`                  |
| Session et rôles depuis le serveur              | `root.tsx`, `session-courante.ts`        |
| Composants partagés (13)                        | `client/app/composants/`                 |
| Trois coquilles, nav construite depuis le rôle  | `client/app/coquilles/`                  |
| Ossature des 14 routes                          | `client/app/routes.ts`                   |
| Écrans système 404 / 403 / 500                  | `composants/page-impasse.tsx` et voisins |

### Les écrans

| #   | Écran                  | État | Où                                                    |
| --- | ---------------------- | ---- | ----------------------------------------------------- |
| 1   | Accueil                | ✅   | `routes/accueil.tsx` + `app/accueil/`                 |
| 2   | Catalogue              | ✅   | `routes/catalogue.tsx` + `app/catalogue/`             |
| 3   | Détail d'une recette   | ✅   | `routes/detail-recette.tsx` + `app/recette/`          |
| 4   | Connexion              | ✅   | `routes/connexion.tsx` + `app/auth/`                  |
| 5   | Inscription            | ✅   | `routes/inscription.tsx` + `app/auth/`                |
| 6   | Mon compte             | ✅   | `routes/mon-compte.tsx` + `app/compte/`               |
| 7   | Panneau — accueil      | ✅   | `routes/panneau/accueil.tsx` + `app/panneau/`         |
| 8   | Panneau — recettes     | ✅   | `routes/panneau/recettes.tsx` + `app/panneau/`        |
| 9   | Panneau — éditeur      | ✅   | `routes/panneau/editeur-recette.tsx` + `app/panneau/` |
| 10  | Panneau — utilisateurs | ✅   | `routes/panneau/utilisateurs.tsx`                     |
| 11  | Panneau — catégories   | ✅   | `routes/panneau/categories.tsx`                       |
| 12  | 404                    | ✅   | `routes/introuvable.tsx`                              |
| 13  | 403 · 14. Erreur       | ✅   | `ErrorBoundary` de segment, pas des destinations      |

Le catalogue porte **huit filtres**, tous dans l'URL (recherche débattue comprise) : un
lien de résultats se partage et le retour arrière fonctionne. Le détail d'une recette
inclut le dépôt d'un avis et sa modération, droits calculés côté client à partir de la
session — la vérité restant, elle, côté API. « Mon compte » porte **trois formulaires
indépendants** (profil, mot de passe, suppression) aiguillés par un champ `intention` :
un échec sur l'un n'efface pas la saisie des deux autres.

Le back-office ne montre **aucune statistique venant d'une route interdite au rôle** :
un modérateur ne demande pas `GET /utilisateurs`, il ne voit simplement pas la tuile.
La liste de gestion donne un `useFetcher` par ligne — « Suppression… » puis, en cas
d'échec, un message sur SA ligne, sans recharger la page ni toucher aux autres.

Le back-office **ne promet rien que l'API ne tienne** : pas de recherche sur les
comptes ni de compteurs par rôle (`GET /utilisateurs` ne prend que `page` et `limite`),
pas de « recettes rattachées » sur une catégorie. Les refus métier — dernier
administrateur, auto-rétrogradation, catégorie encore utilisée — s'affichent à
l'endroit de l'action, avec leur chemin de sortie quand il en existe un.

L'éditeur est **un seul formulaire pour créer et modifier** : toute sa logique vit dans
`brouillon-recette.ts` (brouillon → corps de requête), testable sans rendu. Le numéro
d'une étape vient de sa POSITION, jamais d'une saisie. Trois promesses de la maquette
sont tombées faute de route : quantité en texte libre (l'API veut un nombre positif),
`POST /ingredients` (qui n'existe pas — un ingrédient inconnu naît à l'enregistrement,
par « trouver ou créer »), et le téléversement d'image (l'API attend une URL).

### Décisions structurantes

- **SPA (`ssr: false`)** : l'auth passe par cookie `httpOnly` sur une autre origine.
  Dans le navigateur, `credentials: 'include'` suffit ; en SSR il aurait fallu relayer
  chaque `Set-Cookie`, rotation comprise. Le SEO se rattrapera par `prerender`.
- **Pas de react-query** : les `clientLoader` tiennent l'état serveur. Si un état
  transverse apparaît un jour, ce sera **Zustand**.
- Le refresh vit dans `appeler-api.ts`, avec une **promesse partagée** : deux appels
  parallèles ne déclenchent qu'un seul rafraîchissement, sinon la rotation invalide la
  famille de jetons et déconnecte l'utilisateur.
- **L'URL est la source de vérité des critères de liste** (`acces-api/criteres-url.ts`) :
  aucun état de filtre en mémoire, changer un filtre ramène page 1.

### Reste à faire

La mise en conformité visuelle, en trois lots (composants partagés, écrans publics,
panneau et erreurs) — voir `docs/ecarts-maquettes.md`. Travail purement visuel : pas de
nouveaux tests, les existants restent verts.

Chaque écran apporte son module d'accès API et ses composants propres : la règle tenue
tout au long est qu'un fichier naît **avec son premier consommateur**, jamais avant —
knip le vérifie. Un dossier par écran (`app/catalogue/`, `app/recette/`, `app/auth/`)
pour la logique testable, le fichier de `routes/` restant mince.

---

## 6. Déploiement — 0 %

`░░░░░░░░░░░░░░░░░░░░`

Rien : pas d'hébergement choisi, pas de variables de production, pas de nom de domaine.
À traiter en dernier. Le seul point à ne pas oublier le jour venu : `Secure` sur les
cookies impose HTTPS, et `FRONT_ORIGIN` doit pointer le domaine réel, jamais `*`.

---

## Dette et écarts repérés

| Point                                          | Quoi en faire                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Écrans non conformes aux maquettes             | voir `docs/ecarts-maquettes.md`                                                                                                                                                                                               |
| Rien ne garde `@recipe/types` aligné sur l'API | un e2e affirmant la forme de `GET /recettes/:id` ; la dérive découverte le 2026-09-11 n'avait été révélée par rien                                                                                                            |
| Changement de mot de passe : doc ≠ code        | `routes-api.md` § 3.4 annonce que les sessions en cours sont invalidées ; `utilisateurs.service.ts` ne révoque rien. L'écran 6 dit « votre session reste active » (le code fait foi). Trancher : révoquer, ou corriger la doc |

### Reporté sciemment (décidé, pas oublié)

| Point                                                              | Raison                                                                 |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Anti-bruteforce **par compte** (`authentication.r2`)               | le throttler par IP couvre partiellement ; demande une colonne en base |
| `code` stable + `requestId` dans les erreurs (`error-handling.r7`) | la forme d'erreur est figée par `routes-api.md`, changement à assumer  |
| Protection de branche GitHub, et tout le CD                        | vérification locale avant chaque push ; déploiement en dernier         |
| Versionnement d'URL, HATEOAS (`api-design.r11`, `r12`)             | sur-ingénierie pour un projet personnel                                |
| Favoris                                                            | reporté par le design, purement additif                                |

---

## Comment mettre à jour ce fichier

Après chaque écran terminé : cocher les cases du `tasks.md` concerné, mettre à jour la
liste du lot 5, recalculer le pourcentage du lot (écrans faits ÷ 14), puis le global
(somme pondérée du tableau de tête). Et changer la date de « dernière vérification ».
