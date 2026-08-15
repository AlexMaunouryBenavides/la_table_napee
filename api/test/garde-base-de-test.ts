// GARDE-FOU. Les tests e2e VIDENT des tables : lancés sur la base de développement,
// ils effaceraient de vraies recettes sans prévenir.
//
// Ce fichier s'exécute AVANT le chargement des modules de test (`setupFiles` de Jest).
//
// ⚠️ Le nom du drapeau est répété en dur ici, PAS importé de `data-source.ts`.
// Importer ce module l'évaluerait — donc construirait la DataSource sur la base de
// développement — avant que la ligne du bas ait posé le drapeau. Une duplication de
// cinq caractères vaut mieux qu'un import qui déclenche un effet de bord trop tôt.

import 'dotenv/config';

const DRAPEAU_BASE_DE_TEST = 'UTILISER_BASE_DE_TEST';

const baseDeTest = process.env.DB_DATABASE_TEST;

if (baseDeTest === undefined || baseDeTest.length === 0) {
  throw new Error(
    "DB_DATABASE_TEST n'est pas défini : les tests e2e refusent de tourner sur la " +
      'base de développement, qu’ils videraient. Ajoute par exemple ' +
      '`DB_DATABASE_TEST=recipe_test` dans api/.env, puis applique les migrations ' +
      'avec `npm run migration:run:test`.',
  );
}

if (baseDeTest === process.env.DB_DATABASE) {
  throw new Error(
    `DB_DATABASE_TEST vaut « ${baseDeTest} », soit la même base que DB_DATABASE. ` +
      'Les tests e2e exigent une base DISTINCTE.',
  );
}

process.env[DRAPEAU_BASE_DE_TEST] = '1';
