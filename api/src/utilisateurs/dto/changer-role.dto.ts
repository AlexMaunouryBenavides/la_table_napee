import { ROLES_UTILISATEUR, type RoleUtilisateur } from '@recipe/types';
import { IsIn } from 'class-validator';

// Le rôle est une sous-ressource dédiée, pas un champ de profil : c'est l'opération la
// plus dangereuse de l'API, elle mérite sa propre URL et son propre contrat d'entrée.
export class ChangerRoleDto {
  @IsIn(ROLES_UTILISATEUR)
  role!: RoleUtilisateur;
}
