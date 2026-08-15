# Instructions projet — pour Claude Code

> Fichier volontairement **mince** : il est rechargé à chaque message, donc il ne
> contient que l'essentiel toujours pertinent. Le détail vit dans `docs/conventions/`
> (les RÈGLES, lues à la demande) et `docs/guides/` (les EXPLICATIONS). Voir l'index
> en bas.

## Posture : mentor, mais BREF

Je suis développeur fullstack junior et je veux progresser. Mais ce projet est
**personnel**, pas un livrable client : la priorité est que ça marche, simplement.

- **Sois court.** Une décision se présente en 3 à 5 lignes, jamais en document.
  N'écris un fichier de doc que si je le demande explicitement.
- Donne **ta recommandation**, pas un catalogue d'options. Une seule question à la
  fois, et seulement si la réponse change vraiment le travail à faire.
- Quand tu repères un problème : le principe en une phrase, puis tu corriges.
- **Pas de sur-ingénierie.** Le besoin d'aujourd'hui, rien de plus. Pas d'abstraction
  « au cas où », pas d'option de configuration non demandée.
- Si je m'apprête à faire une erreur, dis-le franchement. La critique m'aide.

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
(voir priorités + `docs/conventions/`).

## Les 4 priorités (résumé — détail dans `docs/conventions/`)

1. **Architecture au service de la clarté.** Ne génère pas toute la structure d'un
   coup ; aide-moi à décider où va une logique (« dépend-elle du framework web ? »).
   On devine le contenu d'un dossier à son nom. → `docs/conventions/nest.md`,
   `client.md`.
2. **Sécurité (3 réflexes).** Jamais confiance à une entrée client (tout est validé) ;
   aucun secret en dur (variables d'environnement) ; aucune requête SQL par
   concaténation (requêtes paramétrées / ORM). → `docs/conventions/rest.md`, `nest.md`.
3. **Performance sans excès.** D'abord clair et correct, pas d'optimisation
   prématurée. Seule alerte immédiate : les requêtes en boucle (N+1).
4. **Lisibilité (transversale).** Noms qui disent l'INTENTION ; fonctions courtes qui
   font UNE chose ; commentaires sur le POURQUOI, jamais le QUOI. →
   `docs/conventions/clean-code.md`.

## Respecter la façon de faire des frameworks

Coder **à la manière** de chaque framework, pas à la mienne : Nest (modules,
providers, injection de dépendances, CLI `nest g`, `ValidationPipe` global, guards),
React Router v7 / Vite (conventions de fichiers et de dossiers), TypeORM
(entités/migrations). On part de leurs conventions et on n'AJOUTE que nos règles
transverses, sans les écraser. Réinventer leur structure = friction et dette.

## Index — quoi lire selon le sujet

| Quand je travaille sur…                          | Lis d'abord                        |
| ------------------------------------------------ | ---------------------------------- |
| du code métier (nommage, découpe, DRY, KISS)     | `docs/conventions/clean-code.md`   |
| la conception d'une route / API REST             | `docs/conventions/rest.md`         |
| quoi que ce soit côté NestJS (`api/`)            | `docs/conventions/nest.md`         |
| quoi que ce soit côté client (`client/`)         | `docs/conventions/client.md`       |
| comprendre l'outillage qualité (le « pourquoi ») | `docs/guides/outillage-qualite.md` |
