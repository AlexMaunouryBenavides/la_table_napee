import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { RECETTE } from '../../test/recette-exemple';
import { AvecRequetes } from '../../test/requetes';
import { clientLoader } from '../routes/detail-recette';

import { useRecette } from './requete-recette';

const charger = (id: string) =>
  clientLoader({ params: { id } } as unknown as Parameters<
    typeof clientLoader
  >[0]);

describe('le détail d’une recette', () => {
  it('rend la recette avec ses avis et sa note', async () => {
    simulerApi({
      '/recettes/7': () => json(200, { ...RECETTE, noteMoyenne: 4.5 }),
    });

    await charger('7');
    const { result } = renderHook(() => useRecette(7), {
      wrapper: AvecRequetes,
    });

    expect(result.current.titre).toBe('Tarte fine aux tomates');
    expect(result.current.noteMoyenne).toBe(4.5);
  });

  it('répond 404 quand la recette n’existe pas', async () => {
    simulerApi({
      '/recettes/999': () =>
        json(404, { statusCode: 404, message: 'Recette introuvable' }),
    });

    // `data(…, { status })` : React Router en fait une réponse d'erreur 404 pour
    // l'`ErrorBoundary`, qui affiche alors la page introuvable.
    await expect(charger('999')).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  it('garde en cache une recette déjà ouverte', async () => {
    const api = simulerApi({ '/recettes/7': () => json(200, RECETTE) });

    await charger('7');
    await charger('7');

    expect(api.appelsA('/recettes/7')).toBe(1);
  });
});
