import { beforeEach, describe, expect, it, vi } from 'vitest';

import { THOMAS } from '../../test/comptes-exemple';
import { ErreurApi } from '../acces-api/erreur-api';
import { changerRole, supprimerUtilisateur } from '../acces-api/utilisateurs';

import {
  executerChangementDeRole,
  executerSuppressionCompte,
} from './administration-utilisateurs';

vi.mock('../acces-api/utilisateurs');

beforeEach(() => {
  vi.mocked(changerRole).mockReset().mockResolvedValue(THOMAS);
  vi.mocked(supprimerUtilisateur).mockReset().mockResolvedValue(undefined);
});

describe('executerChangementDeRole', () => {
  it('rend le compte à jour, pour que la ligne se corrige seule', async () => {
    vi.mocked(changerRole).mockResolvedValue({ ...THOMAS, role: 'admin' });

    const resultat = await executerChangementDeRole(THOMAS, 'admin');

    expect(changerRole).toHaveBeenCalledWith('u-thomas', 'admin');
    expect(resultat.succes).toBe(true);
    expect(resultat.utilisateur?.role).toBe('admin');
  });

  it('remet l’ancien rôle quand l’API refuse', async () => {
    // Un sélecteur qui garde une valeur refusée ment sur l'état du compte.
    vi.mocked(changerRole).mockRejectedValue(
      new ErreurApi(409, 'Vous ne pouvez pas modifier votre propre rôle'),
    );

    const resultat = await executerChangementDeRole(THOMAS, 'admin');

    expect(resultat.succes).toBe(false);
    expect(resultat.roleRetabli).toBe('moderateur');
    expect(resultat.message).toMatch(/propre rôle/i);
  });
});

describe('executerSuppressionCompte', () => {
  it('explique le refus du dernier administrateur', async () => {
    vi.mocked(supprimerUtilisateur).mockRejectedValue(
      new ErreurApi(409, 'C’est le dernier administrateur'),
    );

    const resultat = await executerSuppressionCompte(THOMAS.id);

    expect(resultat.succes).toBe(false);
    expect(resultat.message).toMatch(/dernier administrateur/i);
  });

  it('traite un 404 comme « déjà supprimé »', async () => {
    // Quelqu'un d'autre a retiré le compte : le résultat voulu est atteint.
    vi.mocked(supprimerUtilisateur).mockRejectedValue(
      new ErreurApi(404, 'Utilisateur introuvable'),
    );

    const resultat = await executerSuppressionCompte(THOMAS.id);

    expect(resultat.succes).toBe(true);
    expect(resultat.message).toMatch(/n’existe plus|supprimé/i);
  });
});
