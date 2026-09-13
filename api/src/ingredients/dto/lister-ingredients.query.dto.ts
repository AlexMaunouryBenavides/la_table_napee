import { IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';

const LONGUEUR_RECHERCHE_MAX = 100;

export class ListerIngredientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(LONGUEUR_RECHERCHE_MAX)
  recherche?: string;
}
