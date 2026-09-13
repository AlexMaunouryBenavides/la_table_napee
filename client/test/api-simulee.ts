import { afterEach, beforeEach, vi } from 'vitest';

const URL_API = 'https://api.test/api';
const INTROUVABLE = 404;

beforeEach(() => {
  vi.stubEnv('VITE_URL_API', URL_API);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

export function json(statut: number, corps?: unknown): Response {
  return new Response(corps === undefined ? null : JSON.stringify(corps), {
    status: statut,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Chemin d'API (`/utilisateurs/moi`, `/recettes?limite=3`…) → réponse, rejouée à
 *  chaque appel. Un chemin non prévu répond 404 : un appel inattendu se voit. */
export type ReponsesSimulees = Record<string, () => Response>;

export function simulerApi(reponses: ReponsesSimulees) {
  const faux = vi.fn<typeof fetch>((entree) => {
    const chemin = (entree as string).replace(URL_API, '');
    const reponse = reponses[chemin];

    return Promise.resolve(
      reponse === undefined
        ? json(INTROUVABLE, { statusCode: INTROUVABLE, message: 'Introuvable' })
        : reponse(),
    );
  });
  vi.stubGlobal('fetch', faux);

  return {
    appelsA: (chemin: string) =>
      faux.mock.calls.filter(([entree]) => entree === `${URL_API}${chemin}`)
        .length,
  };
}
