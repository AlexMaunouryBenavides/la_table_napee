## Context

Monorepo `recipe/` (npm) avec trois packages : `api/` (NestJS), `client/`
(React Router) et `packages/types/` (types partagés, encore vide). Le code métier
n'est pas commencé. Le développeur est junior et a pour objectif explicite de
**progresser** : écrire un code qui impressionnerait en entretien, fondé sur Clean
Code, DRY, KISS, les conventions REST et les bonnes pratiques NestJS.

Le workflow visé : _écrire le code → lancer une commande de vérification locale
(sans IA) → demander à l'IA une surcouche de revue fondée sur des règles écrites_.
Ce document fige les décisions techniques qui rendent ce workflow possible.

## Goals / Non-Goals

**Goals :**

- Forcer les règles **mesurables** via une chaîne déterministe unique, gratuite,
  à verdict binaire.
- Maximiser la valeur **pédagogique** : préférer les outils standards du marché et
  un niveau de strictesse élevé mais idiomatique.
- Séparer nettement ce qui se **mesure** (machines) de ce qui se **juge** (IA +
  développeur via des règles écrites).
- Préserver la posture **mentor** comme comportement par défaut de l'IA.
- Rendre la configuration **dockerisable plus tard sans réécriture** (12-factor :
  aucune URL/secret en dur).

**Non-Goals :**

- Choix de la couche données (qui possède le schéma : SQL Looping vs entités
  TypeORM) — exploration séparée.
- Mécanisme d'authentification (JWT-cookie vs session, CSRF) — exploration séparée.
- Mise en place effective de Docker / Traefik / déploiement VPS — différée, sans
  dette tant que le 12-factor est respecté.
- Écriture du code métier.

## Decisions

### D1 — ESLint + Prettier plutôt que Biome (ou hybride)

**Choix :** ESLint (flat config) + Prettier + TypeScript. Biome est retiré.

**Pourquoi :** le linting _type-aware_ (qui lit les types pour repérer des bugs,
ex. `no-floating-promises`) est mature et complet côté `typescript-eslint`, alors
qu'il est plus récent/partiel chez Biome. L'écosystème de plugins (Nest, React,
react-hooks, jsx-a11y, import) est plus riche. Et c'est le standard que le
développeur retrouvera en entreprise → valeur d'apprentissage.

**Alternatives écartées :** _Biome seul_ (plus simple/rapide mais type-aware moins
complet, moins formateur) ; _hybride Biome+ESLint_ (puissant mais deux outils à
coordonner, trop de complexité pour un démarrage).

### D2 — Modèle à deux couches : déterministe vs jugement

**Choix :** séparer strictement les règles **mesurables** (machines) des règles de
**jugement** (IA + humain).

**Pourquoi :** chaque type de règle a sa couche. Demander à un linter de juger si un
nom est « bien choisi », ou à l'IA de vérifier l'indentation, est un anti-pattern.
La couche 1 rend un verdict binaire gratuit ; la couche 2 se concentre sur ce qui
demande du jugement (faire une chose, bien nommer, bien abstraire, REST/Nest bien
pensés).

### D3 — Composition de `npm run verify`

**Choix :** `prettier --check` + `eslint` + `tsc --noEmit` + `knip` + `jscpd`.

**Pourquoi :** `eslint` ne voit le code mort que _dans_ un fichier ; `knip` le
détecte à l'échelle du repo (exports/fichiers/dépendances orphelins) — c'est lui qui
tient la promesse « zéro code mort ». `jscpd` couvre le DRY _mécanique_
(copier-coller). La duplication _de concept_ reste du jugement (couche 2).

**Alternatives écartées :** _cœur seul (sans knip)_ — la promesse « pas de code mort »
resterait partielle.

### D4 — Niveau de strictesse : palier 2 + flags pro

**Choix :** `strict: true` + `noUncheckedIndexedAccess`, `noUnusedLocals`,
`noUnusedParameters`, ordre des imports imposé ; règles `typescript-eslint`
strictes + type-aware. Cas NestJS/TypeORM (propriétés de DTO/entités déclarées sans
initialisation) résolu par `nom!: string`, **pas** en désactivant
`strictPropertyInitialization` — on garde la rigueur partout.

**Pourquoi :** vise le niveau « entreprise » sans choisir des flags qui se battent
inutilement avec Nest. Durcir plus tard est plus douloureux qu'assouplir : mieux vaut
démarrer exigeant.

### D5 — Trois lignes de défense, même commande partout

**Choix :** éditeur (VS Code) → hook pre-commit (husky + lint-staged) → CI (GitHub
Actions), tous rejouant le **même** `verify`.

**Pourquoi :** les étages attrapent l'erreur de plus en plus tard mais de plus en
plus fort. Le hook pre-commit est **contournable** (`--no-verify`) → ce n'est PAS la
barrière : la **CI est la vraie barrière** (personne ne merge sans elle). Rejouer la
même commande évite le « ça passe en local mais casse en CI ».

### D6 — husky + lint-staged ; Conventional Commits + commitlint

**Choix :** husky + lint-staged pour le hook ; commitlint + Conventional Commits.

**Pourquoi :** husky/lint-staged est le standard reconnu (et lint-staged ne vérifie
que les fichiers modifiés → rapide). Les Conventional Commits disciplinent
l'historique (signal de sérieux) et débloqueront plus tard le versioning/changelog
auto en CI/CD. _lefthook_ écarté (plus rapide mais moins connu).

### D7 — `CLAUDE.md` mince + `docs/conventions/` à la demande

**Choix :** `CLAUDE.md` ne garde que ce qui est pertinent à **chaque** interaction
(posture mentor, stack, 4 priorités résumées, rappel « lance verify », index). Les
checklists détaillées (`clean-code.md`, `rest.md`, `nest.md`) vivent dans
`docs/conventions/`, lues à la demande, et pointées par l'index.

**Pourquoi :** `CLAUDE.md` est rechargé à chaque message. Au-delà du coût en tokens,
empiler des règles toujours-chargées **dilue l'attention** : chaque règle est moins
bien suivie. « Moins, mais mieux suivi. »

**Alternatives écartées :** _tout dans CLAUDE.md_ (dilution quand ça grossit) ;
_skills auto-chargés_ (plus puissant et natif, mais trop de machinerie pour démarrer —
upgrade possible plus tard).

### D8 — Posture mentor comme comportement par défaut

**Choix :** l'IA n'écrit pas le code par défaut sans explication : elle expose les
options et le « pourquoi », et laisse le développeur décider/corriger. Règle
toujours-chargée, placée en tête de `CLAUDE.md`.

**Pourquoi :** l'objectif du projet est la **progression**, pas la vitesse de
livraison.

### D9 — Respecter la façon de faire des frameworks

**Choix :** coder à la manière de chaque framework (Nest : modules, providers,
injection de dépendances, CLI `nest g`, `ValidationPipe` global, guards ; React
Router v7 / Vite : conventions de fichiers ; TypeORM : entités/migrations). On part
des configs recommandées et on n'AJOUTE que nos règles transverses, sans écraser.

**Pourquoi :** les auteurs des frameworks ont pensé une structure cohérente ; la
respecter rend le code idiomatique, lisible par tout dev du même écosystème, et
recherché en entreprise. Réinventer leur façon de faire = friction et dette.

### D10 — Des guides d'apprentissage dans `docs/guides/`

**Choix :** chaque change produit, en première étape de son exécution, un guide
explicatif (`docs/guides/<sujet>.md`) à lire avant les tâches concrètes. Distinct des
`docs/conventions/` (qui sont des RÈGLES) : les guides EXPLIQUENT les concepts.

**Pourquoi :** beaucoup de nouveautés pour un junior ; comprendre le « pourquoi » et
le « comment » avant d'agir est la condition de la progression visée.

## Risks / Trade-offs

- **jscpd bruyant au début** (DTOs/tests qui se ressemblent comptés comme
  duplication) → calibrer un seuil de taille de bloc + ignorer certains dossiers.
  Principe : quand l'outil parle, ce doit _toujours_ être un vrai problème.
- **`no-magic-numbers` bruyant** → autoriser `0`, `1`, `-1`.
- **ESLint type-aware plus lent** (lit les `tsconfig`) → utiliser `projectService` ;
  en local, lint-staged limite au périmètre des fichiers modifiés.
- **Nest/TypeORM et propriétés non initialisées** → convention `nom!: string`
  documentée, plutôt que désactiver le contrôle.
- **Hook pre-commit contournable** (`--no-verify`) → assumé : la CI est la source de
  vérité, le hook n'est que du confort rapide.
- **CLAUDE.md mince exige de la discipline** (l'IA doit ouvrir le bon doc) → l'index
  en bas de `CLAUDE.md` lui rappelle quel document lire selon le sujet.

## Migration Plan

1. Retirer Biome (dépendance + commande dans `CLAUDE.md`).
2. Poser les configs (tsconfig base, ESLint, Prettier, knip, jscpd) et le script
   `verify`.
3. Lancer `verify` sur le code existant, calibrer les seuils jusqu'à un état vert
   stable.
4. Brancher les trois lignes de défense (éditeur, husky/lint-staged, CI).
5. Réécrire `CLAUDE.md` (mince) + créer `docs/conventions/`.

**Rollback :** changement purement outillage, aucune donnée ni logique métier en
jeu — revenir en arrière = retirer les configs/dépendances ajoutées.

## Open Questions

> Résolues lors de l'exploration du 2026-06-06 :

- ~~Gestionnaire de monorepo~~ → **npm workspaces** confirmé (simple, suffisant,
  pas d'usine à gaz type Turborepo/pnpm pour ce projet).
- ~~Calibrage de `jscpd`~~ → **seuil permissif, "anti-abus"** : on ne chasse que les
  gros copier-coller (ex. blocs ≥ ~50 tokens / plusieurs lignes). Si l'outil crie
  pour peu, on monte le seuil. Coût quasi nul, garde-fou contre les vrais abus.
- ~~Périmètre du `client/`~~ → **on n'écrase aucune règle des frameworks** (Nest, Vite,
  React Router) : on part de leurs configs recommandées et on AJOUTE seulement nos
  règles transversales.
