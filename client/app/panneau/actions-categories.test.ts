import { beforeEach, describe, expect, it, vi } from 'vitest';

import { donneesDeFormulaire } from '../../test/formulaire';
import {
  creerCategorie,
  renommerCategorie,
  supprimerCategorie,
} from '../acces-api/categories';
import { ErreurApi } from '../acces-api/erreur-api';

import { executerActionCategorie } from './actions-categories';

vi.mock('../acces-api/categories');

const VEGAN = { id: 3, nom: 'Végan' };

beforeEach(() => {
  vi.mocked(creerCategorie).mockReset().mockResolvedValue(VEGAN);
  vi.mocked(renommerCategorie).mockReset().mockResolvedValue(VEGAN);
  vi.mocked(supprimerCategorie).mockReset().mockResolvedValue(undefined);
});

describe('executerActionCategorie — aiguillage', () => {
  it('crée sur la ressource de l’onglet', async () => {
    await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'creation',
        ressource: 'criteres-sante',
        nom: 'Peu de sel',
      }),
    );

    expect(creerCategorie).toHaveBeenCalledWith('criteres-sante', 'Peu de sel');
    expect(renommerCategorie).not.toHaveBeenCalled();
  });

  it('renomme sans supprimer', async () => {
    await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'renommage',
        ressource: 'regimes',
        id: '3',
        nom: 'Végétalien',
      }),
    );

    expect(renommerCategorie).toHaveBeenCalledWith('regimes', 3, 'Végétalien');
    expect(supprimerCategorie).not.toHaveBeenCalled();
  });

  it('supprime sans renommer', async () => {
    await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'suppression',
        ressource: 'regimes',
        id: '3',
      }),
    );

    expect(supprimerCategorie).toHaveBeenCalledWith('regimes', 3);
    expect(renommerCategorie).not.toHaveBeenCalled();
  });
});

describe('executerActionCategorie — les refus', () => {
  it('explique une catégorie encore utilisée, et donne la sortie', async () => {
    // Le nombre de recettes n'est pas connu — l'API ne le renvoie pas — mais le
    // chemin pour aller les voir, si.
    vi.mocked(supprimerCategorie).mockRejectedValue(
      new ErreurApi(409, 'Cette catégorie est encore utilisée'),
    );

    const resultat = await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'suppression',
        ressource: 'regimes',
        id: '3',
      }),
    );

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/utilisée/i);
    expect(resultat.versRecettes).toBe('/recettes?regime=3');
  });

  it('rattache un nom déjà pris au champ, sans perdre la saisie', async () => {
    vi.mocked(creerCategorie).mockRejectedValue(
      new ErreurApi(409, 'Ce nom est déjà utilisé'),
    );

    const resultat = await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'creation',
        ressource: 'regimes',
        nom: 'Végan',
      }),
    );

    expect(resultat.champNom).toMatch(/déjà utilisé/i);
    expect(resultat.saisie).toBe('Végan');
    expect(resultat.message).toBeUndefined();
  });

  it('traite un 404 comme « déjà supprimée »', async () => {
    vi.mocked(supprimerCategorie).mockRejectedValue(
      new ErreurApi(404, 'Catégorie introuvable'),
    );

    const resultat = await executerActionCategorie(
      donneesDeFormulaire({
        intention: 'suppression',
        ressource: 'regimes',
        id: '3',
      }),
    );

    expect(resultat.succes).toBe(true);
  });
});
