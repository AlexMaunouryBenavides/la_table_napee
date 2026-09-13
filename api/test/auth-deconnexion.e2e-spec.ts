// La déconnexion doit couper la session des DEUX côtés : révoquée en base, effacée
// du navigateur.
//
//   npm run test:e2e   (docker compose up -d + migration:run:test au préalable)

import request from 'supertest';

import {
  connecter,
  contexteAuth,
  COOKIE_ACCES,
  COOKIE_RAFRAICHISSEMENT,
  jetonStocke,
  rafraichir,
  refreshDe,
  valeurCookie,
} from './aide-auth';

const contexte = contexteAuth('out');

it('révoque la session, efface les cookies et rend le refresh inutilisable', async () => {
  const { app, source, email } = contexte;
  const ouverture = await connecter(app, email).expect(200);
  const refresh = refreshDe(ouverture);

  const sortie = await request(app.getHttpServer())
    .post('/api/auth/deconnexion')
    .set('Cookie', [
      `${COOKIE_ACCES}=${valeurCookie(ouverture, COOKIE_ACCES) ?? ''}`,
      `${COOKIE_RAFRAICHISSEMENT}=${refresh}`,
    ])
    .expect(204);

  // Cookies effacés : valeur vide et expiration dans le passé.
  const effaces = sortie.get('Set-Cookie') ?? [];
  expect(effaces).toHaveLength(2);
  expect(effaces.every((cookie) => cookie.includes('=;'))).toBe(true);

  expect((await jetonStocke(source, refresh))?.etat).toBe('REVOKED');
  await rafraichir(app, refresh).expect(401);
});

it('refuse la déconnexion sans access token valide (401)', async () => {
  await request(contexte.app.getHttpServer())
    .post('/api/auth/deconnexion')
    .expect(401);
});
