import type { RecetteResume } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { Vitrine } from './vitrine';

function recette(id: number, titre: string): RecetteResume {
  return {
    id,
    titre,
    image: `${String(id)}.jpg`,
    difficulte: 'moyen',
    typeRecette: 'plat',
    tempsPreparation: 45,
    tempsCuisson: 25,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: 4.8,
  };
}

const TROIS = [
  recette(1, 'Tarte fine aux tomates confites'),
  recette(2, 'Pain de campagne au levain'),
  recette(3, 'Glace au miel de châtaignier'),
];

function rendre({
  recettes = TROIS,
  total = 241,
  echec = null,
}: {
  recettes?: RecetteResume[];
  total?: number | null;
  echec?: string | null;
} = {}) {
  const routeur = createMemoryRouter([
    {
      path: '/',
      element: (
        <Vitrine
          recettes={recettes}
          total={total}
          echec={echec}
          surReessai={vi.fn()}
        />
      ),
    },
  ]);

  render(<RouterProvider router={routeur} />);
}

describe('Vitrine — le compteur', () => {
  it('annonce le nombre que l’API renvoie, jamais un chiffre écrit en dur', () => {
    // La réponse paginée porte `total` : l'ignorer obligerait à inventer un nombre,
    // qui serait faux le lendemain.
    rendre({ total: 241 });

    expect(screen.getByText(/241 recettes/i)).toBeInTheDocument();
  });

  it('se tait quand l’API n’a pas répondu', () => {
    rendre({
      recettes: [],
      total: null,
      echec: 'Le service est indisponible.',
    });

    expect(screen.queryByText(/recettes rédigées/i)).not.toBeInTheDocument();
  });
});

describe('Vitrine — ce qu’elle promet', () => {
  it('annonce les dernières publiées, pas les mieux notées', () => {
    // L'API ne sait pas trier par note : `TRIS` accepte dateCreation, titre et
    // tempsPreparation. Promettre un classement qu'on ne calcule pas serait faux.
    rendre();

    expect(screen.getByText(/dernières publiées/i)).toBeInTheDocument();
    expect(screen.queryByText(/mieux notées/i)).not.toBeInTheDocument();
  });

  it('mène au catalogue filtré depuis chaque famille de recettes', () => {
    rendre();

    const familles = screen.getByRole('navigation', { name: /familles/i });

    expect(within(familles).getAllByRole('link')).toHaveLength(6);
    expect(
      within(familles).getByRole('link', { name: /^plat$/i }),
    ).toHaveAttribute('href', '/recettes?type=plat');
  });
});

describe('Vitrine — quand la liste manque', () => {
  it('reste debout sur un échec, avec une reprise et une sortie', () => {
    rendre({
      recettes: [],
      total: null,
      echec: 'Le service est indisponible.',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/indisponible/i);
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /parcourir le catalogue/i }),
    ).toBeInTheDocument();
    // La promesse ne dépend pas des données : elle reste lisible.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('garde la vitrine sur un catalogue vide, sans rien promettre d’inexistant', () => {
    rendre({ recettes: [], total: 0 });

    expect(screen.getByText(/ouvre bientôt/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // Pas d'alerte par e-mail : aucune route ne la porte.
    expect(screen.queryByText(/prévenu par e-mail/i)).not.toBeInTheDocument();
  });
});
