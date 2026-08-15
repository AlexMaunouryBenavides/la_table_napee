import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

const MIN_PORT = 1;
const MAX_PORT = 65535;
const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 3306;
const DEFAULT_THROTTLER_TTL_MS = 60_000;
const DEFAULT_THROTTLER_LIMIT = 100;
const LONGUEUR_MIN_SECRET_JWT = 32;
const DEFAULT_ACCES_MINUTES = 15;
const DEFAULT_RAFRAICHISSEMENT_JOURS = 7;
const MINIMUM_DUREE = 1;

enum Environnement {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Une propriété sans valeur par défaut est REQUISE : l'app refuse de démarrer sans.
class VariablesEnvironnement {
  @IsEnum(Environnement)
  NODE_ENV: Environnement = Environnement.Development;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  PORT: number = DEFAULT_PORT;

  // require_tld: false → autorise http://localhost:5173 en développement.
  @IsString()
  @IsUrl({ require_tld: false })
  FRONT_ORIGIN!: string;

  @IsString()
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  DB_PORT: number = DEFAULT_DB_PORT;

  @IsString()
  DB_USERNAME!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_DATABASE!: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  THROTTLER_TTL: number = DEFAULT_THROTTLER_TTL_MS;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  THROTTLER_LIMIT: number = DEFAULT_THROTTLER_LIMIT;

  // Aucune valeur par défaut, volontairement : un secret de repli finirait un jour en
  // production, et qui connaît le secret fabrique un jeton « admin » valide.
  @IsString()
  @MinLength(LONGUEUR_MIN_SECRET_JWT)
  JWT_SECRET!: string;

  // Durée de vie de l'access token. Courte : elle borne la fenêtre pendant laquelle un
  // rôle retiré reste actif (le rôle réel est relu en base au rafraîchissement).
  @Type(() => Number)
  @IsInt()
  @Min(MINIMUM_DUREE)
  ACCES_MINUTES: number = DEFAULT_ACCES_MINUTES;

  @Type(() => Number)
  @IsInt()
  @Min(MINIMUM_DUREE)
  RAFRAICHISSEMENT_JOURS: number = DEFAULT_RAFRAICHISSEMENT_JOURS;

  @IsString()
  LOG_LEVEL: string = 'info';
}

export function validateEnv(
  config: Record<string, unknown>,
): VariablesEnvironnement {
  const valides = plainToInstance(VariablesEnvironnement, config, {
    enableImplicitConversion: false,
  });
  const erreurs = validateSync(valides, { skipMissingProperties: false });
  if (erreurs.length > 0) {
    throw new Error(
      `Configuration d'environnement invalide :\n${erreurs.toString()}`,
    );
  }
  return valides;
}
