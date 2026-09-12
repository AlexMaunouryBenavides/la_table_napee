import type { Utilisateur } from '@recipe/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { donneesDeFormulaire } from '../../test/formulaire';
import { ErreurApi } from '../acces-api/erreur-api';
import { changerRole, supprimerUtilisateur } from '../acces-api/utilisateurs';

import { executerActionUtilisateur } from './administration-utilisateurs';

vi.mock('../acces-api/utilisateurs');

const THOMAS: Utilisateur = {
  id: 'u-thomas',
  pseudo: 'thomas',
  email: 'thomas@test.fr',
  role: 'moderateur',
  dateCreation: '2026-02-19T12:00:00.000Z',
};

const CHANGEMENT = {
  intention: 'role',
  id: 'u-thomas',
  role: 'admin',
  roleActuel: 'moderateur',
};

beforeEach(() => {
  vi.mocked(changerRole).mockReset().mockResolvedValue(THOMAS);
  vi.mocked(supprimerUtilisateur).mockReset().mockResolvedValue(undefined);
});

describe('executerActionUtilisateur — aiguillage', () => {
  it('change un rôle sans rien supprimer', async () => {
    await executerActionUtilisateur(donneesDeFormulaire(CHANGEMENT));

    expect(changerRole).toHaveBeenCalledWith('u-thomas', 'admin');
    expect(supprimerUtilisateur).not.toHaveBeenCalled();
  });

  it('supprime sans toucher au rôle', async () => {
    await executerActionUtilisateur(
      donneesDeFormulaire({ intention: 'suppression', id: 'u-thomas' }),
    );

    expect(supprimerUtilisateur).toHaveBeenCalledWith('u-thomas');
    expect(changerRole).not.toHaveBeenCalled();
  });
});

describe('executerActionUtilisateur — changement de rôle', () => {
  it('rend le compte à jour, pour que la ligne se corrige seule', async () => {
    vi.mocked(changerRole).mockResolvedValue({ ...THOMAS, role: 'admin' });

    const resultat = await executerActionUtilisateur(
      donneesDeFormulaire(CHANGEMENT),
    );

    expect(resultat.succes).toBe(true);
    expect(resultat.utilisateur?.role).toBe('admin');
  });

  it('remet l’ancien rôle quand l’API refuse', async () => {
    // Un sélecteur qui garde une valeur refusée ment sur l'état du compte.
    vi.mocked(changerRole).mockRejectedValue(
      new ErreurApi(409, 'Vous ne pouvez pas modifier votre propre rôle'),
    );

    const resultat = await executerActionUtilisateur(
      donneesDeFormulaire(CHANGEMENT),
    );

    expect(resultat.succes).toBe(false);
    expect(resultat.roleRetabli).toBe('moderateur');
    expect(resultat.message).toMatch(/propre rôle/i);
  });
});

describe('executerActionUtilisateur — suppression', () => {
  it('explique le refus du dernier administrateur', async () => {
    vi.mocked(supprimerUtilisateur).mockRejectedValue(
      new ErreurApi(409, 'C’est le dernier administrateur'),
    );

    const resultat = await executerActionUtilisateur(
      donneesDeFormulaire({ intention: 'suppression', id: 'u-thomas' }),
    );

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/dernier administrateur/i);
  });

  it('traite un 404 comme « déjà supprimé »', async () => {
    // Quelqu'un d'autre a retiré le compte : le résultat voulu est atteint.
    vi.mocked(supprimerUtilisateur).mockRejectedValue(
      new ErreurApi(404, 'Utilisateur introuvable'),
    );

    const resultat = await executerActionUtilisateur(
      donneesDeFormulaire({ intention: 'suppression', id: 'u-thomas' }),
    );

    expect(resultat.succes).toBe(true);
    expect(resultat.message).toMatch(/n’existe plus|supprimé/i);
  });
});
