import { type ConfigService } from '@nestjs/config';
import { type CookieOptions, type Response } from 'express';

import { type CoupleDeJetons } from './jetons.service';

export const COOKIE_ACCES = 'jeton_acces';
export const COOKIE_RAFRAICHISSEMENT = 'jeton_rafraichissement';

const MS_PAR_MINUTE = 60_000;
const MS_PAR_JOUR = 86_400_000;
const ENV_PRODUCTION = 'production';

export interface OptionsCookiesAuth {
  accesMinutes: number;
  rafraichissementJours: number;
  // `Secure` interdit l'envoi du cookie en clair — donc impossible en développement,
  // où l'on est en http. Déduit de l'environnement, jamais d'une variable à part :
  // une variable serait un jour mise à `false` en production.
  secure: boolean;
}

/** Une seule lecture de la configuration pour tous les contrôleurs qui posent des
 *  cookies d'auth : deux copies finiraient par diverger sur `secure`. */
export function optionsCookiesDepuis(
  config: ConfigService,
): OptionsCookiesAuth {
  return {
    accesMinutes: config.getOrThrow<number>('ACCES_MINUTES'),
    rafraichissementJours: config.getOrThrow<number>('RAFRAICHISSEMENT_JOURS'),
    secure: config.getOrThrow<string>('NODE_ENV') === ENV_PRODUCTION,
  };
}

// `cookie-parser` remplit `request.cookies`, mais Express le type en `any`. On le
// resserre ici, une seule fois, plutôt que de promener un cast dans chaque appelant.
export function lireCookie(requete: unknown, nom: string): string | undefined {
  return (requete as { cookies?: Record<string, string> }).cookies?.[nom];
}

// httpOnly : invisible au JavaScript, donc involable par XSS.
// sameSite lax : pas envoyé sur une requête déclenchée par un autre site (anti-CSRF).
function options(secure: boolean, dureeMs?: number): CookieOptions {
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

// Le navigateur n'efface un cookie que si les options correspondent à celles de la
// pose : mêmes `path`, `sameSite` et `secure`, sinon il en crée un second.
export function effacerCookiesAuth(reponse: Response, secure: boolean): void {
  for (const nom of [COOKIE_ACCES, COOKIE_RAFRAICHISSEMENT]) {
    reponse.clearCookie(nom, options(secure));
  }
}
