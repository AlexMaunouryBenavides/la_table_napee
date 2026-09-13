import type { Utilisateur } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { EcranConnexion, type EchecAuth } from './ecran-connexion';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-01T12:00:00.000Z',
};

function rendre({
  session = null,
  echec = null,
  envoiEnCours = false,
}: {
  session?: Utilisateur | null;
  echec?: EchecAuth | null;
  envoiEnCours?: boolean;
} = {}) {
  const routeur = createMemoryRouter([
    {
      path: '/',
      element: (
        <EcranConnexion
          session={session}
          echec={echec}
          envoiEnCours={envoiEnCours}
        />
      ),
    },
  ]);

  render(<RouterProvider router={routeur} />);
}

describe('EcranConnexion — anti-énumération', () => {
  it('n’affiche qu’un seul message d’échec, qui ne désigne aucun champ', () => {
    rendre({
      echec: { statut: 401, message: 'E-mail ou mot de passe incorrect.' },
    });

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByLabelText(/adresse e-mail/i)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/mot de passe/i)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('ne relie ce message à aucun champ', () => {
    // Le rattacher dirait à un lecteur d'écran LEQUEL est faux — donc si le compte
    // existe. L'anti-énumération ne tient que si elle tient aussi à l'oreille.
    rendre({
      echec: { statut: 401, message: 'E-mail ou mot de passe incorrect.' },
    });

    expect(
      screen.getByLabelText(/adresse e-mail/i),
    ).not.toHaveAccessibleDescription();
    expect(
      screen.getByLabelText(/mot de passe/i),
    ).not.toHaveAccessibleDescription();
  });

  it('signale en revanche une erreur de FORMAT sur son champ', () => {
    // « Ce n'est pas une adresse valide » ne révèle rien sur l'existence d'un compte.
    rendre({
      echec: {
        statut: 400,
        message: 'Requête invalide',
        details: ['email must be an email'],
      },
    });

    expect(screen.getByLabelText(/adresse e-mail/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});

describe('EcranConnexion — envoi et session', () => {
  it('fige les champs pendant l’envoi', () => {
    rendre({ envoiEnCours: true });

    expect(screen.getByLabelText(/adresse e-mail/i)).toBeDisabled();
    expect(screen.getByLabelText(/mot de passe/i)).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeDisabled();
  });

  it('conserve l’adresse après une panne, mais jamais le mot de passe', () => {
    rendre({
      echec: {
        statut: 500,
        message: 'Le service est indisponible.',
        saisie: { email: 'camille@test.fr' },
      },
    });

    expect(screen.getByLabelText(/adresse e-mail/i)).toHaveValue(
      'camille@test.fr',
    );
    expect(screen.getByLabelText(/mot de passe/i)).toHaveValue('');
  });

  it('dit à une personne déjà connectée qu’elle l’est, sans la rediriger', () => {
    rendre({ session: CAMILLE });

    expect(screen.getByText(/déjà connecté/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/mot de passe/i)).not.toBeInTheDocument();
  });
});

describe('EcranConnexion — après une inscription', () => {
  it('accueille le compte tout juste créé', () => {
    // L'API ne pose pas de cookie à l'inscription : créer un compte et ouvrir une
    // session sont deux actes distincts, et l'écran le dit plutôt que de le masquer.
    const routeur = createMemoryRouter(
      [
        {
          path: '/connexion',
          element: (
            <EcranConnexion session={null} echec={null} envoiEnCours={false} />
          ),
        },
      ],
      { initialEntries: ['/connexion?inscrit=1'] },
    );

    render(<RouterProvider router={routeur} />);

    expect(screen.getByRole('status')).toHaveTextContent(/compte est créé/i);
  });
});
