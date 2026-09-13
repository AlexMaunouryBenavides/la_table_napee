import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SondeUrl } from '../../test/sonde-url';

import { CurseurTemps } from './curseur-temps';

function rendre(url: string): string[] {
  const journal: string[] = [];

  render(
    <MemoryRouter initialEntries={[url]}>
      <CurseurTemps />
      <SondeUrl journal={journal} />
    </MemoryRouter>,
  );

  return journal;
}

const curseur = (): HTMLInputElement =>
  screen.getByLabelText(/temps total maximum/i);

const derniereUrl = (journal: string[]): URLSearchParams =>
  new URLSearchParams(journal[journal.length - 1] ?? '');

describe('CurseurTemps', () => {
  it('reflète le temps maximum présent dans l’URL', () => {
    rendre('/recettes?tempsMax=60');

    expect(curseur()).toHaveValue('60');
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('ne filtre rien par défaut : curseur au maximum, « peu importe »', () => {
    const journal = rendre('/recettes');

    expect(curseur()).toHaveValue('180');
    expect(screen.getByText(/peu importe/i)).toBeInTheDocument();
    expect(derniereUrl(journal).has('tempsMax')).toBe(false);
  });

  it('écrit le temps choisi dans l’URL, revient page 1 et garde les filtres', () => {
    const journal = rendre('/recettes?type=plat&page=3');

    fireEvent.change(curseur(), { target: { value: '45' } });

    const url = derniereUrl(journal);
    expect(url.get('tempsMax')).toBe('45');
    expect(url.get('page')).toBe('1');
    expect(url.get('type')).toBe('plat');
  });

  it('retire le filtre quand on ramène le curseur au maximum', () => {
    // 180 min « ou plus » : au bout de la course, il n'y a plus rien à filtrer.
    const journal = rendre('/recettes?tempsMax=60');

    fireEvent.change(curseur(), { target: { value: '180' } });

    expect(derniereUrl(journal).has('tempsMax')).toBe(false);
  });

  it('ramène au maximum une valeur hors bornes tapée dans l’URL', () => {
    rendre('/recettes?tempsMax=500');

    expect(curseur()).toHaveValue('180');
  });

  it('est un vrai curseur, borné de 10 à 180 minutes par pas de 5', () => {
    rendre('/recettes');

    const controle = screen.getByRole('slider', {
      name: /temps total maximum/i,
    });
    expect(controle).toHaveAttribute('min', '10');
    expect(controle).toHaveAttribute('max', '180');
    expect(controle).toHaveAttribute('step', '5');
  });
});
