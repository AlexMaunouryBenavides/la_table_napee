import type { Page, RecetteResume } from '@recipe/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listerRecettes } from '../acces-api/recettes';
import { listerUtilisateurs } from '../acces-api/utilisateurs';

import { chargerTableauDeBord } from './chargement-tableau-de-bord';

vi.mock('../acces-api/recettes');
vi.mock('../acces-api/utilisateurs');

function page<T>(donnees: T[], total: number): Page<T> {
  return { donnees, total, page: 1, limite: 5 };
}

const RECETTE: RecetteResume = {
  id: 1,
  titre: 'Coulis de tomate au basilic',
  image: 'coulis.jpg',
  difficulte: 'facile',
  typeRecette: 'sauce',
  tempsPreparation: 10,
  tempsCuisson: 20,
  portions: 4,
  nationalite: 'Italienne',
  noteMoyenne: 4,
};

beforeEach(() => {
  vi.mocked(listerRecettes)
    .mockReset()
    .mockResolvedValue(page([RECETTE], 241));
  vi.mocked(listerUtilisateurs).mockReset().mockResolvedValue(page([], 1384));
});

describe('chargerTableauDeBord — ce qu’on a le droit de demander', () => {
  it('ne demande pas le compte des utilisateurs à un modérateur', async () => {
    // `GET /utilisateurs` est réservé à l'admin : on ne réclame pas une statistique
    // qu'on n'a pas le droit de lire, l'API répondrait 403.
    const donnees = await chargerTableauDeBord('moderateur');

    expect(listerUtilisateurs).not.toHaveBeenCalled();
    expect(donnees.comptes).toBe('non-demande');
  });

  it('le demande à un administrateur', async () => {
    const donnees = await chargerTableauDeBord('admin');

    expect(donnees.comptes).toBe(1384);
  });
});

describe('chargerTableauDeBord — échecs séparés', () => {
  it('garde les recettes quand le compte des utilisateurs tombe', async () => {
    vi.mocked(listerUtilisateurs).mockRejectedValue(new Error('502'));

    const donnees = await chargerTableauDeBord('admin');

    expect(donnees.recettes).not.toBe('echec');
    expect(donnees.comptes).toBe('echec');
  });

  it('dit « inconnu » et non « zéro » quand une statistique manque', async () => {
    // Un 0 se lit « il n'y en a aucun ». Ce n'est pas ce qu'on sait.
    vi.mocked(listerRecettes).mockRejectedValue(new Error('502'));

    const donnees = await chargerTableauDeBord('admin');

    expect(donnees.recettes).toBe('echec');
    expect(donnees.recettes).not.toBe(0);
  });
});

describe('chargerTableauDeBord — nombre d’appels', () => {
  it('tire le compteur ET les cinq dernières recettes d’un seul appel', async () => {
    // La réponse paginée porte `total` en plus de ses lignes : compter puis lister
    // ferait deux allers-retours pour la même information.
    await chargerTableauDeBord('admin');

    expect(listerRecettes).toHaveBeenCalledTimes(1);
    expect(vi.mocked(listerRecettes).mock.calls[0]?.[0].get('limite')).toBe(
      '5',
    );
  });
});
