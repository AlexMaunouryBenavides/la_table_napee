## Context

Jest est fourni par défaut avec NestJS. Il manque la **stratégie** : quels niveaux
de tests, comment isoler la base, comment produire des données déterministes, et
comment la CI les exécute. L'objectif est un harnais qui rend chaque feature
vérifiable, posé avant de coder les features.

## Goals / Non-Goals

**Goals :**

- Deux niveaux clairs : unitaire (logique métier isolée) et e2e (contrat HTTP réel).
- Isolation totale de la base de test (jamais dev/prod).
- Tests déterministes et répétables (données maîtrisées, reset entre runs).
- Façon Nest : `Test.createTestingModule`, `supertest` pour les e2e.

**Non-Goals :**

- Tests des features (écrits ensuite, par feature).
- Tests de charge / performance.
- Couverture imposée stricte d'emblée (à introduire progressivement).

## Decisions

### D1 — Deux niveaux : unitaire + e2e

Unitaire : services testés en isolation, dépendances mockées → vérifie la logique
métier vite. E2e : endpoints testés via `supertest` contre une vraie app Nest →
vérifie le contrat HTTP (validation, statuts, autorisation). Raison : les deux se
complètent ; l'un est rapide, l'autre fidèle.

### D2 — Base de données de test isolée

Une base MySQL dédiée aux tests, configurée par l'environnement, migrée avant les
e2e, remise à zéro entre les runs (truncate/recreate). Raison : fidélité au vrai
moteur (MySQL, contraintes, cascades) sans jamais risquer les données réelles.

**Alternatives considérées :** _SQLite en mémoire_ (rapide mais infidèle : pas les
mêmes contraintes/cascades que MySQL) ; _testcontainers_ (très propre, isolément
total, mais plus lourd → upgrade futur possible).

### D3 — Données déterministes via factories/fixtures

Des factories construisent des entités valides paramétrables ; des fixtures posent
des jeux de données connus. Raison : des tests lisibles et stables, pas de dépendance
à un état implicite.

### D4 — `verify` et `test` séparés, CI lance les deux

`npm run verify` (rapide : format/lint/types/code mort/duplication) reste distinct de
`npm run test` (plus lent). La CI exécute `verify` PUIS les tests. Raison : garder la
boucle locale rapide tout en barrant le merge sur l'un comme sur l'autre.

### D5 — Couverture introduite progressivement

Pas de seuil bloquant d'emblée ; on mesure d'abord, on impose un seuil raisonnable
plus tard. Raison : éviter la friction prématurée (priorité « pas d'optim anticipée »).

## Risks / Trade-offs

- **Base de test mal isolée** → risque sur des données réelles. Mitigation : URL de
  test distincte, vérification explicite, jamais la même base que dev/prod.
- **E2e lents/instables** → garder un cœur d'e2e ciblé, mocker l'extérieur, reset
  fiable entre runs.
- **Sur-mock en unitaire** → tester un comportement réel, pas l'implémentation.
- **Données de test divergentes du schéma** → factories construites sur les entités
  réelles.

## Migration Plan

1. Configurer Jest (profils unit + e2e).
2. Base de test isolée + application des migrations + reset.
3. Utilitaires : factories, fixtures, helpers Nest/supertest.
4. Premier test fumée (1 unit + 1 e2e) pour valider le harnais.
5. Brancher la CI (tests après `verify`).

**Rollback :** outillage de test additif ; retrait = enlever configs/dépendances de
test.

## Open Questions

- Reset entre runs : truncate ciblé vs recréation complète du schéma ?
- Passer à `testcontainers` plus tard pour une isolation par conteneur ?
- Seuil de couverture cible (et à partir de quand l'imposer) ?
