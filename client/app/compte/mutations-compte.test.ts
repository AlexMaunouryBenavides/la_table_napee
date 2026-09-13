import { beforeEach, describe, expect, it, vi } from 'vitest';

import { donneesDeFormulaire } from '../../test/formulaire';
import {
  changerMotDePasse,
  modifierProfil,
  supprimerCompte,
} from '../acces-api/compte';
import { ErreurApi } from '../acces-api/erreur-api';

import {
  executerMotDePasse,
  executerProfil,
  executerSuppression,
} from './mutations-compte';

vi.mock('../acces-api/compte');

const MOT_DE_PASSE = {
  ancienMotDePasse: 'ancien-mot-de-passe',
  nouveauMotDePasse: 'nouveau-mot-de-passe',
  confirmation: 'nouveau-mot-de-passe',
};

beforeEach(() => {
  vi.mocked(modifierProfil).mockReset();
  vi.mocked(changerMotDePasse).mockReset();
  vi.mocked(supprimerCompte).mockReset();
});

describe('executerProfil', () => {
  it('omet le pseudo laissé vide au lieu d’envoyer une chaîne vide', async () => {
    // L'API exige 3 caractères : `''` serait un 400. Un champ vide veut donc dire
    // « je n'y touche pas » — l'API n'offre aucun moyen d'effacer un pseudo.
    await executerProfil(
      donneesDeFormulaire({ email: 'camille@test.fr', pseudo: '   ' }),
    );

    expect(modifierProfil).toHaveBeenCalledWith({ email: 'camille@test.fr' });
  });
});

describe('executerMotDePasse', () => {
  it('refuse une confirmation qui diffère sans appeler l’API', async () => {
    const resultat = await executerMotDePasse(
      donneesDeFormulaire({
        ...MOT_DE_PASSE,
        confirmation: 'nouveau-mot-de-pass',
      }),
    );

    expect(changerMotDePasse).not.toHaveBeenCalled();
    expect(resultat.succes).toBe(false);
    expect(resultat.champs?.confirmation).toBeDefined();
  });

  it('rattache un ancien mot de passe refusé à son champ', async () => {
    // 400 et non 401 : on est bien authentifié, c'est la saisie qui est fausse.
    vi.mocked(changerMotDePasse).mockRejectedValue(
      new ErreurApi(400, 'L’ancien mot de passe est incorrect'),
    );

    const resultat = await executerMotDePasse(
      donneesDeFormulaire(MOT_DE_PASSE),
    );

    expect(resultat.champs?.ancienMotDePasse).toMatch(/incorrect/i);
    expect(resultat.message).toBeUndefined();
  });

  it('rattache les erreurs de format de l’API à leur champ', async () => {
    vi.mocked(changerMotDePasse).mockRejectedValue(
      new ErreurApi(400, 'Requête invalide', [
        'nouveauMotDePasse must be longer than or equal to 12 characters',
      ]),
    );

    const resultat = await executerMotDePasse(
      donneesDeFormulaire(MOT_DE_PASSE),
    );

    expect(resultat.champs?.nouveauMotDePasse).toMatch(/12/);
    expect(resultat.champs?.ancienMotDePasse).toBeUndefined();
  });

  it('rend le message d’une panne en bandeau, hors des champs', async () => {
    vi.mocked(changerMotDePasse).mockRejectedValue(
      new ErreurApi(500, 'Le service est indisponible.'),
    );

    const resultat = await executerMotDePasse(
      donneesDeFormulaire(MOT_DE_PASSE),
    );

    expect(resultat.message).toMatch(/indisponible/i);
    expect(resultat.champs).toBeUndefined();
  });
});

describe('executerSuppression', () => {
  it('signale le refus du dernier administrateur sans annoncer d’adieu', async () => {
    vi.mocked(supprimerCompte).mockRejectedValue(
      new ErreurApi(409, 'C’est le dernier administrateur'),
    );

    const resultat = await executerSuppression();

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/dernier administrateur/i);
  });

  it('annonce le succès, qui déclenche l’écran d’adieu', async () => {
    await expect(executerSuppression()).resolves.toEqual({ succes: true });
  });
});
