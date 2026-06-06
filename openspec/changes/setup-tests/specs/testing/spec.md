## ADDED Requirements

### Requirement: Tests unitaires des services en isolation

Le projet SHALL permettre de tester la logique métier des services en isolation, avec
des dépendances mockées, sans accès réseau ni base réelle.

#### Scenario: Service testé sans dépendances réelles

- **WHEN** un service est testé unitairement
- **THEN** ses dépendances sont mockées et le test vérifie son comportement sans base ni réseau

### Requirement: Tests e2e des endpoints

Le projet SHALL permettre de tester les endpoints HTTP contre une vraie instance de
l'application (via `supertest`), couvrant validation, statuts et autorisation.

#### Scenario: Endpoint vérifié de bout en bout

- **WHEN** un test e2e appelle un endpoint
- **THEN** il observe le vrai statut HTTP, la validation et les règles d'autorisation appliquées

### Requirement: Base de données de test isolée

Les tests SHALL utiliser une base de données dédiée, configurée par l'environnement,
migrée avant les e2e et remise à zéro entre les exécutions, et SHALL NE JAMAIS
toucher les bases de développement ou de production.

#### Scenario: Aucune contamination des données réelles

- **WHEN** la suite de tests s'exécute
- **THEN** elle agit sur une base de test isolée, jamais sur dev/prod

#### Scenario: État réinitialisé entre exécutions

- **WHEN** une nouvelle exécution démarre
- **THEN** la base de test est dans un état connu, indépendant des exécutions précédentes

### Requirement: Données de test déterministes

Le projet SHALL fournir des factories/fixtures produisant des données valides et
reproductibles pour les tests.

#### Scenario: Données reproductibles

- **WHEN** un test a besoin d'une entité
- **THEN** il l'obtient via une factory/fixture déterministe, sans dépendre d'un état implicite

### Requirement: Tests exécutés en intégration continue

La CI SHALL exécuter la suite de tests en plus de `npm run verify`, et SHALL bloquer
le merge si les tests échouent.

#### Scenario: PR avec test rouge bloquée

- **WHEN** une pull request fait échouer un test
- **THEN** la CI échoue et le merge est bloqué
