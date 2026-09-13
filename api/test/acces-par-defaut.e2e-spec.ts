// `nest-authz.r1` — deny-by-default : une route sans annotation est FERMÉE. Seules
// les routes explicitement marquées `@Public()` restent ouvertes.
//
// Ce qui est éprouvé ici, c'est l'oubli : une route à laquelle personne n'a pensé
// doit répondre 401, pas laisser entrer.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus } from '@nestjs/common';
import request from 'supertest';

import {
  COOKIE_ACCES,
  connecter,
  contexteAuth,
  inscrire,
  marque,
  rafraichir,
  refreshDe,
  valeurCookie,
} from './aide-auth';

// Identifiants volontairement absents de la base : ce test juge le GARDE, pas le
// contenu. Un 404 prouve que la requête a atteint le handler ; un 401 qu'elle a été
// arrêtée avant.
const INEXISTANT = 999_999;

const contexte = contexteAuth('acces');

const cheminAvis = `/api/avis/${INEXISTANT}`;

describe('Route non annotée', () => {
  it('refuse un visiteur anonyme (401)', () =>
    request(contexte.app.getHttpServer())
      .patch(cheminAvis)
      .send({ note: 4 })
      .expect(HttpStatus.UNAUTHORIZED));

  it('laisse passer un utilisateur authentifié jusqu’au handler (404)', async () => {
    const connexion = await connecter(contexte.app, contexte.email).expect(
      HttpStatus.OK,
    );

    await request(contexte.app.getHttpServer())
      .patch(cheminAvis)
      .set('Cookie', `${COOKIE_ACCES}=${valeurCookie(connexion, COOKIE_ACCES)}`)
      .send({ note: 4 })
      .expect(HttpStatus.NOT_FOUND);
  });
});

describe('Routes publiques', () => {
  it('la liste des recettes reste ouverte', () =>
    request(contexte.app.getHttpServer())
      .get('/api/recettes')
      .expect(HttpStatus.OK));

  it('les avis d’une recette restent ouverts (404, pas 401)', () =>
    request(contexte.app.getHttpServer())
      .get(`/api/recettes/${INEXISTANT}/avis`)
      .expect(HttpStatus.NOT_FOUND));

  it('l’inscription reste ouverte', () =>
    inscrire(contexte.app, `${marque('acces-bis')}@exemple.test`).expect(
      HttpStatus.CREATED,
    ));

  it('le rafraîchissement reste ouvert sans jeton d’accès', async () => {
    const connexion = await connecter(contexte.app, contexte.email).expect(
      HttpStatus.OK,
    );

    // Aucun cookie d'accès n'est présenté : si la route était protégée par le garde
    // global, elle répondrait 401 au lieu de rafraîchir.
    await rafraichir(contexte.app, refreshDe(connexion)).expect(HttpStatus.OK);
  });
});
