import type { Utilisateur } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { ResultatCompte } from './actions-compte';
import { EcranCompte } from './ecran-compte';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-12T12:00:00.000Z',
};

/** Rend l'écran et RETOURNE le journal des envois : c'est ainsi qu'un test affirme
 *  que rien n'est parti. */
function rendre({
  session = CAMILLE,
  sessionIndisponible = false,
  resultat = null,
  envoiEnCours = false,
}: {
  session?: Utilisateur | null;
  sessionIndisponible?: boolean;
  resultat?: ResultatCompte | null;
  envoiEnCours?: boolean;
} = {}): string[] {
  const envois: string[] = [];

  const routeur = createMemoryRouter([
    {
      path: '/',
      element: (
        <EcranCompte
          session={session}
          sessionIndisponible={sessionIndisponible}
          resultat={resultat}
          envoiEnCours={envoiEnCours}
        />
      ),
      action: async ({ request }) => {
        const intention = (await request.formData()).get('intention');
        envois.push(typeof intention === 'string' ? intention : '');

        return null;
      },
    },
  ]);

  render(<RouterProvider router={routeur} />);

  return envois;
}

describe('EcranCompte — identité', () => {
  it('salue sans pseudo plutôt qu’avec « null » ou une adresse e-mail', () => {
    // L'e-mail n'est pas un nom public : l'afficher en titre le donnerait à lire à
    // quiconque regarde l'écran par-dessus l'épaule.
    rendre({ session: { ...CAMILLE, pseudo: null } });

    const titre = screen.getByRole('heading', { level: 1 });

    expect(titre).toHaveTextContent(/^Bonjour$/);
    expect(titre).not.toHaveTextContent(/null|camille@test\.fr/i);
  });

  it('explique ce que coûte l’absence de pseudo', () => {
    rendre({ session: { ...CAMILLE, pseudo: null } });

    expect(screen.getByRole('status')).toHaveTextContent(/anonyme/i);
  });

  it('montre le rôle sans offrir de le changer', () => {
    // Modifier son propre rôle est l'affaire de l'écran 10, sur les AUTRES comptes.
    rendre({ session: { ...CAMILLE, role: 'admin' } });

    expect(screen.getByText(/administrateur/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/rôle/i)).not.toBeInTheDocument();
  });
});

describe('EcranCompte — sans session', () => {
  it('invite un visiteur à se connecter, sans formulaire ni 403', () => {
    rendre({ session: null });

    expect(screen.getByRole('link', { name: /connect/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument();
  });

  it('dit que le service est en rade quand la session n’a pas pu être lue', () => {
    // « Pas connecté faute de mieux » n'est pas « visiteur » : proposer la connexion
    // à quelqu'un qui l'est déjà serait un mensonge.
    rendre({ session: null, sessionIndisponible: true });

    expect(screen.getByRole('alert')).toHaveTextContent(/indisponible/i);
  });
});

describe('EcranCompte — retours d’action', () => {
  it('confirme l’enregistrement du profil en gardant les trois zones', () => {
    rendre({ resultat: { zone: 'profil', succes: true } });

    expect(screen.getByRole('status')).toHaveTextContent(/enregistr/i);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });

  it('annonce que la session reste ouverte après un changement de mot de passe', () => {
    // L'API ne révoque pas les jetons : le dire évite une reconnexion inutile.
    rendre({ resultat: { zone: 'mot-de-passe', succes: true } });

    expect(screen.getByRole('status')).toHaveTextContent(/session/i);
  });
});

describe('EcranCompte — suppression', () => {
  it('n’envoie rien tant que la modale n’a pas confirmé', async () => {
    const envois = rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(envois).toEqual([]);
  });

  it('redit le sort des avis dans la modale, pas seulement dans la zone', async () => {
    // C'est l'information la plus importante de l'écran : elle survit au fait de ne
    // lire que la modale.
    rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent(/anonym/i);
  });

  it('fait ses adieux au lieu de renvoyer brutalement à l’accueil', () => {
    rendre({
      session: null,
      resultat: { zone: 'suppression', succes: true },
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /supprimé/i,
    );
    expect(screen.getByRole('link', { name: /accueil/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument();
  });
});
