import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RoleUtilisateur } from '@recipe/types';

import { aAuMoins } from './hierarchie-roles';
import { type RequeteAuthentifiee } from './identite-requete';
import { CLE_ROLES } from './roles.decorator';

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
