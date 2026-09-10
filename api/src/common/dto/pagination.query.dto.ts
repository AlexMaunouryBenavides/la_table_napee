import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const PAGE_PAR_DEFAUT = 1;
const LIMITE_PAR_DEFAUT = 20;
const LIMITE_MAX = 100;
const MINIMUM = 1;

// Toute liste de l'API est paginée de la même façon (`design/routes-api.md` § 2) :
// une seule déclaration, et les trois listes ne peuvent pas diverger.
export class PaginationQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(MINIMUM)
  page: number = PAGE_PAR_DEFAUT;

  // Plafonnée : sans maximum, `?limite=999999` redeviendrait « toute la table ».
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(MINIMUM)
  @Max(LIMITE_MAX)
  limite: number = LIMITE_PAR_DEFAUT;
}
