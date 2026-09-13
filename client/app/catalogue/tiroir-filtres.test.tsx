import type { Page, RecetteResume } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SondeUrl } from '../../test/sonde-url';
import { listerRecettes } from '../acces-api/recettes';

import type { Referentiels } from './filtres-actifs';
import { TiroirFiltres } from './tiroir-filtres';

vi.mock('../acces-api/recettes');

const REFERENTIELS: Referentiels = {
  regimes: [{ id: 1, nom: 'Végan' }],
  criteresSante: [],
  typesAliment: [],
  nationalites: [],
};

const pageDe = (total: number): Page<RecetteResume> => ({
  donnees: [],
  total,
  page: 1,
  limite: 1,
});

beforeEach(() => {
  vi.mocked(listerRecettes).mockReset().mockResolvedValue(pageDe(17));
});

function rendre(url: string): string[] {
  const journal: string[] = [];

  render(
    <MemoryRouter initialEntries={[url]}>
      <TiroirFiltres referentiels={REFERENTIELS} />
      <SondeUrl journal={journal} />
    </MemoryRouter>,
  );

  return journal;
}

const derniereUrl = (journal: string[]): URLSearchParams =>
  new URLSearchParams(journal[journal.length - 1] ?? '');

async function ouvrir(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: /^filtres/i }));
  return screen.getByRole('dialog');
}

describe('TiroirFiltres', () => {
  it('annonce le nombre de filtres actifs sur son bouton', () => {
    rendre('/recettes?type=plat&regime=1&tempsMax=60');

    expect(
      screen.getByRole('button', { name: /filtres · 3/i }),
    ).toBeInTheDocument();
  });

  it('n’annonce aucun nombre sans filtre actif', () => {
    rendre('/recettes');

    expect(
      screen.getByRole('button', { name: /^filtres$/i }),
    ).toBeInTheDocument();
  });

  it('s’ouvre en fenêtre modale, et Échap la ferme en rendant le focus au bouton', async () => {
    rendre('/recettes');

    const tiroir = await ouvrir();
    expect(tiroir).toHaveAttribute('aria-modal', 'true');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^filtres/i })).toHaveFocus();
  });

  it('ne touche pas à l’URL tant qu’on n’a pas validé', async () => {
    // Sur un téléphone, une requête à chaque coche ferait sauter la liste derrière
    // le tiroir et coûterait du réseau pour rien.
    const journal = rendre('/recettes');

    const tiroir = await ouvrir();
    await userEvent.click(within(tiroir).getByRole('radio', { name: 'plat' }));

    expect(derniereUrl(journal).has('type')).toBe(false);
  });

  it('annonce le nombre de résultats des choix en cours, par un appel léger', async () => {
    rendre('/recettes');

    const tiroir = await ouvrir();
    await userEvent.click(within(tiroir).getByRole('radio', { name: 'plat' }));

    expect(
      await within(tiroir).findByRole('button', {
        name: /voir les 17 recettes/i,
      }),
    ).toBeInTheDocument();

    const criteres = vi.mocked(listerRecettes).mock.lastCall?.[0];
    expect(criteres?.get('type')).toBe('plat');
    expect(criteres?.get('limite')).toBe('1');
  });

  it('écrit les choix dans l’URL à la validation, page 1, et se ferme', async () => {
    const journal = rendre('/recettes?page=4');

    const tiroir = await ouvrir();
    await userEvent.click(within(tiroir).getByRole('radio', { name: 'plat' }));
    await userEvent.click(
      await within(tiroir).findByRole('button', { name: /voir les/i }),
    );

    const url = derniereUrl(journal);
    expect(url.get('type')).toBe('plat');
    expect(url.get('page')).toBe('1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abandonne les choix quand on ferme sans valider', async () => {
    const journal = rendre('/recettes');

    let tiroir = await ouvrir();
    await userEvent.click(within(tiroir).getByRole('radio', { name: 'plat' }));
    await userEvent.click(
      within(tiroir).getByRole('button', { name: /fermer/i }),
    );

    expect(derniereUrl(journal).has('type')).toBe(false);

    tiroir = await ouvrir();
    // « Peu importe » existe pour le type ET la difficulté : on vise le type.
    const types = within(tiroir).getByRole('group', {
      name: /type de recette/i,
    });
    expect(
      within(types).getByRole('radio', { name: /peu importe/i, checked: true }),
    ).toBeInTheDocument();
  });

  it('« Tout effacer » vide les choix en cours, pas l’URL', async () => {
    const journal = rendre('/recettes?type=plat');

    const tiroir = await ouvrir();
    await userEvent.click(
      within(tiroir).getByRole('button', { name: /tout effacer/i }),
    );

    expect(
      within(tiroir).getByRole('radio', { name: 'plat', checked: false }),
    ).toBeInTheDocument();
    expect(derniereUrl(journal).get('type')).toBe('plat');
  });
});
