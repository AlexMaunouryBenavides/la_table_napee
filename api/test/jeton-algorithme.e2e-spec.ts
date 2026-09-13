// `passport.r3` — l'algorithme de signature doit être épinglé côté vérification.
//
// Sans épinglage, la bibliothèque accepte n'importe quel algorithme HMAC dès lors que
// la signature colle : un attaquant choisit alors l'algorithme, ce qui n'est jamais
// censé être de son ressort.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type ChargeUtileJeton } from '@recipe/types';
import request from 'supertest';

import { COOKIE_ACCES, contexteAuth } from './aide-auth';

const INEXISTANT = 999_999;
const DUREE = '5m';

const contexte = contexteAuth('algo');

const charge: ChargeUtileJeton = {
  sub: '00000000-0000-4000-8000-000000000000',
  role: 'utilisateur',
};

function forger(algorithm: 'HS256' | 'HS512'): string {
  return new JwtService().sign(charge, {
    secret: process.env.JWT_SECRET,
    algorithm,
    expiresIn: DUREE,
  });
}

const appeler = (jeton: string) =>
  request(contexte.app.getHttpServer())
    .patch(`/api/avis/${INEXISTANT}`)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`)
    .send({ note: 4 });

describe('Algorithme du jeton d’accès', () => {
  it('refuse un jeton signé avec un autre algorithme (HS512)', () =>
    appeler(forger('HS512')).expect(HttpStatus.UNAUTHORIZED));

  // Témoin : sans lui, le test précédent passerait même si TOUS les jetons étaient
  // refusés pour une autre raison.
  it('accepte la même charge signée en HS256', () =>
    appeler(forger('HS256')).expect(HttpStatus.NOT_FOUND));
});
