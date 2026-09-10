## ADDED Requirements

### Requirement: Clé primaire des utilisateurs en UUID

La table `users` SHALL utiliser un identifiant UUID comme clé primaire ; les autres
tables SHALL utiliser un entier auto-incrémenté, sauf `refresh_token` (UUID).

#### Scenario: Identifiant utilisateur non énumérable

- **WHEN** un utilisateur est créé
- **THEN** son identifiant est un UUID, pas un entier séquentiel devinable

### Requirement: Mot de passe stocké haché, sans contrainte d'unicité

La table `users` SHALL stocker uniquement `password_hash` (hash Argon2) et SHALL NE
PAS imposer de contrainte d'unicité sur ce hash.

#### Scenario: Deux utilisateurs, même mot de passe

- **WHEN** deux utilisateurs choisissent le même mot de passe
- **THEN** leurs `password_hash` diffèrent (sel Argon2) et aucune contrainte ne les rejette

### Requirement: Composition enrichie recette-ingrédient

La relation recette⇄ingrédient SHALL être portée par une table `composition` ayant
sa propre clé primaire, une contrainte `UNIQUE(recipe_id, ingredient_id)`, une
quantité décimale (nullable pour « à volonté ») et une unité issue d'une énumération
applicative.

#### Scenario: Quantité et unité portées par le lien

- **WHEN** une recette référence un ingrédient avec « 200 g »
- **THEN** la quantité (200) et l'unité (g) sont stockées sur la ligne de `composition`

#### Scenario: Un ingrédient n'apparaît pas deux fois dans une recette

- **WHEN** on tente d'ajouter deux fois le même ingrédient à la même recette
- **THEN** la contrainte `UNIQUE(recipe_id, ingredient_id)` rejette le doublon

### Requirement: Un seul avis par utilisateur et par recette

La table `review` SHALL imposer `UNIQUE(user_id, recipe_id)` et SHALL contraindre la
note entre 1 et 5 (`CHECK`).

#### Scenario: Double avis rejeté

- **WHEN** un utilisateur tente de laisser un second avis sur une recette déjà notée
- **THEN** la contrainte d'unicité rejette l'opération

#### Scenario: Note hors bornes rejetée

- **WHEN** une note de 0 ou 6 est soumise
- **THEN** la contrainte `CHECK(grade BETWEEN 1 AND 5)` la rejette

### Requirement: Règles de suppression possédé / partagé / anonymisé

Le schéma SHALL appliquer : CASCADE sur les entités possédées (composition, steps,
review, jonctions côté recette) ; SET NULL pour l'anonymisation (review→user,
recipe→author) ; RESTRICT sur les entités partagées (ingredient, nationality,
regime, health_criteria, food_type).

#### Scenario: Suppression d'une recette

- **WHEN** une recette est supprimée
- **THEN** ses compositions, étapes, avis et liens de jonction sont supprimés en cascade, mais aucun ingrédient ni catégorie partagée n'est touché

#### Scenario: Suppression d'un compte

- **WHEN** un utilisateur supprime son compte
- **THEN** ses avis et ses recettes sont anonymisés (`user_id`/`author_id` mis à NULL), pas supprimés

#### Scenario: Catégorie partagée protégée

- **WHEN** on tente de supprimer un ingrédient encore référencé par une recette
- **THEN** la contrainte RESTRICT empêche la suppression

### Requirement: Champs figés exprimés par énumérations applicatives

`difficulty`, `recipe_type` et `composition.unit` SHALL être validés contre des
énumérations définies dans le code (pas du texte libre).

#### Scenario: Valeur d'unité hors énumération rejetée

- **WHEN** une unité absente de l'énumération est soumise
- **THEN** la validation applicative la rejette avant persistance
