import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appelerApi } from './appeler-api';
import { ErreurApi } from './erreur-api';

const URL_API = 'https://api.test/api';

/** Réponse JSON de l'API, succès ou échec selon le statut. */
function reponse(statut: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'Content-Type': 'application/json' },
  });
}

function erreurDeLApi(
  statut: number,
  message: string,
  details?: string[],
): Response {
  return reponse(statut, {
    statusCode: statut,
    message,
    timestamp: '2026-09-11T09:00:00.000Z',
    path: '/api/recettes',
    ...(details === undefined ? {} : { details }),
  });
}

/** Le faux `fetch` du test : chaque appel consomme la réponse suivante de la file. */
function fauxFetch(...reponses: Response[]) {
  const file = [...reponses];

  return vi.fn<typeof fetch>(() => {
    const suivante = file.shift();
    if (suivante === undefined) {
      throw new Error('fetch appelé plus de fois que le test ne le prévoit');
    }
    return Promise.resolve(suivante);
  });
}

/** Les options passées à `fetch` lors du n-ième appel. */
function initDuFetch(mock: ReturnType<typeof fauxFetch>, index: number) {
  return mock.mock.calls[index]?.[1];
}

function urlDuFetch(mock: ReturnType<typeof fauxFetch>, index: number) {
  return mock.mock.calls[index]?.[0] as string | undefined;
}

beforeEach(() => {
  vi.stubEnv('VITE_URL_API', URL_API);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('appelerApi — la requête qui part', () => {
  it('envoie les cookies : sans cela, aucune route protégée ne répond', async () => {
    const fetchSimule = fauxFetch(reponse(200, { donnees: [] }));
    vi.stubGlobal('fetch', fetchSimule);

    await appelerApi('/recettes');

    expect(initDuFetch(fetchSimule, 0)?.credentials).toBe('include');
  });

  it("préfixe le chemin par l'URL de base de l'API", async () => {
    const fetchSimule = fauxFetch(reponse(200, {}));
    vi.stubGlobal('fetch', fetchSimule);

    await appelerApi('/recettes');

    expect(urlDuFetch(fetchSimule, 0)).toBe(`${URL_API}/recettes`);
  });

  it('sérialise un corps en JSON et annonce le type de contenu', async () => {
    const fetchSimule = fauxFetch(reponse(201, { id: 1 }));
    vi.stubGlobal('fetch', fetchSimule);

    await appelerApi('/recettes', {
      methode: 'POST',
      corps: { titre: 'Tarte aux pommes' },
    });

    const init = initDuFetch(fetchSimule, 0);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ titre: 'Tarte aux pommes' }));
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it("n'envoie ni corps ni type de contenu sur une lecture", async () => {
    const fetchSimule = fauxFetch(reponse(200, {}));
    vi.stubGlobal('fetch', fetchSimule);

    await appelerApi('/recettes');

    const init = initDuFetch(fetchSimule, 0);
    expect(init?.method).toBe('GET');
    expect(init?.body).toBeUndefined();
    expect(init?.headers).toBeUndefined();
  });
});

describe('appelerApi — la réponse qui revient', () => {
  it('rend le JSON parsé', async () => {
    const attendu = { donnees: [{ id: 1 }], total: 1, page: 1, limite: 20 };
    vi.stubGlobal('fetch', fauxFetch(reponse(200, attendu)));

    await expect(appelerApi('/recettes')).resolves.toEqual(attendu);
  });

  it('encaisse un 204 sans corps', async () => {
    vi.stubGlobal('fetch', fauxFetch(new Response(null, { status: 204 })));

    await expect(
      appelerApi('/avis/1', { methode: 'DELETE' }),
    ).resolves.toBeUndefined();
  });
});

describe('appelerApi — les échecs', () => {
  it("porte le statut et le message de l'API", async () => {
    vi.stubGlobal('fetch', fauxFetch(erreurDeLApi(400, 'Requête invalide')));

    const erreur = await appelerApi('/recettes').catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(ErreurApi);
    expect((erreur as ErreurApi).statut).toBe(400);
    expect((erreur as ErreurApi).message).toBe('Requête invalide');
  });

  it("transporte details[] jusqu'à l'écran, qui en fait des erreurs de champ", async () => {
    const details = [
      'titre should not be empty',
      'difficulte must be one of...',
    ];
    vi.stubGlobal(
      'fetch',
      fauxFetch(erreurDeLApi(400, 'Requête invalide', details)),
    );

    const erreur = await appelerApi('/recettes').catch((e: unknown) => e);

    expect((erreur as ErreurApi).details).toEqual(details);
  });

  it('lève quand même sur un corps qui n’est pas du JSON', async () => {
    vi.stubGlobal(
      'fetch',
      fauxFetch(
        new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const erreur = await appelerApi('/recettes').catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(ErreurApi);
    expect((erreur as ErreurApi).statut).toBe(502);
  });

  it("lève quand l'API est injoignable, jamais un undefined silencieux", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.reject(new TypeError('Failed to fetch')),
      ),
    );

    const erreur = await appelerApi('/recettes').catch((e: unknown) => e);

    expect(erreur).toBeInstanceOf(ErreurApi);
  });
});

describe('appelerApi — le rafraîchissement transparent', () => {
  it('rafraîchit sur 401 puis rejoue la requête', async () => {
    const attendu = { id: 1, titre: 'Tarte aux pommes' };
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'Non authentifié'),
      reponse(200, { ok: true }),
      reponse(200, attendu),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await expect(appelerApi('/recettes/1')).resolves.toEqual(attendu);

    expect(urlDuFetch(fetchSimule, 1)).toBe(`${URL_API}/auth/rafraichissement`);
    expect(urlDuFetch(fetchSimule, 2)).toBe(`${URL_API}/recettes/1`);
    expect(fetchSimule).toHaveBeenCalledTimes(3);
  });

  it('ne rejoue qu’une fois : un 401 sur le rejeu lève, sans nouvelle tentative', async () => {
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'Non authentifié'),
      reponse(200, { ok: true }),
      erreurDeLApi(401, 'Non authentifié'),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await expect(appelerApi('/recettes/1')).rejects.toBeInstanceOf(ErreurApi);

    expect(fetchSimule).toHaveBeenCalledTimes(3);
  });

  it('lève sans rejouer quand le rafraîchissement échoue', async () => {
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'Non authentifié'),
      erreurDeLApi(401, 'Session expirée'),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await expect(appelerApi('/recettes/1')).rejects.toBeInstanceOf(ErreurApi);

    expect(fetchSimule).toHaveBeenCalledTimes(2);
  });

  it('ne rafraîchit qu’une seule fois pour deux appels parallèles', async () => {
    // Sans mise en commun, la rotation du jeton invaliderait la famille et
    // déconnecterait l'utilisateur dès qu'un écran charge deux listes.
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'Non authentifié'),
      erreurDeLApi(401, 'Non authentifié'),
      reponse(200, { ok: true }),
      reponse(200, { liste: 'recettes' }),
      reponse(200, { liste: 'avis' }),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await Promise.all([appelerApi('/recettes'), appelerApi('/avis')]);

    const rafraichissements = fetchSimule.mock.calls.filter(
      (appel) => appel[0] === `${URL_API}/auth/rafraichissement`,
    );
    expect(rafraichissements).toHaveLength(1);
  });

  it('rafraîchit de nouveau lors d’un 401 ultérieur', async () => {
    // Preuve que la promesse partagée est relâchée : sans cela, la session
    // resterait bloquée après le tout premier rafraîchissement.
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'Non authentifié'),
      reponse(200, { ok: true }),
      reponse(200, { premier: true }),
      erreurDeLApi(401, 'Non authentifié'),
      reponse(200, { ok: true }),
      reponse(200, { second: true }),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await appelerApi('/recettes');
    await expect(appelerApi('/recettes')).resolves.toEqual({ second: true });

    expect(fetchSimule).toHaveBeenCalledTimes(6);
  });

  it('ne rafraîchit pas sur un échec de connexion : c’est un mot de passe faux', async () => {
    const fetchSimule = fauxFetch(
      erreurDeLApi(401, 'E-mail ou mot de passe incorrect'),
    );
    vi.stubGlobal('fetch', fetchSimule);

    await expect(
      appelerApi('/auth/connexion', {
        methode: 'POST',
        corps: { email: 'a@b.fr', motDePasse: 'faux' },
      }),
    ).rejects.toBeInstanceOf(ErreurApi);

    expect(fetchSimule).toHaveBeenCalledTimes(1);
  });

  it('ne se rafraîchit pas lui-même : sinon la récursion est infinie', async () => {
    const fetchSimule = fauxFetch(erreurDeLApi(401, 'Session expirée'));
    vi.stubGlobal('fetch', fetchSimule);

    await expect(
      appelerApi('/auth/rafraichissement', { methode: 'POST' }),
    ).rejects.toBeInstanceOf(ErreurApi);

    expect(fetchSimule).toHaveBeenCalledTimes(1);
  });
});
