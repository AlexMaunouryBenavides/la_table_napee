// @ts-check
// Config ESLint UNIQUE du monorepo (flat config v9).
// Lancée une seule fois depuis la racine sur tout le repo. Les règles communes
// s'appliquent partout ; les blocs `files:` ciblent api/ (Node/Nest) et client/ (React).
// eslint-config-prettier est placé EN DERNIER pour éteindre les règles de format
// (c'est Prettier qui gère la forme, ESLint juge la logique — pas de chevauchement).
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Seuils Clean Code « mécanisables » (couche 1 : mesurables, donc délégués à la machine).
const MAX_PARAMS = 4;
const MAX_COMPLEXITY = 10;
const MAX_LINES_PER_FUNCTION = 50;

export default tseslint.config(
  // 1. Ignorés globalement : dossiers générés/installés + ce fichier lui-même
  //    (il n'appartient à aucun tsconfig, le service de types le rejetterait).
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.react-router/**',
      '**/node_modules/**',
      'eslint.config.mjs',
    ],
  },

  // 2. Base commune à TOUT le TypeScript : recommandé + type-aware.
  //    `projectService` laisse typescript-eslint trouver seul le bon tsconfig par fichier.
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 3. L'ordre des imports, imposé pour tous (lisibilité, diffs propres).
  {
    plugins: { import: importPlugin },
    rules: {
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // 4. Nos règles Clean Code mécanisables, sur notre code source uniquement.
  {
    files: ['api/**/*.ts', 'client/**/*.{ts,tsx}', 'packages/**/*.ts'],
    rules: {
      'max-params': ['error', MAX_PARAMS],
      complexity: ['error', MAX_COMPLEXITY],
      'max-lines-per-function': [
        'error',
        {
          max: MAX_LINES_PER_FUNCTION,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      // Nombres magiques interdits, sauf les neutres 0/1/-1 et les cas TS légitimes.
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
    },
  },

  // 5. Bloc api/ (NestJS, Node) : on PART de la base commune ci-dessus,
  //    on n'AJOUTE que l'environnement Node/Jest.
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
    },
  },

  // 6. Bloc client/ (React Router + Vite) : React, hooks et accessibilité.
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'], // JSX transform moderne → pas d'import React requis
      jsxA11y.flatConfigs.recommended,
    ],
    // react-hooks v7 expose encore son preset au format eslintrc (plugins en array),
    // incompatible flat config : on enregistre le plugin en objet et on reprend ses règles.
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    rules: { ...reactHooks.configs['recommended-latest'].rules },
  },

  // 7. Fichiers de test : on relâche les seuils qui n'ont pas de sens en test
  //    (un describe peut être long, des nombres en assertion sont explicites).
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },

  // 8. Fichiers JS/config : pas de typage TS à appliquer.
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // 9. EN DERNIER : éteint toutes les règles ESLint qui touchent au format.
  eslintConfigPrettier,
);
