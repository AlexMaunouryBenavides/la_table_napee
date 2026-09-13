import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { CLE_PUBLIQUE } from './public.decorator';

// Répond à UNE question : « es-tu authentifié ? » → 401 sinon. Le droit d'agir, lui,
// se juge ailleurs (RolesGuard pour le rôle, le service pour la propriété).
//
// Enregistré en garde GLOBAL (`APP_GUARD`) : il protège donc tout, et ne s'efface que
// devant `@Public()`.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(contexte: ExecutionContext) {
    // Le niveau méthode l'emporte sur le niveau classe : un controller public peut
    // garder une route protégée, et l'inverse.
    const estPublique = this.reflector.getAllAndOverride<boolean | undefined>(
      CLE_PUBLIQUE,
      [contexte.getHandler(), contexte.getClass()],
    );

    return estPublique === true ? true : super.canActivate(contexte);
  }
}
