import type { Page, RecetteResume } from '@recipe/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';

import { useRecettesAccueil } from './recettes-accueil';

const CHEMIN = '/recettes?limite=3';

function recette(id: number): RecetteResume {
  return {
    id,
    titre: `Recette ${String(id)}`,
    image: '',
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: null,
  };
}

const PAGE: Page<RecetteResume> = {
  donnees: [recette(1), recette(2), recette(3)],
  total: 53,
  page: 1,
  limite: 3,
};

describe('useRecettesAccueil', () => {
  it('rend les trois dernières recettes et le total du catalogue', async () => {
    simulerApi({ [CHEMIN]: () => json(200, PAGE) });

    const { result } = renderHook(useRecettesAccueil, {
      wrapper: AvecRequetes,
    });

    await waitFor(() => {
      expect(result.current.total).toBe(53);
    });
    expect(result.current.recettes.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(result.current.echec).toBeNull();
  });

  it('rend un message d’échec et un total inconnu, pas zéro, quand l’API est en panne', async () => {
    simulerApi({
      [CHEMIN]: () =>
        json(500, { statusCode: 500, message: 'Le service est en panne.' }),
    });

    const { result } = renderHook(useRecettesAccueil, {
      wrapper: AvecRequetes,
    });

    await waitFor(() => {
      expect(result.current.echec).toBe('Le service est en panne.');
    });
    expect(result.current.total).toBeNull();
    expect(result.current.recettes).toEqual([]);
  });

  it('réaffiche les recettes depuis le cache quand on revient sur l’accueil', async () => {
    const api = simulerApi({ [CHEMIN]: () => json(200, PAGE) });
    const premiere = renderHook(useRecettesAccueil, { wrapper: AvecRequetes });
    await waitFor(() => {
      expect(premiere.result.current.total).toBe(53);
    });
    premiere.unmount();

    const retour = renderHook(useRecettesAccueil, { wrapper: AvecRequetes });

    // Tout de suite, sans attendre : les données sont déjà là.
    expect(retour.result.current.total).toBe(53);
    expect(api.appelsA(CHEMIN)).toBe(1);
  });
});
