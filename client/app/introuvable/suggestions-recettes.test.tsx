import type { RecetteResume } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SuggestionsRecettes } from './suggestions-recettes';

function recette(id: number, titre: string): RecetteResume {
  return {
    id,
    titre,
    image: '',
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: null,
  };
}

function rendre(recettes: RecetteResume[]) {
  render(
    <MemoryRouter>
      <SuggestionsRecettes recettes={recettes} />
    </MemoryRouter>,
  );
}

describe('SuggestionsRecettes', () => {
  it('propose les recettes trouvées sous un intitulé', () => {
    rendre([
      recette(1, 'Tarte fine aux tomates'),
      recette(2, 'Tomates farcies'),
      recette(3, 'Coulis de tomate'),
    ]);

    expect(
      screen.getByRole('heading', { name: /peut-être cherchiez-vous/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('disparaît sans résultat, plutôt que de montrer des recettes au hasard', () => {
    rendre([]);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
