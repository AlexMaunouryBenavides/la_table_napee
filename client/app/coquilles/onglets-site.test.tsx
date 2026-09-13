import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ecranLarge } from '../../test/ecran';

import { OngletsSite } from './onglets-site';

function rendre(connecte: boolean, url = '/') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <OngletsSite connecte={connecte} />
    </MemoryRouter>,
  );
}

const onglets = () =>
  screen.getByRole('navigation', { name: /onglets du site/i });

describe('OngletsSite', () => {
  it('propose Accueil, Catalogue et Compte, et marque la page en cours', () => {
    ecranLarge(false);
    rendre(false, '/recettes');

    expect(
      within(onglets())
        .getAllByRole('link')
        .map((lien) => lien.textContent),
    ).toEqual(['Accueil', 'Catalogue', 'Compte']);
    expect(
      within(onglets()).getByRole('link', { name: 'Catalogue' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('mène « Compte » à la page du compte quand on est connecté', () => {
    ecranLarge(false);
    rendre(true);

    expect(
      within(onglets()).getByRole('link', { name: 'Compte' }),
    ).toHaveAttribute('href', '/mon-compte');
  });

  it('mène « Compte » à la connexion pour un visiteur', () => {
    ecranLarge(false);
    rendre(false);

    expect(
      within(onglets()).getByRole('link', { name: 'Compte' }),
    ).toHaveAttribute('href', '/connexion');
  });

  it('disparaît sur écran large', () => {
    ecranLarge(true);
    rendre(true);

    expect(
      screen.queryByRole('navigation', { name: /onglets du site/i }),
    ).not.toBeInTheDocument();
  });
});
