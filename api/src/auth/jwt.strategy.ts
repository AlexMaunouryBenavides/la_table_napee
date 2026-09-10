import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type ChargeUtileJeton } from '@recipe/types';
import { type Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { COOKIE_ACCES, lireCookie } from './cookies-auth';
import { type IdentiteRequete } from './identite-requete';

// L'extracteur par défaut de passport-jwt lit l'en-tête `Authorization` ; notre jeton
// vit dans un cookie httpOnly, invisible au JavaScript. C'est la seule adaptation.
function lireJetonDansCookie(requete: Request): string | null {
  return lireCookie(requete, COOKIE_ACCES) ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([lireJetonDansCookie]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      // `passport.r3` : sans épinglage, la lib accepte n'importe quel algorithme
      // HMAC — c'est alors l'attaquant qui choisit, ce qui ne doit jamais arriver.
      algorithms: ['HS256'],
    });
  }

  // Passport a déjà vérifié la signature et l'expiration : ce que renvoie `validate`
  // devient `request.user`.
  validate(charge: ChargeUtileJeton): IdentiteRequete {
    return { id: charge.sub, role: charge.role };
  }
}
