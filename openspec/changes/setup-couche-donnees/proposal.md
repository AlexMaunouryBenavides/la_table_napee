## Why

Le fichier `docs/database.sql` exporté par Looping est un **squelette générique** :
il est écrit dans un dialecte non-MySQL (`COUNTER`) et il a **perdu plusieurs
décisions** documentées dans `design/use-cases-recettes.md` (UUID utilisateur,
composition enrichie, unicité des avis, règles de cascade, énums). Il faut le
corriger AVANT qu'il ne devienne la première migration, puis fixer la stratégie de
migration pour la suite — sinon on bootstrap une erreur et on accumule de la dette.

## What Changes

- **Corriger `docs/database.sql`** en MySQL natif et fidèle au design :
  - `COUNTER` → `INT AUTO_INCREMENT` ; suppression de `UNIQUE(password)` (invalide
    sur TEXT + non-sens avec Argon2).
  - **`user_` → `users`** : clé **UUID** (`CHAR(36)`), `password` → `password_hash`
    (`VARCHAR(255)`), `role` (énum applicative).
  - **`ingredient_recipe` → `composition`** : jonction **enrichie** portant
    `quantity` (`DECIMAL`, nullable = « à volonté ») et `unit` (énum), `id`
    surrogate + `UNIQUE(recipe_id, ingredient_id)`.
  - **`review`** : `UNIQUE(user_id, recipe_id)` (1 avis par paire) + `CHECK(grade
    BETWEEN 1 AND 5)`.
  - **Règles `ON DELETE`** : CASCADE sur les entités possédées (composition, steps,
    review, jonctions côté recette) ; SET NULL pour l'anonymisation (review→user,
    recipe→author) ; RESTRICT pour les entités partagées (ingredient, catégories,
    nationality).
  - **Lisibilité** : FK `id_1/id_2` → `author_id`, `nationality_id`, `user_id`,
    `recipe_id` ; cohérence EN + snake_case (`title`, pas `titre`).
- **Ajouter la table `refresh_token`** (support de l'authentification).
- **Fixer la stratégie de migration** : modèle **C** (bootstrap depuis le SQL
  corrigé → puis code-first), `synchronize: false` partout.
- **Établir les principes dérivés** : DTO écrits à la main (≠ colonnes), énums en
  code (difficulty / recipe_type / unit), **seeds** pour les données de référence.
- **Guide d'apprentissage** `docs/guides/couche-donnees.md` créé en premier (à lire
  avant), et code écrit à la manière de Nest/TypeORM (modules, CLI, DI, migrations).

## Capabilities

### New Capabilities

- `data-schema` : l'intégrité du modèle (clés, unicité, cascades, types, énums) —
  ce que la base GARANTIT structurellement.
- `data-migrations` : la stratégie de gestion du schéma dans le temps (bootstrap,
  code-first, `synchronize: false`, seeds, entités vs DTO).

### Modified Capabilities

<!-- Aucune capacité de spec existante n'est modifiée. -->

## Impact

- **`docs/database.sql`** réécrit (source de la migration n°1).
- **`api/`** : entités TypeORM (bootstrap puis possédées à la main), migrations,
  seeds des catégories, DTO écrits à la main par cas d'usage.
- **Dépendances** : ce change précède l'authentification (qui s'appuie sur `users`
  et `refresh_token`). N'inclut PAS le cache Redis (exploration future).
- **Cohérence** : aligne le schéma sur `design/use-cases-recettes.md` (la doc
  fonctionnelle reste la référence du « pourquoi »).
