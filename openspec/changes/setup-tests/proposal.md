## Why

Ton jalon mi-parcours est une **API testée** avant de passer au front. Pour ça, il
faut un harnais de tests posé une fois : une base de données isolée, des tests
unitaires (services) et de bout en bout (endpoints), des données de test
déterministes. Sans ce socle, « tester » reste flou et manuel ; avec lui, chaque
feature se valide automatiquement et tu avances en confiance.

## What Changes

- **Deux niveaux de tests** : unitaires (services en isolation, dépendances mockées)
  et **e2e** (endpoints via `supertest` contre une vraie app Nest) — la façon Nest.
- **Base de données de test ISOLÉE** (pilotée par l'environnement), migrée avant les
  e2e, remise à zéro entre les exécutions ; ne touche JAMAIS dev/prod.
- **Données de test déterministes** : factories / fixtures réutilisables.
- **Helpers Nest** : `Test.createTestingModule`, app e2e jetable.
- **Intégration CI** : la CI lance les tests EN PLUS de `npm run verify`.
- **Test fumée** initial (1 unit + 1 e2e) pour valider le harnais avant d'écrire les
  tests de features.

## Capabilities

### New Capabilities

- `testing` : la stratégie et le harnais de tests (niveaux, base isolée, données,
  intégration CI) sur lesquels chaque feature s'appuie pour être vérifiée.

### Modified Capabilities

<!-- Aucune capacité de spec existante n'est modifiée. -->

## Impact

- **`api/`** : configuration Jest (unit + e2e), connexion à la base de test,
  utilitaires de test (factories, fixtures, helpers), premiers tests fumée.
- **CI** : `.github/workflows/ci.yml` lance `npm run test` (+ e2e) après `verify`.
- **Dépendances** : Jest est déjà fourni par Nest ; on ajoute `supertest` et
  l'outillage de données de test. `npm run verify` reste séparé (les tests, plus
  lents, ne le ralentissent pas ; la CL lance les deux).
- **Position** : posé après l'auth (de quoi écrire un vrai test fumée), avant les
  features.
