import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  creerCategorie,
  renommerCategorie,
  supprimerCategorie,
} from '../acces-api/categories';
import { ErreurApi } from '../acces-api/erreur-api';

import {
  executerCreation,
  executerRenommage,
  executerSuppressionCategorie,
} from './mutations-categories';

vi.mock('../acces-api/categories');

const VEGAN = { id: 3, nom: 'Végan' };

beforeEach(() => {
  vi.mocked(creerCategorie).mockReset().mockResolvedValue(VEGAN);
  vi.mocked(renommerCategorie).mockReset().mockResolvedValue(VEGAN);
  vi.mocked(supprimerCategorie).mockReset().mockResolvedValue(undefined);
});

describe('les écritures d’une catégorie', () => {
  it('crée sur la ressource de l’onglet, nom nettoyé de ses espaces', async () => {
    await executerCreation('criteres-sante', '  Peu de sel ');

    expect(creerCategorie).toHaveBeenCalledWith('criteres-sante', 'Peu de sel');
  });

  it('renomme la valeur visée', async () => {
    await executerRenommage('regimes', 3, 'Végétalien');

    expect(renommerCategorie).toHaveBeenCalledWith('regimes', 3, 'Végétalien');
  });
});

describe('les refus', () => {
  it('explique une catégorie encore utilisée, et donne la sortie', async () => {
    // Le nombre de recettes n'est pas connu — l'API ne le renvoie pas — mais le
    // chemin pour aller les voir, si.
    vi.mocked(supprimerCategorie).mockRejectedValue(
      new ErreurApi(409, 'Cette catégorie est encore utilisée'),
    );

    const resultat = await executerSuppressionCategorie('regimes', 3);

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/utilisée/i);
    expect(resultat.versRecettes).toBe('/recettes?regime=3');
  });

  it('rattache un nom déjà pris au champ, pas au bandeau', async () => {
    vi.mocked(creerCategorie).mockRejectedValue(
      new ErreurApi(409, 'Ce nom est déjà utilisé'),
    );

    const resultat = await executerCreation('regimes', 'Végan');

    expect(resultat.champNom).toMatch(/déjà utilisé/i);
    expect(resultat.message).toBeUndefined();
  });

  it('traite un 404 comme « déjà supprimée »', async () => {
    vi.mocked(supprimerCategorie).mockRejectedValue(
      new ErreurApi(404, 'Catégorie introuvable'),
    );

    const resultat = await executerSuppressionCategorie('regimes', 3);

    expect(resultat.succes).toBe(true);
  });
});
