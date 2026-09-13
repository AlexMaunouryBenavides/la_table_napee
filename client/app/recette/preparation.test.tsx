import type { Etape } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Etapes, VideoDeLaRecette } from './preparation';

const ETAPES: Etape[] = [
  { id: 10, numero: 2, contenu: 'Faire fondre le beurre.' },
  { id: 11, numero: 5, contenu: 'Enfourner 30 minutes.' },
];

describe('Etapes', () => {
  it('affiche le numéro porté par l’étape, pas sa position dans le tableau', () => {
    // Le numéro vient de la base ; le déduire de l'index ferait mentir l'écran dès
    // qu'une étape est retirée côté back.
    render(<Etapes etapes={ETAPES} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});

describe('VideoDeLaRecette', () => {
  it('ne rend aucun lecteur quand la recette n’a pas de vidéo', () => {
    render(<VideoDeLaRecette video={null} />);

    expect(screen.queryByTitle(/vidéo de la recette/i)).not.toBeInTheDocument();
  });

  it('rend un lecteur quand la recette en a une', () => {
    render(<VideoDeLaRecette video="https://www.youtube.com/embed/abc123" />);

    expect(screen.getByTitle(/vidéo de la recette/i)).toBeInTheDocument();
  });
});
