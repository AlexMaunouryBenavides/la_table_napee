import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Pagination } from './pagination';

function rendreA(url: string, element: React.ReactElement) {
  return render(<MemoryRouter initialEntries={[url]}>{element}</MemoryRouter>);
}

describe('Pagination', () => {
  it('déduit le nombre de pages du total et de la limite', () => {
    rendreA('/recettes', <Pagination total={41} page={1} limite={20} />);

    expect(screen.getByRole('link', { name: '3' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '4' })).not.toBeInTheDocument();
  });

  it('garde ses flèches visibles mais inertes quand il n’y a qu’une page', () => {
    // Les retirer ferait sauter la hauteur de la page entre deux chargements.
    rendreA('/recettes', <Pagination total={5} page={1} limite={20} />);

    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
  });

  it('signale la page courante', () => {
    rendreA(
      '/recettes?page=2',
      <Pagination total={100} page={2} limite={20} />,
    );

    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('désactive « précédent » en première page et « suivant » en dernière', () => {
    const { unmount } = rendreA(
      '/recettes',
      <Pagination total={100} page={1} limite={20} />,
    );
    expect(screen.getByRole('button', { name: /précédent/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /suivant/i })).toBeInTheDocument();
    unmount();

    rendreA(
      '/recettes?page=5',
      <Pagination total={100} page={5} limite={20} />,
    );
    expect(
      screen.getByRole('link', { name: /précédent/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
  });

  it('abrège par une ellipse au-delà de cinq pages', () => {
    rendreA('/recettes', <Pagination total={200} page={1} limite={20} />);

    expect(screen.getByText('…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '6' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '10' })).toBeInTheDocument();
  });

  it('conserve les autres critères de l’URL en changeant de page', () => {
    // Paginer n'est pas filtrer : le filtre survit au changement de page.
    rendreA(
      '/recettes?recherche=tarte&difficulte=facile&page=1',
      <Pagination total={100} page={1} limite={20} />,
    );

    const lien = screen.getByRole('link', { name: '2' });
    expect(lien).toHaveAttribute(
      'href',
      expect.stringContaining('recherche=tarte'),
    );
    expect(lien).toHaveAttribute(
      'href',
      expect.stringContaining('difficulte=facile'),
    );
  });
});
