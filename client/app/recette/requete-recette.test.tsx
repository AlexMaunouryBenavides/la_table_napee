import type { Recette } from '@recipe/types';
import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';
import { clientAction, clientLoader } from '../routes/detail-recette';

import { useRecette } from './requete-recette';

const RECETTE: Recette = {
  id: 7,
  titre: 'Tarte fine aux tomates',
  description: 'Une pâte sablée et des tomates confites.',
  image: '',
  video: null,
  difficulte: 'moyen',
  typeRecette: 'plat',
  nationalite: { id: 1, nom: 'Française' },
  tempsPreparation: 45,
  tempsCuisson: 25,
  portions: 4,
  compositions: [],
  etapes: [],
  avis: [],
  regimes: [],
  criteresSante: [],
  typesAliment: [],
  auteur: null,
  dateCreation: '2026-03-04T12:00:00.000Z',
  noteMoyenne: null,
};

const charger = (id: string) =>
  clientLoader({ params: { id } } as unknown as Parameters<
    typeof clientLoader
  >[0]);

function Note() {
  const recette = useRecette(RECETTE.id);

  return <p>note : {recette.noteMoyenne ?? 'aucune'}</p>;
}

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

  it('relit la note après le dépôt d’un avis, sans recharger la page', async () => {
    let note: number | null = null;
    simulerApi({
      '/recettes/7': () => json(200, { ...RECETTE, noteMoyenne: note }),
      '/recettes/7/avis': () => {
        note = 4;
        return json(201, {});
      },
    });
    await charger('7');
    render(
      <AvecRequetes>
        <Note />
      </AvecRequetes>,
    );
    expect(screen.getByText('note : aucune')).toBeInTheDocument();

    const formulaire = new FormData();
    formulaire.set('intention', 'deposer');
    formulaire.set('note', '4');
    await clientAction({
      params: { id: '7' },
      request: new Request('http://localhost/recettes/7', {
        method: 'POST',
        body: formulaire,
      }),
    } as unknown as Parameters<typeof clientAction>[0]);

    expect(await screen.findByText('note : 4')).toBeInTheDocument();
  });

  it('garde en cache une recette déjà ouverte', async () => {
    const api = simulerApi({ '/recettes/7': () => json(200, RECETTE) });

    await charger('7');
    await charger('7');

    expect(api.appelsA('/recettes/7')).toBe(1);
  });
});
