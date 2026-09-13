import type { Page, RecetteResume } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import type { TableauDeBord } from './chargement-tableau-de-bord';
import { EcranTableauDeBord } from './tableau-de-bord';

function recette(
  id: number,
  titre: string,
  noteMoyenne: number | null,
): RecetteResume {
  return {
    id,
    titre,
    image: `${String(id)}.jpg`,
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 4,
    nationalite: 'Italienne',
    noteMoyenne,
  };
}

function page(donnees: RecetteResume[], total: number): Page<RecetteResume> {
  return { donnees, total, page: 1, limite: 5 };
}

const PLEIN: TableauDeBord = {
  recettes: page(
    [recette(1, 'Coulis de tomate', 4), recette(2, 'Glace', null)],
    241,
  ),
  comptes: 1384,
};

function rendre(
  donnees: TableauDeBord,
  role: 'admin' | 'moderateur' = 'admin',
) {
  const routeur = createMemoryRouter(
    [
      {
        path: '/panneau',
        element: <EcranTableauDeBord donnees={donnees} role={role} />,
      },
    ],
    { initialEntries: ['/panneau'] },
  );

  render(<RouterProvider router={routeur} />);
}

describe('EcranTableauDeBord — les compteurs', () => {
  it('affiche un zéro comme un zéro', () => {
    // Masquer un compteur à 0 laisserait croire à une panne : « aucun » est une
    // information, et c'en est une bonne à donner.
    rendre({ recettes: page([], 0), comptes: 0 });

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('remplace une statistique en échec par un tiret, jamais par un zéro', () => {
    rendre({ ...PLEIN, comptes: 'echec' });

    const tuile = screen.getByRole('group', { name: /comptes/i });

    expect(tuile).toHaveTextContent('—');
    expect(tuile).not.toHaveTextContent('0');
    expect(
      within(tuile).getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  it('ne montre pas la tuile des comptes à un modérateur', () => {
    // La statistique vient d'une route admin : ne pas l'afficher plutôt que d'afficher
    // un échec, qui laisserait croire à une panne.
    rendre({ ...PLEIN, comptes: 'non-demande' }, 'moderateur');

    expect(
      screen.queryByRole('group', { name: /comptes/i }),
    ).not.toBeInTheDocument();
  });
});

describe('EcranTableauDeBord — les raccourcis', () => {
  it('en donne quatre à un administrateur', () => {
    rendre(PLEIN);

    const bloc = screen.getByRole('navigation', { name: /raccourcis/i });

    expect(within(bloc).getAllByRole('link')).toHaveLength(4);
  });

  it('n’en donne que deux à un modérateur, aucun vers une route interdite', () => {
    rendre({ ...PLEIN, comptes: 'non-demande' }, 'moderateur');

    const bloc = screen.getByRole('navigation', { name: /raccourcis/i });

    expect(within(bloc).getAllByRole('link')).toHaveLength(2);
    expect(
      within(bloc).queryByRole('link', { name: /utilisateurs|catégories/i }),
    ).not.toBeInTheDocument();
  });
});

describe('EcranTableauDeBord — les dernières recettes', () => {
  it('les liste, en distinguant celles qui n’ont pas d’avis', () => {
    // `noteMoyenne` vaut `null`, jamais 0 : « pas encore notée » n'est pas « 0/5 ».
    rendre(PLEIN);

    expect(
      screen.getByRole('link', { name: /coulis de tomate/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/pas encore notée/i)).toBeInTheDocument();
  });

  it('oriente vers les catégories puis la création quand le catalogue est vide', () => {
    rendre({ recettes: page([], 0), comptes: 1 });

    expect(screen.getByText(/catalogue est vide/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /commencer par les catégories/i }),
    ).toBeInTheDocument();
  });
});
