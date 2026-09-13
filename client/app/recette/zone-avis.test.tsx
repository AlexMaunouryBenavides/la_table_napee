import type { Avis, Utilisateur } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ZoneAvis } from './zone-avis';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-01T12:00:00.000Z',
};

function avisDe(auteur: Utilisateur | null): Avis {
  return {
    id: 1,
    note: 4,
    commentaire: 'Très bon.',
    dateCreation: '2026-05-23T12:00:00.000Z',
    utilisateur: auteur,
  };
}

function rendre(session: Utilisateur | null, avis: Avis[]) {
  // `<Form>` et `useNavigation` exigent un routeur de données : `MemoryRouter` seul
  // ne suffit pas.
  const routeur = createMemoryRouter([
    {
      path: '/',
      element: <ZoneAvis recetteId={1} avis={avis} session={session} />,
    },
  ]);

  render(<RouterProvider router={routeur} />);
}

describe('ZoneAvis', () => {
  it('invite un visiteur à se connecter, sans lui montrer de formulaire', () => {
    rendre(null, []);

    expect(screen.getByRole('link', { name: /connect/i })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('offre le dépôt à qui n’a pas encore donné son avis', () => {
    rendre(CAMILLE, [avisDe(null)]);

    expect(
      screen.getByRole('button', { name: /publier mon avis/i }),
    ).toBeInTheDocument();
  });

  it('passe en modification quand l’avis existe déjà', () => {
    // Redéposer donnerait un 409 : un seul avis par personne et par recette.
    rendre(CAMILLE, [avisDe(CAMILLE)]);

    expect(
      screen.getByRole('button', { name: /modifier mon avis/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /publier mon avis/i }),
    ).not.toBeInTheDocument();
  });
});
