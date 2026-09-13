import type { Utilisateur } from '@recipe/types';
import { screen } from '@testing-library/react';

/** L'administratrice connectée : sa propre ligne est verrouillée. */
export const CAMILLE: Utilisateur = {
  id: 'u-camille',
  pseudo: 'camille',
  email: 'camille@test.fr',
  role: 'admin',
  dateCreation: '2026-01-12T12:00:00.000Z',
};

export const THOMAS: Utilisateur = {
  id: 'u-thomas',
  pseudo: 'thomas',
  email: 'thomas@test.fr',
  role: 'moderateur',
  dateCreation: '2026-02-19T12:00:00.000Z',
};

/** La ligne du tableau des comptes qui porte cette adresse. */
export function ligneDe(email: string): HTMLElement {
  const ligne = screen.getByText(email).closest('tr');
  if (ligne === null) {
    throw new Error(`Aucune ligne pour ${email}`);
  }
  return ligne;
}
