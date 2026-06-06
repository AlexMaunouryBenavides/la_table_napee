## Context

`docs/database.sql` provient de Looping. Une revue a montré qu'il s'écarte du design
(`design/use-cases-recettes.md`) sur plusieurs points structurels et qu'il n'est pas
du MySQL valide. Le modèle de possession du schéma retenu est **C — bootstrap puis
code-first** : le SQL corrigé devient la migration n°1, puis les entités TypeORM
deviennent la seule source vivante.

Ce document fige le schéma cible et la stratégie de migration. Le développeur est
junior et vise un code de niveau professionnel ; les choix privilégient l'intégrité
au niveau base + des patterns transférables.

## Goals / Non-Goals

**Goals :**

- Ré-affirmer les décisions du design sur le schéma (intégrité garantie par la base).
- Fixer une stratégie de migration sans dérive (une seule source vivante).
- Poser les principes durables : DTO ≠ colonnes, énums en code, seeds pour la
  référence.

**Non-Goals :**

- Cache / Redis (exploration future).
- Écriture du code métier (services, controllers).
- Fonctionnalités additives futures (favoris, listes de courses…) — le schéma les
  rend possibles mais ne les implémente pas.

## Decisions

### D1 — Modèle C : bootstrap puis code-first

Le SQL corrigé = migration n°1 ; ensuite les entités sont la source, les migrations
sont **générées par diff** (`migration:generate`) et **relues** avant `run`.
`synchronize: false` partout (en prod surtout : l'auto-sync détruit des données).
Le `database.sql` devient une archive de genèse, plus une source à synchroniser.

**Alternatives écartées :** _code-first pur_ (n'utilise pas le SQL existant) ;
_database-first_ (deux représentations à maintenir → dérive).

### D2 — Composition : jonction enrichie = entité

`composition` porte `quantity` (`DECIMAL(6,2)`, nullable = « à volonté ») et `unit`
(énum). PK **surrogate** `id` + `UNIQUE(recipe_id, ingredient_id)`. En TypeORM :
**pas `@ManyToMany`** mais une entité avec deux `@ManyToOne`. C'est ce qui débloque
les listes de courses (agrégation) et les portions dynamiques (quantité × ratio).

**Alternatives écartées :** _jonction nue_ (perd quantité/unité — le cœur du modèle) ;
_PK composite_ (interdit le même ingrédient 2×, plus lourde en ORM).

### D3 — Unité en énum applicative

`unit` est une énum figée dans le code (comme `difficulty`/`recipe_type`, design
l.90), pas du texte libre. Raison : la cohérence est la condition de l'agrégation
future (200 « g » + 1 « kg » impossible si l'unité est libre).

**Alternative écartée :** _table UNITE_ (extensible mais une table de plus, prématuré).

### D4 — UUID pour `users`, entiers ailleurs

`users.id` = `CHAR(36)` (UUID, anti-énumération, design l.88) ; le reste en
`INT AUTO_INCREMENT` (jointures performantes). `refresh_token` en UUID aussi.

### D5 — Règles d'intégrité ré-affirmées

- `UNIQUE(user_id, recipe_id)` sur `review` + `CHECK(grade BETWEEN 1 AND 5)` (UC-06).
- `password_hash` **sans** `UNIQUE` (Argon2 hash déjà unique ; contrainte non-sens).
- `email`, `nickname`, `title`, `name` (référence) en `UNIQUE`.

### D6 — Cascades : possédé vs partagé

```
   possédé (meurt avec le parent)   → ON DELETE CASCADE
     composition, steps, review, jonctions (côté recette)
   anonymisation                    → ON DELETE SET NULL
     review→user (UC-09b), recipe→author
   partagé (survit)                 → ON DELETE RESTRICT
     ingredient, nationality, regime, health_criteria, food_type
```

La cascade ne traverse jamais une entité partagée (design l.113).

### D7 — DTO écrits à la main (≠ colonnes)

Les DTO ne sont PAS générés depuis le schéma : ils encodent le **contrat d'API**
(ce que le client a le droit d'envoyer), pas le stockage. Ex. `CreateUserDto` reçoit
un mot de passe en clair (jamais en base) et n'expose jamais `password_hash` ni
`role`. Sécurité n°2 du projet (ne pas faire confiance au client).

### D8 — Seeds : données de référence FIXES vs données d'exemple via faker.js

Deux natures de seeds à ne pas confondre :

- **Données de référence** (regime, health_criteria, food_type, nationality) :
  valeurs réelles du domaine, listes **fixes** écrites à la main (« Vegan »,
  « Halal », « Italienne »…). Pas de faker : ce sont de vraies valeurs métier.
- **Données d'exemple en volume** (recettes, utilisateurs pour tester la lecture) :
  générées avec **`@faker-js/faker`** (https://fakerjs.dev) pour obtenir du volume
  réaliste (titres, descriptions, quantités, emails…).

Les seeds restent distincts des migrations (données ≠ structure). `@faker-js/faker`
est une dépendance de développement uniquement.

**Pourquoi faker :** générer à la main des dizaines de recettes serait fastidieux et
peu réaliste ; faker donne du volume crédible pour valider lecture, recherche et
pagination.

## Risks / Trade-offs

- **Bootstrap mal aligné** (entités ≠ migration n°1) → la prochaine
  `migration:generate` produirait un correctif parasite. Mitigation : écrire les
  entités pour coller exactement au SQL corrigé, vérifier qu'un `generate` à vide ne
  produit rien.
- **`synchronize: true` tentant en dev** → interdit en prod ; à n'utiliser, si
  vraiment, que sur une base jetable locale. Mitigation : migrations dès le départ.
- **Énums en code** → ajouter une valeur = redéploiement. Accepté (stabilité voulue).
- **CHECK MySQL** → nécessite MySQL ≥ 8.0.16 et moteur InnoDB. Mitigation : fixer le
  moteur/charset explicitement (InnoDB, utf8mb4).

## Migration Plan

1. Corriger `docs/database.sql` (fait dans ce change).
2. En faire la migration n°1 (créer la migration, y placer le DDL).
3. Écrire les entités TypeORM alignées sur ce schéma (`synchronize: false`).
4. Vérifier qu'un `migration:generate` « à vide » ne produit aucune diff.
5. Seeds des données de référence.
6. DTO à la main, par cas d'usage.

**Rollback :** `migration:revert` pour la structure ; `database.sql` reste l'archive
de référence.

## Open Questions

- UUID stocké en `CHAR(36)` (lisible) vs `BINARY(16)` (compact) — `CHAR(36)` retenu
  par défaut pour la lisibilité au démarrage ; à reconsidérer si volume.
- `synchronize` en dev : migrations dès le début (retenu) vs sync sur base jetable.
- Valeurs exactes des énums (`role`, `difficulty`, `recipe_type`, `unit`) à figer
  côté code.
- `UNIQUE(recipe_id, number)` sur `steps` (ajout de confort, à confirmer).
