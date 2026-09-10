import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

const LONGUEUR_MIN_PSEUDO = 3;
const LONGUEUR_MAX_PSEUDO = 255;

// Ni `role`, ni `motDePasse`, ni `id` : ce qu'un DTO ne déclare pas, le
// `ValidationPipe` le refuse (`forbidNonWhitelisted`). C'est ce qui empêche un compte
// de se promouvoir administrateur en glissant un champ dans le corps.
export class ModifierProfilDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(LONGUEUR_MIN_PSEUDO, LONGUEUR_MAX_PSEUDO)
  pseudo?: string;
}
