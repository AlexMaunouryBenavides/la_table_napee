# quality-gates Specification

## Purpose

La couche « machine » du projet : une chaîne de vérification déterministe unique
(`npm run verify`) et les trois lignes de défense (éditeur, pre-commit, CI) qui
forcent les règles mesurables, plus la convention de messages de commit. Verdict
binaire, gratuit, sans token IA.

## Requirements

### Requirement: Commande de vérification déterministe unique

Le projet SHALL fournir une commande `npm run verify` qui enchaîne, dans l'ordre,
`prettier --check`, `eslint`, `tsc --noEmit`, `knip` et `jscpd`. La commande SHALL
retourner un code de sortie non nul dès qu'un seul de ces outils échoue, et n'exiger
aucun service externe ni token IA.

#### Scenario: Code non formaté rejeté

- **WHEN** un fichier n'est pas conforme à Prettier
- **THEN** `npm run verify` échoue à l'étape `prettier --check` avec un code de sortie non nul

#### Scenario: Promesse non attendue rejetée

- **WHEN** un `await` est oublié sur un appel asynchrone (floating promise)
- **THEN** `eslint` signale `no-floating-promises` et `npm run verify` échoue

#### Scenario: Export inutilisé rejeté

- **WHEN** un export n'est importé nulle part dans le monorepo
- **THEN** `knip` le signale comme code mort et `npm run verify` échoue

#### Scenario: Duplication littérale rejetée

- **WHEN** un bloc de code dépassant le seuil configuré est copié-collé
- **THEN** `jscpd` le signale et `npm run verify` échoue

### Requirement: TypeScript strict sur tout le monorepo

Un `tsconfig.base.json` partagé SHALL activer `strict: true`,
`noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters`, et chaque
package (`api`, `client`, `packages/types`) SHALL en hériter.

#### Scenario: Accès indexé non gardé rejeté

- **WHEN** le code accède à un élément de tableau sans vérifier son existence
- **THEN** `tsc` traite la valeur comme potentiellement `undefined` et exige une garde

#### Scenario: Entité NestJS sans initialisation acceptée par convention

- **WHEN** une propriété d'entité TypeORM ou de DTO est déclarée sans initialisation
- **THEN** la convention `nom!: string` est utilisée et `tsc` passe sans désactiver `strictPropertyInitialization`

### Requirement: Hook pre-commit sur les fichiers modifiés

Un hook pre-commit (husky) SHALL exécuter lint-staged sur les seuls fichiers
indexés avant chaque commit, et SHALL bloquer le commit si une vérification échoue.

#### Scenario: Commit d'un fichier non conforme bloqué

- **WHEN** un développeur tente de committer un fichier mal formé ou fautif
- **THEN** le hook pre-commit échoue et le commit est interrompu

### Requirement: Barrière CI sur les pull requests

Un workflow GitHub Actions SHALL exécuter `npm run verify` (et les tests) sur chaque
pull request, et SHALL empêcher le merge si la vérification échoue.

#### Scenario: PR fautive bloquée au merge

- **WHEN** une pull request contient une erreur de lint, de type ou de code mort
- **THEN** le workflow CI échoue et le merge est bloqué

### Requirement: Messages de commit conventionnels

commitlint SHALL valider chaque message de commit selon la convention Conventional
Commits et SHALL rejeter les messages non conformes.

#### Scenario: Message non conventionnel rejeté

- **WHEN** un message de commit ne suit pas le format `type(scope): sujet` (ex. `wip`)
- **THEN** commitlint rejette le commit
