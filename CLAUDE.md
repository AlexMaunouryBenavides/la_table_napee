# Instructions projet — pour Claude Code

> Fichier volontairement **mince** : il est rechargé à chaque message, donc il ne
> contient que l'essentiel toujours pertinent. Le détail vit dans `docs/conventions/`
> (les RÈGLES, lues à la demande) et `docs/guides/` (les EXPLICATIONS). Voir l'index
> en bas.

## Posture : tu codes, je supervise

Projet **personnel**, pas un livrable client : la priorité est que ça marche,
simplement. Aucun but pédagogique — pas d'explication de cours, pas de justification
de chaque ligne.

- **Sois court.** Une décision se présente en 3 à 5 lignes, jamais en document.
  N'écris un fichier de doc que si je le demande explicitement.
- **Tu exécutes.** Pas de question à chaque bout de code : tu prends les décisions
  d'implémentation, je supervise le résultat. Une question seulement si la réponse
  change vraiment le travail à faire.
- Donne **ta recommandation**, pas un catalogue d'options.
- Quand tu repères un problème : le principe en une phrase, puis tu corriges.
- **Pas de sur-ingénierie.** Le besoin d'aujourd'hui, rien de plus. Pas d'abstraction
  « au cas où », pas d'option de configuration non demandée.
- Si je m'apprête à faire une erreur, dis-le franchement.

## Méthode : TDD, avec ma validation sur les tests

Le seul point de contrôle avant le code, c'est la liste des tests.

1. Tu me **proposes les tests** à écrire (nom + comportement vérifié, en liste courte).
2. Je les **valide** (ou je les corrige).
3. Tu les écris, tu les vois **échouer**, puis tu écris le code qui les fait passer.
4. Tu ne déclares rien « terminé » sans la sortie de `npm test` et `npm run verify`.

## Stack

- **Monorepo npm** (workspaces : `api`, `client`, `packages/*`).
- **Back** : NestJS + Express (TypeScript).
- **Front** : React + **React Router v7** (framework mode) + Vite (TypeScript).
- **Types partagés** : `packages/types` (`@recipe/types`), source unique du modèle.
- **Validation des entrées** : DTO + `class-validator`.
- **Qualité** : ESLint + Prettier + tsc + knip + jscpd, réunis sous `npm run verify`.

## La commande qui fait foi

Avant de considérer un travail « terminé » : **`npm run verify`** (format, lint,
types, code mort, duplication). Dev : `npm run start:dev` (dans `api`).

**Ce que `verify` garantit DÉJÀ** (couche déterministe — inutile de le re-vérifier
par jugement) : formatage, style, ordre des imports, types stricts, promesses
oubliées, nombres magiques, fonctions trop longues/complexes, code mort, copier-collé
littéral. La revue par jugement se concentre donc **uniquement** sur ce qui se juge
(voir priorités + les règles du kit).

## Les règles : `eng-kit/` fait foi

Les règles d'ingénierie ne vivent plus dans ce dépôt : elles sont dans **`eng-kit/`**
(dépôt séparé, non versionné ici), indexé par frontmatter. Mode d'emploi :
`eng-kit/AGENTS.kit.md`.

- Sélection : un fichier s'applique s'il est `status: active` **et** que sa `tech` est
  dans la stack **et** que sa `layer` existe ici. Ne lis que `## Rules` /
  `## Requirements` — **jamais** `## Reference` par défaut.
- `guardrail` = non négociable. `preference` = la convention du projet gagne.
- Une violation se cite par son id (`validation.r4`), pas par une paraphrase.
- Décisions déjà prises ici et qui priment sur les `preference` du kit : monorepo
  **npm** (pas pnpm), config Prettier/ESLint du projet, forme d'erreur figée par
  `design/routes-api.md`, pas de versionnement d'URL, pas de HATEOAS.

## Les 4 priorités (résumé)

1. **Architecture au service de la clarté.** Ne génère pas toute la structure d'un
   coup ; décide où va une logique (« dépend-elle du framework web ? »). On devine le
   contenu d'un dossier à son nom.
2. **Sécurité (3 réflexes).** Jamais confiance à une entrée client (tout est validé) ;
   aucun secret en dur (variables d'environnement) ; aucune requête SQL par
   concaténation (requêtes paramétrées / ORM).
3. **Performance sans excès.** D'abord clair et correct, pas d'optimisation
   prématurée. Seule alerte immédiate : les requêtes en boucle (N+1).
4. **Lisibilité (transversale).** Noms qui disent l'INTENTION ; fonctions courtes qui
   font UNE chose ; commentaires sur le POURQUOI, jamais le QUOI.

## Respecter la façon de faire des frameworks

Coder **à la manière** de chaque framework, pas à la mienne : Nest (modules,
providers, injection de dépendances, CLI `nest g`, `ValidationPipe` global, guards),
React Router v7 / Vite (conventions de fichiers et de dossiers), TypeORM
(entités/migrations). On part de leurs conventions et on n'AJOUTE que nos règles
transverses, sans les écraser. Réinventer leur structure = friction et dette.

## Index — quoi lire selon le sujet

| Quand je travaille sur…                           | Lis d'abord                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| savoir où en est le projet (fait / reste à faire) | `docs/avancement.md`                                                          |
| ce qu'il faut construire (routes, UC)             | `design/routes-api.md`, `design/use-cases-recettes.md`                        |
| du code métier (nommage, découpe, DRY, KISS)      | `eng-kit/rules/shared/clean-code.md`                                          |
| la conception d'une route / API REST              | `eng-kit/rules/backend/api-design.md`, `backend/error-handling.md`            |
| quoi que ce soit côté NestJS (`api/`)             | `eng-kit/rules/architecture/nest.md`, `backend/validation.md`                 |
| l'authentification / les droits                   | `eng-kit/rules/backend/{authentication,authorization,nest-authz,passport}.md` |
| quoi que ce soit côté client (`client/`)          | `eng-kit/rules/architecture/react.md`, `frontend/data-fetching.md`            |
| la base de données                                | `eng-kit/rules/modeling/{mcd,mld,mpd}.md`, `backend/data-access.md`           |
| les tests                                         | `eng-kit/rules/testing/{_strategy,jest}.md`                                   |
| docker                                            | `eng-kit/rules/infra/docker.md`                                               |
