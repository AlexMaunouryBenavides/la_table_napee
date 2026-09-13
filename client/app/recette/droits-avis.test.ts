import type { Avis, RoleUtilisateur, Utilisateur } from '@recipe/types';
import { describe, expect, it } from 'vitest';

import { peutModifier, peutSupprimer } from './droits-avis';

function compte(
  id: string,
  role: RoleUtilisateur = 'utilisateur',
): Utilisateur {
  return {
    id,
    pseudo: `compte-${id}`,
    email: `${id}@test.fr`,
    role,
    dateCreation: '2026-01-01T12:00:00.000Z',
  };
}

function avisDe(auteur: Utilisateur | null): Avis {
  return {
    id: 1,
    note: 4,
    commentaire: 'Très bon.',
    dateCreation: '2026-05-23T12:00:00.000Z',
    utilisateur: auteur,
  };
}

const CAMILLE = compte('a');
const AUTRE = compte('b');
const MODERATEUR = compte('c', 'moderateur');

describe('droits sur un avis', () => {
  it('laisse son auteur le modifier et le supprimer', () => {
    const avis = avisDe(CAMILLE);

    expect(peutModifier(avis, CAMILLE)).toBe(true);
    expect(peutSupprimer(avis, CAMILLE)).toBe(true);
  });

  it('interdit tout sur l’avis d’un autre', () => {
    const avis = avisDe(CAMILLE);

    expect(peutModifier(avis, AUTRE)).toBe(false);
    expect(peutSupprimer(avis, AUTRE)).toBe(false);
  });

  it('laisse un modérateur SUPPRIMER sans jamais RÉÉCRIRE', () => {
    // Réécrire l'avis d'autrui, ce serait lui mettre des mots dans la bouche.
    const avis = avisDe(CAMILLE);

    expect(peutModifier(avis, MODERATEUR)).toBe(false);
    expect(peutSupprimer(avis, MODERATEUR)).toBe(true);
  });

  it('n’accorde rien à un visiteur', () => {
    const avis = avisDe(CAMILLE);

    expect(peutModifier(avis, null)).toBe(false);
    expect(peutSupprimer(avis, null)).toBe(false);
  });

  it('n’attribue à personne un avis devenu anonyme', () => {
    // Le compte supprimé ne « récupère » pas ses avis en revenant.
    const anonyme = avisDe(null);

    expect(peutModifier(anonyme, CAMILLE)).toBe(false);
    expect(peutSupprimer(anonyme, CAMILLE)).toBe(false);
    expect(peutSupprimer(anonyme, MODERATEUR)).toBe(true);
  });
});
