// Le cœur de la sécurité des sessions : chaque refresh est à usage unique, et un
// jeton qui resurgit prouve qu'une copie circule. Ces règles ne se voient qu'en bout
// de chaîne — cookie posé, ligne en base — donc en e2e.
//
//   npm run test:e2e   (docker compose up -d + migration:run:test au préalable)

import {
  connecter,
  contexteAuth,
  jetonStocke,
  rafraichir,
  refreshDe,
} from './aide-auth';

const contexte = contexteAuth('rot');

// Ouvre une session et la fait tourner une fois : le point de départ des deux tests.
async function sessionTournee(): Promise<{ premier: string; second: string }> {
  const { app, email } = contexte;
  const premier = refreshDe(await connecter(app, email).expect(200));
  const second = refreshDe(await rafraichir(app, premier).expect(200));
  return { premier, second };
}

it('tourne le jeton dans la même famille et marque le précédent USED', async () => {
  const { source } = contexte;
  const { premier, second } = await sessionTournee();

  expect(second).not.toBe(premier);

  const ancien = await jetonStocke(source, premier);
  const nouveau = await jetonStocke(source, second);

  expect(ancien?.etat).toBe('USED');
  expect(nouveau?.etat).toBe('ACTIVE');
  // Même lignée : c'est elle qu'on révoquera d'un coup en cas de vol.
  expect(nouveau?.familleId).toBe(ancien?.familleId);
});

it('révoque TOUTE la famille quand un jeton déjà utilisé resurgit', async () => {
  const { app, source } = contexte;
  const { premier, second } = await sessionTournee();

  // Le même jeton présenté une seconde fois : deux parties le détiennent.
  await rafraichir(app, premier).expect(401);

  expect((await jetonStocke(source, premier))?.etat).toBe('REVOKED');
  expect((await jetonStocke(source, second))?.etat).toBe('REVOKED');
});
