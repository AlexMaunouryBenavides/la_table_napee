import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

const LONGUEUR_MIN_MOT_DE_PASSE = 12;
const LONGUEUR_MAX_MOT_DE_PASSE = 128;
const LONGUEUR_MIN_PSEUDO = 3;
const LONGUEUR_MAX_PSEUDO = 255;

// Ce DTO n'est PAS la table `users` : ni `role` ni `id` n'y figurent. Les exposer
// laisserait un visiteur s'inscrire administrateur.
export class InscriptionDto {
  @IsEmail()
  email!: string;

  // La longueur est la seule exigence qui protège vraiment : une phrase longue résiste
  // mieux qu'un « P@ssw0rd! » court, que les dictionnaires connaissent par cœur.
  @IsString()
  @Length(LONGUEUR_MIN_MOT_DE_PASSE, LONGUEUR_MAX_MOT_DE_PASSE)
  motDePasse!: string;

  @IsOptional()
  @IsString()
  @Length(LONGUEUR_MIN_PSEUDO, LONGUEUR_MAX_PSEUDO)
  pseudo?: string;
}
