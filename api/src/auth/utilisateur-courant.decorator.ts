import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import {
  type IdentiteRequete,
  type RequeteAuthentifiee,
} from './identite-requete';

// `@UtilisateurCourant()` livre l'identité issue du COOKIE. Le service reçoit ainsi
// qui demande, sans jamais toucher à `req` — et surtout sans lire un identifiant
// dans le corps de la requête, qui serait falsifiable.
export const UtilisateurCourant = createParamDecorator(
  (_donnee: unknown, contexte: ExecutionContext): IdentiteRequete => {
    const requete = contexte.switchToHttp().getRequest<RequeteAuthentifiee>();

    // En pratique `JwtAuthGuard` a déjà refusé la requête ; ce garde-fou évite qu'un
    // oubli de guard laisse passer une identité vide.
    if (requete.user === undefined) {
      throw new UnauthorizedException();
    }

    return requete.user;
  },
);
