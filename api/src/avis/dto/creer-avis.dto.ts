import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const NOTE_MIN = 1;
const NOTE_MAX = 5;
const COMMENTAIRE_MAX = 255;

// Ni `utilisateurId` ni `recetteId` : l'auteur vient du cookie et la recette de l'URL.
// Les accepter en entrée permettrait d'écrire un avis au nom de quelqu'un d'autre.
export class CreerAvisDto {
  @IsInt()
  @Min(NOTE_MIN)
  @Max(NOTE_MAX)
  note!: number;

  @IsOptional()
  @IsString()
  @MaxLength(COMMENTAIRE_MAX)
  commentaire?: string;
}
