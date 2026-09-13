## ADDED Requirements

### Requirement: Schéma piloté par migrations, jamais par auto-sync

L'application SHALL configurer TypeORM avec `synchronize: false` dans tous les
environnements, et SHALL appliquer toute évolution du schéma via des migrations
explicites.

#### Scenario: Démarrage sans auto-sync

- **WHEN** l'application démarre dans n'importe quel environnement
- **THEN** elle ne modifie pas automatiquement le schéma ; seules les migrations exécutées le font

### Requirement: Bootstrap depuis le SQL corrigé puis code-first

Le schéma corrigé (`docs/database.sql`) SHALL constituer la migration initiale. À
partir de là, les entités TypeORM SHALL être la source de vérité et les migrations
suivantes SHALL être générées par diff puis relues avant exécution.

#### Scenario: Migration initiale fidèle

- **WHEN** la migration n°1 est appliquée sur une base vierge
- **THEN** le schéma obtenu correspond au `database.sql` corrigé

#### Scenario: Entités alignées sur le bootstrap

- **WHEN** on génère une migration juste après avoir écrit les entités du bootstrap
- **THEN** aucune différence parasite n'est produite (les entités reflètent exactement le schéma initial)

### Requirement: DTO distincts du schéma

Les DTO d'entrée SHALL être écrits à la main pour exprimer le contrat d'API et SHALL
NE PAS exposer les champs sensibles ou internes (`password_hash`, `role` non
sollicité, identifiants techniques).

#### Scenario: DTO de création d'utilisateur sûr

- **WHEN** on définit le DTO de création d'utilisateur
- **THEN** il accepte un mot de passe en clair (à hacher) et n'expose ni `password_hash` ni l'attribution de `role`

### Requirement: Données de référence par seeds

Les données de référence (catégories, nationalités) SHALL être peuplées par des
seeds, distincts des migrations de structure.

#### Scenario: Peuplement initial des catégories

- **WHEN** l'environnement est initialisé
- **THEN** les catégories de référence sont insérées par un seed, pas par une migration de structure
