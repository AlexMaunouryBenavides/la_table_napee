import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SondeUrl } from '../../test/sonde-url';

import { RechercheDebattue } from './recherche-debattue';

// Court, pour que le test reste rapide ; le délai réel est une prop.
const DELAI_DE_TEST_MS = 40;

function rendreRecherche() {
  const journal: string[] = [];

  render(
    <MemoryRouter initialEntries={['/recettes?page=4']}>
      <RechercheDebattue
        libelle="Rechercher dans le catalogue"
        invite="Un titre, un mot…"
        delaiMs={DELAI_DE_TEST_MS}
      />
      <SondeUrl journal={journal} />
    </MemoryRouter>,
  );

  return journal;
}

describe('RechercheDebattue', () => {
  it('ne déclenche qu’une navigation pour un mot entier', async () => {
    // Une requête par frappe, c'est cinq requêtes pour « tarte » — et rien ne garantit
    // que la réponse de « tar » n'arrivera pas après celle de « tarte ».
    const journal = rendreRecherche();

    await userEvent.type(screen.getByRole('searchbox'), 'tarte');
    expect(journal).toHaveLength(1);

    await waitFor(() => {
      expect(journal).toHaveLength(2);
    });
  });

  it('écrit la recherche dans l’URL et ramène à la première page', async () => {
    const journal = rendreRecherche();

    await userEvent.type(screen.getByRole('searchbox'), 'tarte');

    await waitFor(() => {
      const derniere = journal[journal.length - 1] ?? '';
      expect(derniere).toContain('recherche=tarte');
      expect(derniere).toContain('page=1');
    });
  });
});
