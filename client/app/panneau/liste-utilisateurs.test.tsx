import type { Page, Utilisateur } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { ResultatAdministration } from './administration-utilisateurs';
import { EcranListeUtilisateurs } from './liste-utilisateurs';

const CAMILLE: Utilisateur = {
  id: 'u-camille',
  pseudo: 'camille',
  email: 'camille@test.fr',
  role: 'admin',
  dateCreation: '2026-01-12T12:00:00.000Z',
};

const THOMAS: Utilisateur = {
  id: 'u-thomas',
  pseudo: 'thomas',
  email: 'thomas@test.fr',
  role: 'moderateur',
  dateCreation: '2026-02-19T12:00:00.000Z',
};

const SANS_PSEUDO: Utilisateur = {
  id: 'u-anonyme',
  pseudo: null,
  email: 'k.durand@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-04-07T12:00:00.000Z',
};

function page(donnees: Utilisateur[]): Page<Utilisateur> {
  return { donnees, total: donnees.length, page: 1, limite: 20 };
}

function rendre({
  comptes = [CAMILLE, THOMAS],
  action,
}: {
  comptes?: Utilisateur[];
  action?: () => Promise<ResultatAdministration> | ResultatAdministration;
} = {}) {
  const routeur = createMemoryRouter(
    [
      {
        path: '/panneau/utilisateurs',
        element: (
          <EcranListeUtilisateurs
            resultats={page(comptes)}
            echec={null}
            session={CAMILLE}
          />
        ),
        action: action ?? (() => null),
      },
    ],
    { initialEntries: ['/panneau/utilisateurs'] },
  );

  render(<RouterProvider router={routeur} />);
}

const ligneDe = (email: string): HTMLElement =>
  screen.getByText(email).closest('tr') as HTMLElement;

describe('EcranListeUtilisateurs — sa propre ligne', () => {
  it('verrouille le rôle et la suppression de son propre compte', () => {
    // Se retirer son rôle est presque toujours une fausse manœuvre : l'API refuse,
    // autant ne pas l'offrir.
    rendre();

    const mienne = ligneDe('camille@test.fr');

    expect(within(mienne).getByRole('combobox')).toBeDisabled();
    expect(
      within(mienne).queryByRole('button', { name: /supprimer/i }),
    ).not.toBeInTheDocument();
    expect(mienne).toHaveTextContent(/votre compte/i);
  });

  it('laisse les autres lignes agissables', () => {
    rendre();

    const autre = ligneDe('thomas@test.fr');

    expect(within(autre).getByRole('combobox')).toBeEnabled();
    expect(
      within(autre).getByRole('button', { name: /supprimer/i }),
    ).toBeInTheDocument();
  });
});

describe('EcranListeUtilisateurs — l’affichage d’un compte', () => {
  it('nomme un compte sans pseudo sans écrire « null »', () => {
    rendre({ comptes: [CAMILLE, SANS_PSEUDO] });

    const ligne = ligneDe('k.durand@test.fr');

    expect(ligne).toHaveTextContent(/sans pseudo/i);
    expect(ligne).not.toHaveTextContent(/null/);
  });
});

describe('EcranListeUtilisateurs — les refus', () => {
  it('affiche le refus SUR la ligne concernée', async () => {
    rendre({
      action: () => ({
        id: 'u-thomas',
        succes: false,
        message: 'C’est le dernier administrateur',
      }),
    });

    const ligne = ligneDe('thomas@test.fr');
    await userEvent.selectOptions(within(ligne).getByRole('combobox'), 'admin');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /dernier administrateur/i,
    );
    expect(ligneDe('camille@test.fr')).not.toHaveTextContent(
      /dernier administrateur/i,
    );
  });

  it('ne met en attente que la ligne en cours', async () => {
    rendre({ action: () => new Promise(() => undefined) });

    const ligne = ligneDe('thomas@test.fr');
    await userEvent.selectOptions(within(ligne).getByRole('combobox'), 'admin');

    expect(
      within(ligneDe('thomas@test.fr')).getByRole('combobox'),
    ).toBeDisabled();
    // La ligne de Camille est verrouillée pour une autre raison : c'est la sienne.
    // On vérifie donc que la liste RESTE affichée, sans rechargement global.
    expect(screen.getByText('camille@test.fr')).toBeInTheDocument();
  });
});

describe('EcranListeUtilisateurs — la suppression', () => {
  it('nomme le compte visé et annonce que ses avis deviennent anonymes', async () => {
    rendre();

    await userEvent.click(
      within(ligneDe('thomas@test.fr')).getByRole('button', {
        name: /supprimer/i,
      }),
    );

    const modale = screen.getByRole('dialog');

    expect(modale).toHaveTextContent(/thomas/i);
    expect(modale).toHaveTextContent(/anonym/i);
  });
});
