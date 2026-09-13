import type { Page, RecetteResume } from '@recipe/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  json,
  simulerApi,
  type ReponsesSimulees,
} from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';

import { useCatalogue } from './requetes-catalogue';

function page(total: number, ids: number[]): Page<RecetteResume> {
  return {
    donnees: ids.map((id) => ({
      id,
      titre: `Recette ${String(id)}`,
      image: '',
      difficulte: 'facile',
      typeRecette: 'dessert',
      tempsPreparation: 10,
      tempsCuisson: 0,
      portions: 2,
      nationalite: 'Française',
      noteMoyenne: null,
    })),
    total,
    page: 1,
    limite: 12,
  };
}

const REFERENTIELS: ReponsesSimulees = {
  '/regimes': () => json(200, [{ id: 1, nom: 'Végétarien' }]),
  '/criteres-sante': () => json(200, []),
  '/types-aliment': () => json(200, []),
  '/nationalites': () => json(200, []),
};

function rendre(criteres: string) {
  return renderHook(
    ({ recherche }) => useCatalogue(new URLSearchParams(recherche)),
    { wrapper: AvecRequetes, initialProps: { recherche: criteres } },
  );
}

/** Desserts (2) affichés, plats (1) prêts côté API : le point de départ d'un
 *  changement de filtre. */
async function dessertsAffiches() {
  const api = simulerApi({
    ...REFERENTIELS,
    '/recettes?type=dessert': () => json(200, page(2, [4, 9])),
    '/recettes?type=plat': () => json(200, page(1, [7])),
  });
  const rendu = rendre('type=dessert');
  await waitFor(() => {
    expect(rendu.result.current.resultats?.total).toBe(2);
  });

  return { api, ...rendu };
}

describe('useCatalogue', () => {
  it('rend les recettes et le total qui correspondent aux critères de l’URL', async () => {
    simulerApi({
      ...REFERENTIELS,
      '/recettes?type=dessert': () => json(200, page(2, [4, 9])),
    });

    const { result } = rendre('type=dessert');

    await waitFor(() => {
      expect(result.current.resultats?.total).toBe(2);
    });
    expect(result.current.resultats?.donnees.map((r) => r.id)).toEqual([4, 9]);
    expect(result.current.referentiels.regimes).toHaveLength(1);
  });

  it('réaffiche une page déjà vue depuis le cache, sans nouvel appel', async () => {
    const { api, result, rerender } = await dessertsAffiches();

    rerender({ recherche: 'type=plat' });
    await waitFor(() => {
      expect(result.current.resultats?.total).toBe(1);
    });
    rerender({ recherche: 'type=dessert' });

    expect(result.current.resultats?.total).toBe(2);
    expect(api.appelsA('/recettes?type=dessert')).toBe(1);
  });

  it('garde la liste précédente affichée pendant le chargement de la suivante', async () => {
    const { result, rerender } = await dessertsAffiches();

    rerender({ recherche: 'type=plat' });

    // Aussitôt après le changement : la nouvelle page n'est pas encore arrivée.
    expect(result.current.resultats?.total).toBe(2);
    await waitFor(() => {
      expect(result.current.resultats?.total).toBe(1);
    });
  });

  it('rend l’échec de la liste sans perdre les filtres', async () => {
    simulerApi({
      ...REFERENTIELS,
      '/recettes?tempsMax=abc': () =>
        json(400, {
          statusCode: 400,
          message: 'Requête invalide',
          details: ['tempsMax doit être un nombre'],
        }),
    });

    const { result } = rendre('tempsMax=abc');

    await waitFor(() => {
      expect(result.current.echecListe).toEqual({
        message: 'Requête invalide',
        details: ['tempsMax doit être un nombre'],
      });
    });
    expect(result.current.resultats).toBeNull();
    await waitFor(() => {
      expect(result.current.referentiels.regimes).toHaveLength(1);
    });
  });
});
