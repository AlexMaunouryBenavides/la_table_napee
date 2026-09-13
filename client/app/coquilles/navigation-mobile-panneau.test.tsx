import type { Utilisateur } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ecranLarge } from '../../test/ecran';

import { sectionsPour } from './entrees-panneau';
import { NavigationMobilePanneau } from './navigation-mobile-panneau';

const ADMIN: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'admin@exemple.test',
  role: 'admin',
  dateCreation: '2026-09-12T12:00:00.000Z',
};

const MODERATEUR: Utilisateur = { ...ADMIN, id: 'm', role: 'moderateur' };

// Routeur de données : la déconnexion, dans le tiroir, en a besoin pour revalider.
function rendre(session: Utilisateur, url = '/panneau') {
  const element = (
    <NavigationMobilePanneau
      session={session}
      sections={sectionsPour(session.role)}
    />
  );
  const routeur = createMemoryRouter([{ path: '*', element }], {
    initialEntries: [url],
  });
  render(<RouterProvider router={routeur} />);
}

const boutonMenu = () =>
  screen.getByRole('button', { name: /ouvrir le menu/i });

describe('NavigationMobilePanneau — le tiroir', () => {
  it('porte le logo et un bouton de menu fermé', () => {
    ecranLarge(false);
    rendre(ADMIN);

    expect(
      screen.getByRole('link', { name: 'La Table Nappée' }),
    ).toBeInTheDocument();
    expect(boutonMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('ouvre le tiroir en fenêtre modale', async () => {
    ecranLarge(false);
    rendre(ADMIN);

    await userEvent.click(boutonMenu());

    expect(
      screen.getByRole('dialog', { name: /navigation du panneau/i }),
    ).toHaveAttribute('aria-modal', 'true');
    expect(boutonMenu()).toHaveAttribute('aria-expanded', 'true');
  });

  it('se ferme sur Échap en rendant le focus au bouton', async () => {
    ecranLarge(false);
    rendre(ADMIN);

    await userEvent.click(boutonMenu());
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(boutonMenu()).toHaveFocus();
  });

  it('se ferme avec le bouton « Fermer le menu »', async () => {
    ecranLarge(false);
    rendre(ADMIN);

    await userEvent.click(boutonMenu());
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /fermer le menu/i,
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(boutonMenu()).toHaveFocus();
  });

  it('se ferme quand on choisit une entrée', async () => {
    ecranLarge(false);
    rendre(ADMIN);

    await userEvent.click(boutonMenu());
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('link', {
        name: 'Recettes',
      }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('NavigationMobilePanneau — les onglets du bas', () => {
  const onglets = () =>
    screen.getByRole('navigation', { name: /onglets du panneau/i });

  it('donne Bord, Recettes et Comptes à un administrateur', () => {
    ecranLarge(false);
    rendre(ADMIN);

    expect(
      within(onglets())
        .getAllByRole('link')
        .map((lien) => lien.textContent),
    ).toEqual(['Bord', 'Recettes', 'Comptes']);
  });

  it('ne donne que Bord et Recettes à un modérateur', () => {
    ecranLarge(false);
    rendre(MODERATEUR);

    expect(
      within(onglets())
        .getAllByRole('link')
        .map((lien) => lien.textContent),
    ).toEqual(['Bord', 'Recettes']);
  });

  it('marque l’onglet de la page en cours', () => {
    ecranLarge(false);
    rendre(ADMIN, '/panneau/recettes');

    expect(
      within(onglets()).getByRole('link', { name: 'Recettes' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(onglets()).getByRole('link', { name: 'Bord' }),
    ).not.toHaveAttribute('aria-current');
  });
});

describe('NavigationMobilePanneau — écran large', () => {
  it('ne montre ni bouton de menu ni onglets', () => {
    ecranLarge(true);
    rendre(ADMIN);

    expect(
      screen.queryByRole('button', { name: /ouvrir le menu/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: /onglets du panneau/i }),
    ).not.toBeInTheDocument();
  });
});
