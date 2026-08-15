import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RoleUtilisateur } from '@recipe/types';

import { type RequeteAuthentifiee } from './identite-requete';
import { CLE_ROLES } from './roles.decorator';

// L'héritage des rôles vit ICI et nulle part ailleurs : un admin passe toute porte
// marquée « modérateur ». Écrit une fois, il ne peut pas diverger d'un `if` oublié.
const NIVEAUX: Record<RoleUtilisateur, number> = {
  utilisateur: 1,
  moderateur: 2,
  admin: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexte: ExecutionContext): boolean {
    const requis = this.reflector.getAllAndOverride<
      RoleUtilisateur[] | undefined
    >(CLE_ROLES, [contexte.getHandler(), contexte.getClass()]);

    // Sans `@Roles()`, ce guard n'a rien à dire : l'authentification suffit.
    if (requis === undefined || requis.length === 0) {
      return true;
    }

    const requete = contexte.switchToHttp().getRequest<RequeteAuthentifiee>();
    const role = requete.user?.role;

    return role !== undefined && requis.some((exige) => aAuMoins(role, exige));
  }
}

function aAuMoins(role: RoleUtilisateur, exige: RoleUtilisateur): boolean {
  return NIVEAUX[role] >= NIVEAUX[exige];
}
