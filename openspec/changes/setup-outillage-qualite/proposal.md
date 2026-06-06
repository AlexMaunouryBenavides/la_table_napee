## Why

Le projet démarre encore sur les squelettes Nest + React par défaut : c'est le
moment idéal pour poser les garde-fous AVANT d'écrire la moindre fonctionnalité.
L'objectif n'est pas seulement « que ça marche », mais d'écrire un code de niveau
professionnel (Clean Code, DRY, KISS, conventions REST, bonnes pratiques NestJS)
où la qualité repose sur de l'**outillage** et des **règles explicites**, pas sur
la seule vigilance humaine. Le faire maintenant évite une dette et un reformatage
massif plus tard.

## What Changes

- **BREAKING** : abandon de Biome au profit de **ESLint + Prettier + TypeScript**.
  Biome (dépendance + commande dans `CLAUDE.md`) est supprimé.
- Mise en place d'une **chaîne de vérification déterministe unique** `npm run verify`
  enchaînant : `prettier --check` → `eslint` (strict + type-aware) → `tsc --noEmit`
  → `knip` (code mort à l'échelle du repo) → `jscpd` (duplication). Verdict binaire,
  zéro token IA.
- Réglage de **TypeScript au palier strict** + flags pro (`noUncheckedIndexedAccess`,
  `noUnusedLocals`, `noUnusedParameters`) et d'**ESLint type-aware** avec les règles
  Clean Code mécanisables (`max-params`, `complexity`, `no-floating-promises`,
  `no-magic-numbers`, etc.).
- Installation des **trois lignes de défense** rejouant toutes le même `verify` :
  intégration éditeur (VS Code), hook pre-commit (**husky + lint-staged**),
  CI (**GitHub Actions**).
- Adoption des **Conventional Commits** via **commitlint**.
- Réorganisation de la **couche « jugement »** : `CLAUDE.md` mince (posture mentor +
  stack + priorités résumées + index) + `docs/conventions/{clean-code,rest,nest,client}.md`
  lus à la demande, pour éviter la dilution d'attention.
- **Règle transverse « respecter les frameworks »** : coder à la manière de Nest /
  React Router / Vite / TypeORM (partir de leurs conventions, n'ajouter que nos
  règles), inscrite dans `CLAUDE.md` et `docs/conventions/`.
- **Guide d'apprentissage** `docs/guides/outillage-qualite.md` créé en premier, à
  lire avant la mise en place.

## Capabilities

### New Capabilities

- `quality-gates` : la chaîne de vérification déterministe (`npm run verify`), les
  trois lignes de défense (éditeur / pre-commit / CI) et la convention de commits.
  C'est la couche « machine » qui force les règles mesurables.
- `code-review-rulebook` : l'organisation de la couche « jugement » — un `CLAUDE.md`
  mince toujours chargé (dont la posture mentor) + des documents de conventions lus
  à la demande. C'est ce que l'IA et le développeur appliquent par jugement.

### Modified Capabilities

<!-- Aucune : openspec/specs/ est vide, aucune capacité existante n'est modifiée. -->

## Impact

- **Config racine** : `package.json` (scripts + npm workspaces), `tsconfig.base.json`,
  `eslint.config.mjs` (racine + `api/` + `client/`), `.prettierrc`, config `knip`,
  config `jscpd`, `commitlint.config.*`, dossier `.husky/`, `.editorconfig`,
  `.vscode/`, `.github/workflows/`.
- **Documentation** : `CLAUDE.md` réécrit (version mince) + nouveau dossier
  `docs/conventions/`.
- **Suppression** : Biome (dépendance npm + référence dans `CLAUDE.md`).
- **Aucune logique applicative touchée** : ce changement ne concerne QUE l'outillage
  et les règles. Les couches données, auth et la structure fine du monorepo restent
  à explorer séparément.
