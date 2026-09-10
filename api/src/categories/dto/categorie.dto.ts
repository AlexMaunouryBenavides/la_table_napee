import { PartialType } from '@nestjs/mapped-types';
import { IsString, Length } from 'class-validator';

const LONGUEUR_MIN = 2;
const LONGUEUR_MAX = 255;

// Les quatre ressources n'ont qu'un champ, et c'est le même. Un seul DTO.
export class CreerCategorieDto {
  @IsString()
  @Length(LONGUEUR_MIN, LONGUEUR_MAX)
  nom!: string;
}

export class ModifierCategorieDto extends PartialType(CreerCategorieDto) {}
