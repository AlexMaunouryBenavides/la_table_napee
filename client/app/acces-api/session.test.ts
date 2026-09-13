import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErreurApi } from './erreur-api';
import { chargerSession } from './session';

const URL_API = 'https://api.test/api';

function reponseJson(statut: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fetchQuiRend(reponse: Response) {
  return vi.fn<typeof fetch>(() => Promise.resolve(reponse));
}

beforeEach(() => {
  vi.stubEnv('VITE_URL_API', URL_API);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('chargerSession', () => {
  it('rend l’utilisateur connecté', async () => {
    const moi = {
      id: 'e8b1',
      pseudo: 'Alexandre',
      email: 'a@b.fr',
      role: 'admin',
      dateCreation: '2026-01-01T00:00:00.000Z',
    };
    vi.stubGlobal('fetch', fetchQuiRend(reponseJson(200, moi)));

    await expect(chargerSession()).resolves.toEqual(moi);
  });

  it('rend null pour un visiteur : ne pas être connecté n’est pas une erreur', async () => {
    vi.stubGlobal(
      'fetch',
      fetchQuiRend(
        reponseJson(401, { statusCode: 401, message: 'Non authentifié' }),
      ),
    );

    await expect(chargerSession()).resolves.toBeNull();
  });

  it('laisse passer une panne : une API en rade n’est pas un visiteur', async () => {
    // Avaler ce cas afficherait un site anonyme et muet au lieu d'une panne.
    vi.stubGlobal(
      'fetch',
      fetchQuiRend(
        reponseJson(500, { statusCode: 500, message: 'Erreur interne' }),
      ),
    );

    await expect(chargerSession()).rejects.toBeInstanceOf(ErreurApi);
  });
});
