import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErreurApi } from '../acces-api/erreur-api';
import { supprimerRecette } from '../acces-api/recettes';

import { executerSuppression } from './suppression-recette';

vi.mock('../acces-api/recettes');

function demande(id: number): FormData {
  const donnees = new FormData();
  donnees.set('id', String(id));

  return donnees;
}

beforeEach(() => {
  vi.mocked(supprimerRecette).mockReset().mockResolvedValue(undefined);
});

describe('executerSuppression', () => {
  it('rend l’identifiant supprimé', async () => {
    // C'est lui qui dit à la liste QUELLE ligne vient de disparaître.
    const resultat = await executerSuppression(demande(12));

    expect(supprimerRecette).toHaveBeenCalledWith(12);
    expect(resultat).toEqual({ id: 12, supprime: true });
  });

  it('traite un 404 comme « déjà supprimée », pas comme une erreur', async () => {
    // Quelqu'un d'autre l'a retirée entre-temps : le résultat voulu est atteint.
    vi.mocked(supprimerRecette).mockRejectedValue(
      new ErreurApi(404, 'Recette introuvable'),
    );

    const resultat = await executerSuppression(demande(12));

    expect(resultat.supprime).toBe(true);
    expect(resultat.message).toMatch(/n’existe plus|supprimée/i);
  });

  it('rapporte un refus de droits sans rien perdre', async () => {
    vi.mocked(supprimerRecette).mockRejectedValue(
      new ErreurApi(403, 'Accès refusé'),
    );

    const resultat = await executerSuppression(demande(12));

    expect(resultat).toMatchObject({ id: 12, supprime: false });
    expect(resultat.message).toMatch(/refus/i);
  });

  it('garde l’identifiant en panne, pour que la ligne sache qu’elle a échoué', async () => {
    vi.mocked(supprimerRecette).mockRejectedValue(
      new ErreurApi(500, 'Le service est indisponible.'),
    );

    const resultat = await executerSuppression(demande(12));

    expect(resultat).toMatchObject({ id: 12, supprime: false });
    expect(resultat.message).toMatch(/indisponible/i);
  });
});
