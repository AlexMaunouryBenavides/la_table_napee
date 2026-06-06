> Pré-requis : outillage qualité en place. Ce change PRÉCÈDE l'authentification
> (`setup-authentification`), qui s'appuie sur `users` et `refresh_token`.
> Posture mentor : chaque entité écrite à la main est l'occasion de comprendre le
> mapping ORM, pas de copier-coller. Le groupe 1 produit un guide à LIRE d'abord.
> Règle transverse : respecter la façon de faire de Nest et de TypeORM (CLI Nest,
> modules, DI ; conventions de migrations/entités TypeORM).

## 1. Comprendre avant de coder

- [ ] 1.1 Créer `docs/guides/couche-donnees.md` expliquant simplement : migrations vs auto-sync (pourquoi `synchronize: false`), le modèle bootstrap → code-first (workflow `migration:generate`/`run`/`revert`), la distinction table ≠ entité ≠ DTO, la composition enrichie = ENTITÉ (pas `@ManyToMany`), les énums en code, seeds vs migrations, les cascades possédé/partagé/anonymisé
- [ ] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Schéma corrigé (fait dans ce change)

- [x] 2.1 Corriger `docs/database.sql` en MySQL natif et fidèle au design
- [ ] 2.2 Relire le schéma corrigé et valider chaque règle (UUID, composition, unicité avis, cascades, refresh_token)

## 3. Configuration TypeORM & migrations

- [ ] 3.1 Configurer la connexion MySQL via `@nestjs/config` (variables d'environnement, jamais en dur)
- [ ] 3.2 Forcer `synchronize: false` dans tous les environnements
- [ ] 3.3 Mettre en place les scripts de migration TypeORM (`generate`, `create`, `run`, `revert`) selon les conventions officielles TypeORM

## 4. Migration initiale (bootstrap)

- [ ] 4.1 Créer la migration n°1 et y porter le DDL du `database.sql` corrigé
- [ ] 4.2 Appliquer sur une base vierge et vérifier le schéma obtenu

## 5. Entités (bootstrap puis possédées) — à la manière de Nest/TypeORM

- [ ] 5.1 Organiser le code en modules Nest par domaine (`nest g module`, `nest g resource`) plutôt qu'en vrac
- [ ] 5.2 Écrire les entités de référence (ingredient, nationality, regime, health_criteria, food_type)
- [ ] 5.3 Écrire `users` (UUID, role, password_hash) et `recipe`
- [ ] 5.4 Écrire `composition` en ENTITÉ (deux `@ManyToOne`, PAS `@ManyToMany`) avec quantity/unit
- [ ] 5.5 Écrire `steps`, `review` (unicité + check note), et les jonctions nues (`@ManyToMany`)
- [ ] 5.6 Écrire `refresh_token` (support auth)
- [ ] 5.7 Vérifier qu'un `migration:generate` « à vide » ne produit AUCUNE diff (entités alignées sur le bootstrap)

## 6. Énumérations applicatives

- [ ] 6.1 Définir les énums en code : `role`, `difficulty`, `recipe_type`, `unit`
- [ ] 6.2 Brancher leur validation (class-validator) là où elles entrent

## 7. Seeds

- [ ] 7.1 Écrire les seeds des données de RÉFÉRENCE en listes fixes (regime, health_criteria, food_type, nationalités) — vraies valeurs métier, PAS de faker
- [ ] 7.2 Installer `@faker-js/faker` (dépendance de dev) pour les données d'EXEMPLE en volume
- [ ] 7.3 Mettre en place l'infrastructure de seed (script idempotent, ordre de dépendances)
- [ ] 7.4 Distinguer clairement seeds (données) et migrations (structure)
- [ ] 7.5 (Le seed de recettes d'exemple via faker = ticket feature F0, s'appuie sur cette infra)

## 8. DTO à la main (≠ colonnes) — validation par DTO + class-validator (façon Nest)

- [ ] 8.1 Écrire les DTO d'entrée par cas d'usage (jamais une copie des colonnes), validés par class-validator + `ValidationPipe`
- [ ] 8.2 Vérifier qu'aucun DTO n'expose `password_hash`, l'attribution de `role`, ni d'identifiant interne sensible

## 9. Vérification

- [ ] 9.1 Tester les contraintes : double avis rejeté, note hors bornes rejetée, ingrédient en double rejeté
- [ ] 9.2 Tester les cascades : suppression recette (cascade), suppression compte (anonymisation), catégorie partagée (RESTRICT)
- [ ] 9.3 Lancer `npm run verify` → vert
