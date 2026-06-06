import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// Bornes et valeurs par défaut (nommées : pas de nombre magique).
const MIN_PORT = 1;
const MAX_PORT = 65535;
const DEFAULT_PORT = 3000;
const DEFAULT_THROTTLER_TTL_MS = 60_000; // 60 s
const DEFAULT_THROTTLER_LIMIT = 100; // requêtes par fenêtre, en global (généreux)

enum Environnement {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Décrit ET valide les variables d'environnement attendues. Une propriété sans
// valeur par défaut (FRONT_ORIGIN) est REQUISE : l'app refusera de démarrer sans.
class VariablesEnvironnement {
  @IsEnum(Environnement)
  NODE_ENV: Environnement = Environnement.Development;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  @Max(MAX_PORT)
  PORT: number = DEFAULT_PORT;

  // Origine exacte du front, requise pour le CORS crédentialisé (jamais `*`).
  // require_tld: false → autorise http://localhost:5173 en développement.
  @IsString()
  @IsUrl({ require_tld: false })
  FRONT_ORIGIN!: string;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  THROTTLER_TTL: number = DEFAULT_THROTTLER_TTL_MS;

  @Type(() => Number)
  @IsInt()
  @Min(MIN_PORT)
  THROTTLER_LIMIT: number = DEFAULT_THROTTLER_LIMIT;

  @IsString()
  LOG_LEVEL: string = 'info';
}

// Passée à ConfigModule.forRoot({ validate }). Son retour devient la config validée :
// si une variable requise manque ou est invalide, on jette → l'app ne démarre pas.
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
