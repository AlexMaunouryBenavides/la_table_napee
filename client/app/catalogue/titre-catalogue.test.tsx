import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { Referentiels } from './filtres-actifs';
import { TitreCatalogue, titreDuCatalogue } from './titre-catalogue';

const REFERENTIELS: Referentiels = {
  regimes: [
    { id: 1, nom: 'Végan' },
    { id: 2, nom: 'Sans gluten' },
  ],
  criteresSante: [],
  typesAliment: [],
  nationalites: [],
};

const titre = (requete: string) =>
  titreDuCatalogue(new URLSearchParams(requete), REFERENTIELS);

describe('titreDuCatalogue', () => {
  it('reste « Le catalogue » sans filtre', () => {
    expect(titre('')).toEqual({ base: 'Le catalogue', precision: null });
  });

  it('met le type de recette au pluriel', () => {
    expect(titre('type=plat').base).toBe('Plats');
    expect(titre('type=entree').base).toBe('Entrées');
    expect(titre('type=dessert').base).toBe('Desserts');
    expect(titre('type=glace').base).toBe('Glaces');
    expect(titre('type=boisson').base).toBe('Boissons');
    expect(titre('type=sauce').base).toBe('Sauces');
  });

  it('précise les régimes tels qu’ils sont nommés en base', () => {
    // Pas d'accord fabriqué : la base dit « Végan », on n'écrit pas « végans ».
    expect(titre('type=plat&regime=1&regime=2')).toEqual({
      base: 'Plats',
      precision: 'Végan · Sans gluten',
    });
  });

  it('garde « Le catalogue » quand seul un régime est choisi', () => {
    expect(titre('regime=2')).toEqual({
      base: 'Le catalogue',
      precision: 'Sans gluten',
    });
  });

  it('ignore un régime absent du référentiel', () => {
    // Catégorie supprimée ou URL trafiquée : jamais « undefined » dans un titre.
    expect(titre('regime=99')).toEqual({
      base: 'Le catalogue',
      precision: null,
    });
  });

  it('ne se laisse pas changer par la difficulté, la recherche ou le temps', () => {
    // La rangée « Actifs » les dit déjà : un titre qui énumère tout ne titre plus rien.
    expect(titre('difficulte=facile&recherche=tomate&tempsMax=60')).toEqual({
      base: 'Le catalogue',
      precision: null,
    });
  });
});

describe('TitreCatalogue', () => {
  it('rend le titre composé en h1, la précision en italique', () => {
    render(
      <MemoryRouter initialEntries={['/recettes?type=plat&regime=1']}>
        <TitreCatalogue referentiels={REFERENTIELS} />
      </MemoryRouter>,
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Plats Végan');
    expect(h1.querySelector('em')).toHaveTextContent('Végan');
  });
});
