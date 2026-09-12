import { beforeEach, describe, expect, it, vi } from 'vitest';

import { donneesDeFormulaire } from '../../test/formulaire';
import {
  changerMotDePasse,
  modifierProfil,
  supprimerCompte,
} from '../acces-api/compte';
import { ErreurApi } from '../acces-api/erreur-api';

import { executerActionCompte } from './actions-compte';

vi.mock('../acces-api/compte');

const PROFIL = { intention: 'profil', email: 'camille@test.fr' };
const MOT_DE_PASSE = {
  intention: 'mot-de-passe',
  ancienMotDePasse: 'ancien-mot-de-passe',
  nouveauMotDePasse: 'nouveau-mot-de-passe',
  confirmation: 'nouveau-mot-de-passe',
};

beforeEach(() => {
  vi.mocked(modifierProfil).mockReset();
  vi.mocked(changerMotDePasse).mockReset();
  vi.mocked(supprimerCompte).mockReset();
});

describe('executerActionCompte — aiguillage des trois zones', () => {
  it('n’appelle que la route de son intention', async () => {
    // Trois formulaires sur une seule page : sans intention, enregistrer son pseudo
    // changerait aussi le mot de passe.
    await executerActionCompte(
      donneesDeFormulaire({ ...PROFIL, pseudo: 'Camille' }),
    );

    expect(modifierProfil).toHaveBeenCalledWith({
      email: 'camille@test.fr',
      pseudo: 'Camille',
    });
    expect(changerMotDePasse).not.toHaveBeenCalled();
    expect(supprimerCompte).not.toHaveBeenCalled();
  });

  it('omet le pseudo laissé vide au lieu d’envoyer une chaîne vide', async () => {
    // L'API exige 3 caractères : `''` serait un 400. Un champ vide veut donc dire
    // « je n'y touche pas » — l'API n'offre aucun moyen d'effacer un pseudo.
    await executerActionCompte(
      donneesDeFormulaire({ ...PROFIL, pseudo: '   ' }),
    );

    expect(modifierProfil).toHaveBeenCalledWith({ email: 'camille@test.fr' });
  });
});

describe('executerActionCompte — mot de passe', () => {
  it('refuse une confirmation qui diffère sans appeler l’API', async () => {
    const resultat = await executerActionCompte(
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

    const resultat = await executerActionCompte(
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

    const resultat = await executerActionCompte(
      donneesDeFormulaire(MOT_DE_PASSE),
    );

    expect(resultat.champs?.nouveauMotDePasse).toMatch(/12/);
    expect(resultat.champs?.ancienMotDePasse).toBeUndefined();
  });

  it('ne renvoie jamais un mot de passe saisi', async () => {
    // Le résultat d'une action vit dans l'état du routeur, donc dans l'historique.
    vi.mocked(changerMotDePasse).mockRejectedValue(
      new ErreurApi(500, 'Le service est indisponible.'),
    );

    const resultat = await executerActionCompte(
      donneesDeFormulaire({
        ...MOT_DE_PASSE,
        ancienMotDePasse: 'secret-ancien-1234',
        nouveauMotDePasse: 'secret-nouveau-1234',
        confirmation: 'secret-nouveau-1234',
      }),
    );

    expect(JSON.stringify(resultat)).not.toContain('secret');
  });
});

describe('executerActionCompte — portée d’un échec', () => {
  it('porte la zone en échec, pour que les deux autres restent intactes', async () => {
    vi.mocked(changerMotDePasse).mockRejectedValue(
      new ErreurApi(500, 'Le service est indisponible.'),
    );

    const resultat = await executerActionCompte(
      donneesDeFormulaire(MOT_DE_PASSE),
    );

    expect(resultat.zone).toBe('mot-de-passe');
    expect(resultat.message).toMatch(/indisponible/i);
  });

  it('rend sa saisie au profil refusé, pour ne pas la faire retaper', async () => {
    vi.mocked(modifierProfil).mockRejectedValue(
      new ErreurApi(409, 'Cette adresse est déjà utilisée'),
    );

    const resultat = await executerActionCompte(
      donneesDeFormulaire({ ...PROFIL, pseudo: 'Camille' }),
    );

    expect(resultat.saisie).toEqual({
      email: 'camille@test.fr',
      pseudo: 'Camille',
    });
  });
});

describe('executerActionCompte — suppression', () => {
  it('signale le refus du dernier administrateur sans annoncer d’adieu', async () => {
    vi.mocked(supprimerCompte).mockRejectedValue(
      new ErreurApi(409, 'C’est le dernier administrateur'),
    );

    const resultat = await executerActionCompte(
      donneesDeFormulaire({ intention: 'suppression' }),
    );

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/dernier administrateur/i);
  });

  it('annonce le succès, qui déclenche l’écran d’adieu', async () => {
    const resultat = await executerActionCompte(
      donneesDeFormulaire({ intention: 'suppression' }),
    );

    expect(resultat).toEqual({ zone: 'suppression', succes: true });
  });
});
