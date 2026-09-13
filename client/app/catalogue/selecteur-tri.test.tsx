import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SondeUrl } from '../../test/sonde-url';

import { SelecteurTri } from './selecteur-tri';

function rendre(url: string): string[] {
  const journal: string[] = [];

  render(
    <MemoryRouter initialEntries={[url]}>
      <SelecteurTri />
      <SondeUrl journal={journal} />
    </MemoryRouter>,
  );

  return journal;
}

const selecteur = (): HTMLElement => screen.getByLabelText(/trier/i);

describe('SelecteurTri', () => {
  it('affiche le tri par défaut de l’API quand l’URL n’en porte pas', () => {
    rendre('/recettes');

    expect(
      within(selecteur()).getByRole('option', { selected: true }),
    ).toHaveTextContent(/plus récentes/i);
  });

  it('reflète le tri présent dans l’URL', () => {
    rendre('/recettes?tri=titre');

    expect(
      within(selecteur()).getByRole('option', { selected: true }),
    ).toHaveTextContent(/titre a → z/i);
  });

  it('écrit le tri choisi dans l’URL, revient page 1 et garde les filtres', async () => {
    const journal = rendre('/recettes?recherche=tarte&type=plat&page=3');

    await userEvent.selectOptions(selecteur(), 'tempsPreparation');

    const derniere = new URLSearchParams(journal[journal.length - 1] ?? '');
    expect(derniere.get('tri')).toBe('tempsPreparation');
    expect(derniere.get('page')).toBe('1');
    expect(derniere.get('recherche')).toBe('tarte');
    expect(derniere.get('type')).toBe('plat');
  });

  it('ne propose que les tris que l’API accepte — pas la note', () => {
    // `TRIS` côté API : dateCreation, titre, tempsPreparation. Offrir « note » mènerait
    // tout droit à un 400.
    rendre('/recettes');

    const valeurs = within(selecteur())
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value);

    expect(valeurs).toEqual([
      '-dateCreation',
      'titre',
      '-titre',
      'tempsPreparation',
    ]);
  });

  it('retombe sur le tri par défaut quand l’URL en porte un inconnu', () => {
    rendre('/recettes?tri=note');

    expect(
      within(selecteur()).getByRole('option', { selected: true }),
    ).toHaveTextContent(/plus récentes/i);
  });
});
