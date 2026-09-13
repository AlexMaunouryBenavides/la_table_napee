import { IsString, Length } from 'class-validator';

const LONGUEUR_MIN = 12;
const LONGUEUR_MAX = 128;

// L'ancien mot de passe est exigé : sans lui, un jeton volé suffirait à verrouiller le
// compte de sa victime.
export class ChangerMotDePasseDto {
  @IsString()
  ancienMotDePasse!: string;

  @IsString()
  @Length(LONGUEUR_MIN, LONGUEUR_MAX)
  nouveauMotDePasse!: string;
}
