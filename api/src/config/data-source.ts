import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';

// Une seule construction des options, partagée : Nest la nourrit avec ConfigService,
// la CLI TypeORM (qui tourne hors du contexte Nest) avec process.env.
// Règle unique de choix de la base : les tests e2e (et leurs migrations) posent ce
// drapeau pour basculer sur la base dédiée, qu'ils ont le droit de vider.
export const DRAPEAU_BASE_DE_TEST = 'UTILISER_BASE_DE_TEST';

function cleDeLaBase(): string {
  return process.env[DRAPEAU_BASE_DE_TEST] === '1'
    ? 'DB_DATABASE_TEST'
    : 'DB_DATABASE';
}

export function optionsBaseDeDonnees(
  lire: (cle: string) => string,
): DataSourceOptions {
  return {
    type: 'mysql',
    host: lire('DB_HOST'),
    port: Number(lire('DB_PORT')),
    username: lire('DB_USERNAME'),
    password: lire('DB_PASSWORD'),
    database: lire(cleDeLaBase()),
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
    migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
    // Jamais `true` : l'auto-sync supprime des colonnes sans prévenir.
    synchronize: false,
  };
}

function depuisEnvironnement(cle: string): string {
  const valeur = process.env[cle];
  if (valeur === undefined) {
    throw new Error(`Variable d'environnement manquante : ${cle}`);
  }
  return valeur;
}

// Consommé uniquement par la CLI TypeORM (migration:generate/run/revert).
export default new DataSource(optionsBaseDeDonnees(depuisEnvironnement));
