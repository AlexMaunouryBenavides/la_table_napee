> Rappel posture mentor : à chaque étape, comprendre AVANT d'installer. Le but est
> d'apprendre chaque outil en le branchant, pas d'empiler des configs magiques.
> Le groupe 1 produit un guide à LIRE avant de continuer.

## 1. Comprendre avant de coder

- [x] 1.1 Créer `docs/guides/outillage-qualite.md` expliquant, en français et simplement : le modèle 2 couches (déterministe vs jugement), les 3 lignes de défense (éditeur → pre-commit → CI), ce que fait CHAQUE outil et POURQUOI (Prettier, ESLint type-aware, tsc, knip, jscpd), comment lancer `npm run verify`, lire une erreur et la corriger
- [x] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Nettoyage et préparation du monorepo

- [x] 2.1 Retirer Biome : désinstaller la dépendance et supprimer toute config Biome
- [x] 2.2 Confirmer/activer les `workspaces` npm dans le `package.json` racine (`api`, `client`, `packages/*`)
- [x] 2.3 Ajouter un `.editorconfig` racine (fin de ligne, indentation, charset cohérents)

## 3. Base TypeScript stricte

- [x] 3.1 Créer `tsconfig.base.json` racine : `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- [x] 3.2 Faire hériter `api/tsconfig.json`, `client/tsconfig.json` et `packages/types/tsconfig.json` de la base
- [x] 3.3 Vérifier les options décorateurs requises par Nest (`experimentalDecorators`, `emitDecoratorMetadata`) côté `api`
- [x] 3.4 Lancer `tsc --noEmit` sur chaque package et corriger (convention `nom!: string` pour les propriétés Nest/TypeORM)

## 4. Formatage — Prettier

- [x] 4.1 Installer Prettier et créer `.prettierrc` + `.prettierignore` racine
- [x] 4.2 Ajouter un script `format` (`prettier --write`) et `format:check` (`prettier --check`)
- [x] 4.3 Formater l'existant une première fois et valider le résultat

## 5. Linting — ESLint (flat config) + type-aware

- [x] 5.1 Créer `eslint.config.mjs` racine : base TS commune + `eslint-config-prettier` (désactive les règles de format)
- [x] 5.2 Activer le type-aware (`projectService`) pointant vers les `tsconfig` des packages
- [x] 5.3 Ajouter les règles Clean Code mécanisables : `max-params`, `complexity`, `max-lines-per-function`, `no-magic-numbers` (autoriser `0`, `1`, `-1`), `no-floating-promises`
- [x] 5.4 Côté `api/` : PARTIR de la config Nest recommandée et n'AJOUTER que nos règles (ne rien écraser des conventions du framework)
- [x] 5.5 Côté `client/` : PARTIR des configs React Router / Vite recommandées et ajouter plugins React / react-hooks / jsx-a11y
- [x] 5.6 Ajouter la règle d'ordre des imports (`import/order`)
- [x] 5.7 Ajouter un script `lint` et lancer sur tout le repo, corriger les remontées

## 6. Code mort et duplication

- [x] 6.1 Installer et configurer `knip` (entrées/projets du monorepo) ; ajouter un script `knip`
- [x] 6.2 Installer et configurer `jscpd` ; **calibrer un seuil permissif** (anti-abus) et ignorer les dossiers générés ; ajouter un script `jscpd`
- [x] 6.3 Lancer les deux et atteindre un état vert stable (ajuster les seuils jusqu'à ce que chaque alerte soit un vrai problème)

## 7. La commande unique `verify`

- [x] 7.1 Créer le script racine `verify` = `format:check` && `lint` && `tsc --noEmit` && `knip` && `jscpd`
- [x] 7.2 Vérifier qu'il retourne un code non nul si un seul outil échoue (test manuel en cassant volontairement une règle)

## 8. Hook pre-commit — husky + lint-staged

- [x] 8.1 Installer husky et initialiser `.husky/`
- [x] 8.2 Configurer `lint-staged` (Prettier + ESLint sur les fichiers indexés uniquement)
- [x] 8.3 Brancher le hook `pre-commit` sur lint-staged et tester (commit d'un fichier fautif → bloqué)

## 9. Convention de commits — commitlint

- [x] 9.1 Installer commitlint + la config Conventional Commits ; créer `commitlint.config.*`
- [x] 9.2 Brancher le hook `commit-msg` (husky) et tester (message `wip` → rejeté)

## 10. Intégration éditeur (VS Code)

- [x] 10.1 `.vscode/extensions.json` : recommander ESLint + Prettier
- [x] 10.2 `.vscode/settings.json` : format-on-save via Prettier + correction ESLint à la sauvegarde

## 11. CI — GitHub Actions

- [x] 11.1 Créer `.github/workflows/ci.yml` : install + `npm run verify` + tests sur chaque pull request
- [x] 11.2 S'assurer que la CI rejoue EXACTEMENT le même `verify` que le local (pas de dérive)
- [x] 11.3 (Repo GitHub présent) activer la protection de branche : merge bloqué si CI rouge — MANUEL (UI GitHub, après 1er run CI ; voir note)

## 12. Couche jugement — CLAUDE.md mince + docs/conventions

- [x] 12.1 Réécrire `CLAUDE.md` en version mince : posture mentor (en tête), stack (sans Biome), 4 priorités résumées, **règle « respecter les conventions officielles des frameworks (Nest, React Router, Vite, TypeORM) — coder à LEUR manière »**, rappel `npm run verify`, INDEX vers `docs/conventions/` et `docs/guides/`
- [x] 12.2 Créer `docs/conventions/clean-code.md` (checklist de jugement : faire une chose, nommer l'intention, abstraction, DRY conceptuel, KISS)
- [x] 12.3 Créer `docs/conventions/rest.md` (nommage des ressources, codes statut, idempotence, pagination/filtres, gestion d'erreurs)
- [x] 12.4 Créer `docs/conventions/nest.md` : la façon de faire OFFICIELLE de Nest — modules par fonctionnalité, providers + injection de dépendances, scaffolding via le CLI `nest g`, `ValidationPipe` global, guards/pipes/interceptors comme mécanismes transverses, controller≠service (jamais de `req/res` dans le métier). Référence : docs.nestjs.com
- [x] 12.5 Créer `docs/conventions/client.md` : respecter les conventions React Router v7 (framework mode) + Vite, ne pas contourner les fichiers/dossiers attendus
- [x] 12.6 Indiquer dans `CLAUDE.md` ce qui est déjà couvert par `verify` (pour que la revue IA se concentre sur le jugement)

## 13. Vérification finale

- [x] 13.1 Lancer `npm run verify` une dernière fois sur le repo complet → vert
- [x] 13.2 Simuler le parcours complet : casser une règle → hook bloque en local → CI bloque sur PR (local prouvé en 8.3/9.2 ; CI identique au local, s'active au 1er push + protection de branche 11.3)
- [x] 13.3 Demander à l'IA une revue de jugement sur un échantillon et confirmer qu'elle s'appuie sur `docs/conventions/`
