import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { CatalogueVide } from './catalogue-vide';

function rendre(aDesFiltres: boolean) {
  render(
    <MemoryRouter>
      <CatalogueVide aDesFiltres={aDesFiltres} />
    </MemoryRouter>,
  );
}

describe('CatalogueVide', () => {
  it('dit que le catalogue est neuf quand rien n’a été filtré', () => {
    rendre(false);

    expect(screen.getByText(/ouvre bientôt/i)).toBeInTheDocument();
  });

  it('dit que ce sont les filtres qui sont trop étroits, et propose de les lever', () => {
    // Les deux vides n'ont pas la même cause, donc pas la même sortie : proposer
    // « créez la première recette » à qui a filtré trop fin ne l'aide en rien.
    rendre(true);

    expect(screen.queryByText(/ouvre bientôt/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /tous les filtres|voir tout/i }),
    ).toBeInTheDocument();
  });
});
