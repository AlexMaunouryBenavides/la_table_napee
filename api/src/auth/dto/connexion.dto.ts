import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Aucune règle de robustesse ici : on ne valide pas un mot de passe existant, on le
// vérifie. Exiger 12 caractères à la connexion révélerait la politique en vigueur et
// bloquerait les comptes créés sous une politique antérieure.
export class ConnexionDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  motDePasse!: string;
}
