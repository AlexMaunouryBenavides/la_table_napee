import { type CookieOptions, type Response } from 'express';

import { type CoupleDeJetons } from './jetons.service';

const COOKIE_ACCES = 'jeton_acces';
const COOKIE_RAFRAICHISSEMENT = 'jeton_rafraichissement';

const MS_PAR_MINUTE = 60_000;
const MS_PAR_JOUR = 86_400_000;

export interface OptionsCookiesAuth {
  accesMinutes: number;
  rafraichissementJours: number;
  // `Secure` interdit l'envoi du cookie en clair — donc impossible en développement,
  // où l'on est en http. Déduit de l'environnement, jamais d'une variable à part :
  // une variable serait un jour mise à `false` en production.
  secure: boolean;
}

// httpOnly : invisible au JavaScript, donc involable par XSS.
// sameSite lax : pas envoyé sur une requête déclenchée par un autre site (anti-CSRF).
function options(secure: boolean, dureeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: dureeMs,
  };
}

export function poserCookiesAuth(
  reponse: Response,
  jetons: CoupleDeJetons,
  { accesMinutes, rafraichissementJours, secure }: OptionsCookiesAuth,
): void {
  reponse.cookie(
    COOKIE_ACCES,
    jetons.acces,
    options(secure, accesMinutes * MS_PAR_MINUTE),
  );
  reponse.cookie(
    COOKIE_RAFRAICHISSEMENT,
    jetons.rafraichissement,
    options(secure, rafraichissementJours * MS_PAR_JOUR),
  );
}
