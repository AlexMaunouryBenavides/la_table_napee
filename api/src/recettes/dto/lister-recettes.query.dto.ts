import {
  DIFFICULTES,
  TYPES_RECETTE,
  type Difficulte,
  type TypeRecette,
} from '@recipe/types';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';

const MINIMUM = 1;
const LONGUEUR_RECHERCHE_MAX = 100;

// Clés de tri autorisées → colonne réelle. Une liste fermée évite qu'un client
// puisse trier sur n'importe quelle colonne (y compris une colonne sensible).
export const TRIS = {
  dateCreation: 'recette.dateCreation',
  titre: 'recette.titre',
  tempsPreparation: 'recette.tempsPreparation',
} as const;

export type CleTri = keyof typeof TRIS;

const TRI_PAR_DEFAUT = '-dateCreation';

// Le préfixe `-` signifie décroissant : `?tri=-dateCreation`.
const TRIS_AUTORISES = Object.keys(TRIS).flatMap((cle) => [cle, `-${cle}`]);

// Express donne une chaîne pour `?regime=1` et un tableau pour `?regime=1&regime=2`.
// On normalise toujours en tableau de nombres, sinon le service devrait gérer les deux.
const enTableauDeNombres = ({ value }: { value: unknown }): number[] => {
  const valeurs = Array.isArray(value) ? value : [value];
  return valeurs.map(Number);
};

// `page` et `limite` viennent de la pagination commune à toutes les listes de l'API.
export class ListerRecettesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(TRIS_AUTORISES)
  tri: string = TRI_PAR_DEFAUT;

  @IsOptional()
  @IsString()
  @MaxLength(LONGUEUR_RECHERCHE_MAX)
  recherche?: string;

  @IsOptional()
  @IsIn(DIFFICULTES)
  difficulte?: Difficulte;

  @IsOptional()
  @IsIn(TYPES_RECETTE)
  type?: TypeRecette;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  nationalite?: number;

  // Temps total (préparation + cuisson), en minutes.
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(MINIMUM)
  tempsMax?: number;

  // Répétables et cumulatifs : `?regime=1&regime=2` = « végan ET sans gluten ».
  @Transform(enTableauDeNombres)
  @IsOptional()
  @IsInt({ each: true })
  regime?: number[];

  @Transform(enTableauDeNombres)
  @IsOptional()
  @IsInt({ each: true })
  critereSante?: number[];

  @Transform(enTableauDeNombres)
  @IsOptional()
  @IsInt({ each: true })
  typeAliment?: number[];

  @Transform(enTableauDeNombres)
  @IsOptional()
  @IsInt({ each: true })
  ingredient?: number[];
}
