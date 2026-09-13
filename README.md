# La Table Nappée

Site de recettes de cuisine : catalogue public filtrable, avis, compte utilisateur, et
panneau d'administration (recettes, comptes, catégories) selon le rôle.

| Partie          | Techno                                                              | Dossier          |
| --------------- | ------------------------------------------------------------------- | ---------------- |
| API             | NestJS, TypeORM, MySQL 8.4, JWT en cookies `httpOnly`, Argon2       | `api/`           |
| Front           | React 19, React Router 7 (SPA), TanStack Query, Zustand, Tailwind 4 | `client/`        |
| Types partagés  | TypeScript                                                          | `packages/types` |
| Base de données | MySQL dans Docker                                                   | `api/docker-*`   |
| Tests           | Jest + supertest (API), Vitest + Testing Library (front), Cypress   | —                |
| Qualité / CI    | ESLint, Prettier, tsc, knip, jscpd — GitHub Actions                 | `.github/`       |

---

## 1. Prérequis (à installer une fois)

| Outil              | Version conseillée | Vérifier avec      |
| ------------------ | ------------------ | ------------------ |
| **Git**            | récente            | `git --version`    |
| **Node.js**        | 22 LTS ou plus     | `node --version`   |
| **npm**            | fourni avec Node   | `npm --version`    |
| **Docker Desktop** | récente            | `docker --version` |

> Sous Windows, **Docker Desktop doit être lancé** (icône de la baleine « running »)
> avant toute commande `docker`. Sans lui : `error during connect … pipe/docker_engine`.

---

## 2. Récupérer le projet

```bash
git clone https://github.com/AlexMaunouryBenavides/la_table_napee.git
cd la_table_napee
git checkout setup-authentification   # la branche de travail en cours
```

Facultatif, pour travailler avec Claude Code : la bibliothèque de règles `eng-kit/` est
un **dépôt séparé**, ignoré par git. Clone-la à la racine du projet :

```bash
git clone https://github.com/AlexMaunouryBenavides/kit-ia.git eng-kit
```

---

## 3. Installer les dépendances

Une seule commande, **à la racine** : c'est un monorepo npm (workspaces), elle installe
`api/`, `client/` et `packages/types` d'un coup.

```bash
npm ci
```

Elle installe aussi les hooks git (husky) et télécharge le binaire de Cypress
(quelques centaines de Mo, une seule fois par machine).

---

## 4. Configurer l'environnement

### 4.1 API — `api/.env` (obligatoire)

```bash
cp api/.env.example api/.env
```

Puis ouvre `api/.env` et remplace **au minimum** :

| Variable           | Quoi mettre                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| `DB_PASSWORD`      | un mot de passe de ton choix (il sert aussi de mot de passe root du conteneur) |
| `JWT_SECRET`       | une valeur aléatoire de 32 caractères minimum (commande ci-dessous)            |
| `DB_DATABASE`      | laisse `recipe`                                                                |
| `DB_DATABASE_TEST` | laisse `recipe_test` — **doit valoir `DB_DATABASE` suivi de `_test`**          |

Générer un `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> ⚠️ Choisis `DB_PASSWORD` **avant** le premier `docker compose up`. MySQL ne lit ces
> valeurs qu'à la création du volume : les changer ensuite n'a aucun effet (voir §9).

### 4.2 Front — `client/.env` (facultatif)

```bash
cp client/.env.example client/.env
```

La valeur par défaut (`VITE_URL_API=http://localhost:3000/api`) convient tant que l'API
tourne sur le port 3000. Rien de secret ici : tout ce qui commence par `VITE_` part dans
le navigateur.

---

## 5. Démarrer la base de données (Docker)

```bash
docker compose -f api/docker-compose.yml up -d --wait
```

- Lance **MySQL 8.4** sur le port `3306`, données gardées dans un volume Docker.
- Au **tout premier démarrage**, le script `api/docker/init-base-de-test.sh` crée aussi
  la base de test `recipe_test` : les tests e2e et Cypress la vident, jamais la base
  de développement.
- `--wait` rend la main quand MySQL est prêt (état `healthy`).

Vérifier : `docker compose -f api/docker-compose.yml ps` → `db` en `healthy`.

---

## 6. Préparer les bases (une fois, puis à chaque nouvelle migration)

```bash
# Base de DÉVELOPPEMENT : tables, données de référence, 3 comptes et 50 recettes
npm run migration:run --workspace api
npm run seed:exemples --workspace api

# Base de TEST : tables (nécessaire pour les tests e2e et Cypress)
npm run migration:run:test --workspace api
```

`seed:exemples` est idempotent (le relancer ne duplique rien) et affiche les comptes :

| Rôle        | E-mail                     | Mot de passe   |
| ----------- | -------------------------- | -------------- |
| admin       | `admin@exemple.test`       | `Password123!` |
| modérateur  | `moderateur@exemple.test`  | `Password123!` |
| utilisateur | `utilisateur@exemple.test` | `Password123!` |

> `npm run seed --workspace api` pose **uniquement** les données de référence
> (régimes, nationalités…), sans comptes ni recettes.

---

## 7. Lancer l'application (deux terminaux)

**Terminal 1 — API** (http://localhost:3000/api, rechargement à chaud) :

```bash
npm run start:dev --workspace api
```

**Terminal 2 — Front** (http://localhost:5173) :

```bash
npm run dev --workspace client
```

Ouvre **http://localhost:5173**, connecte-toi avec `admin@exemple.test` /
`Password123!` : le panneau est sous **/panneau**.

---

## 8. Tests et qualité

| Commande (à la racine)             | Ce qu'elle fait                                              | Prérequis                     |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `npm run verify`                   | format, types, lint, code mort (knip), copier-coller (jscpd) | —                             |
| `npm test`                         | tests unitaires API (Jest) + front (Vitest)                  | —                             |
| `npm run test:e2e --workspace api` | tests e2e de l'API sur `recipe_test` (Jest + supertest)      | MySQL lancé + migrations test |
| `npm run cypress:prepare`          | migre et sème la base de test pour Cypress                   | MySQL lancé                   |
| `npm run test:cypress`             | parcours Cypress sur le vrai front et la vraie API           | `cypress:prepare` fait        |

Cypress démarre **lui-même** une API (port 3100) et un front (port 5174) branchés sur
la base de test : il ne touche ni à ta base de développement ni aux serveurs des
terminaux 1 et 2, qui peuvent rester ouverts. Pour voir les parcours s'exécuter dans
une fenêtre : lance `npm run cypress:api` et `npm run cypress:client` dans deux
terminaux, puis `npm run cypress:open --workspace client`.

**Avant chaque `git push`** : `npm run verify`, `npm test` et
`npm run test:e2e --workspace api` doivent être verts (la CI rejoue les mêmes).

---

## 9. En cas de problème

| Symptôme                                                       | Cause probable → solution                                                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `error during connect` / `docker_engine`                       | Docker Desktop n'est pas lancé → le démarrer, attendre « running ».                                                                            |
| `Access denied for user 'recipe'`                              | `DB_PASSWORD` changé après la création du volume → `docker compose -f api/docker-compose.yml down -v` (**efface les données**), puis §5 et §6. |
| `Unknown database 'recipe_test'`                               | volume créé avant le script d'init → même remède (`down -v`), ou créer la base à la main.                                                      |
| `EADDRINUSE :::3000` au démarrage de l'API                     | une ancienne API tourne encore → fermer l'autre terminal, ou arrêter le processus qui écoute sur 3000.                                         |
| Port `3306` déjà pris                                          | un MySQL local tourne déjà → l'arrêter, ou mettre `DB_PORT=3307` dans `api/.env` (puis relancer §5).                                           |
| Le site affiche « Quelque chose s'est mal passé »              | l'API ne répond pas → vérifier le terminal 1 et que MySQL est `healthy`.                                                                       |
| `Configuration d'environnement invalide` au démarrage de l'API | une variable manque ou est trop courte dans `api/.env` (souvent `JWT_SECRET` < 32 caractères).                                                 |
| Tests e2e : « DB_DATABASE_TEST n'est pas défini »              | ajouter `DB_DATABASE_TEST=recipe_test` dans `api/.env`, puis `npm run migration:run:test --workspace api`.                                     |

Arrêter la base : `docker compose -f api/docker-compose.yml down` (les données restent).
Tout remettre à zéro : `down -v`, puis reprendre au §5.

---

## 10. Pour aller plus loin

- `docs/avancement.md` — où en est le projet, fait / reste à faire.
- `design/routes-api.md` — le contrat de l'API ; `design/use-cases-recettes.md` — les cas d'usage.
- `CLAUDE.md` — la méthode de travail (TDD, vérifications, conventions).
- **Hors dépôt, à copier à la main d'un ordinateur à l'autre** : `api/.env` (ou le
  recréer), le dossier des maquettes `design_handoff_la_table_nappee/`, et les documents
  personnels de `docs/` qui ne sont pas versionnés.
