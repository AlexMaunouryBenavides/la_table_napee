import { SetMetadata } from '@nestjs/common';
import { type RoleUtilisateur } from '@recipe/types';

export const CLE_ROLES = 'roles';

// `@Roles('moderateur')` pose une étiquette que `RolesGuard` relit via le Reflector.
// Le rôle exigé est ainsi visible sur la route elle-même, pas noyé dans le service.
export const Roles = (...roles: RoleUtilisateur[]) =>
  SetMetadata(CLE_ROLES, roles);
