import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ecranLarge } from '../../test/ecran';

import { SectionsRecette } from './sections-recette';

function rendre() {
  render(
    <SectionsRecette
      ingredients={<p>Liste des ingrédients</p>}
      etapes={<p>Liste des étapes</p>}
      avis={<p>Liste des avis</p>}
      nombreAvis={34}
    />,
  );
}

const onglet = (nom: RegExp) => screen.getByRole('tab', { name: nom });

describe('SectionsRecette — petit écran', () => {
  it('propose Ingrédients, Étapes et « Avis · N »', () => {
    ecranLarge(false);
    rendre();

    expect(
      screen.getAllByRole('tab').map((element) => element.textContent),
    ).toEqual(['Ingrédients', 'Étapes', 'Avis · 34']);
  });

  it('ouvre sur les ingrédients, seuls visibles', () => {
    ecranLarge(false);
    rendre();

    expect(onglet(/ingrédients/i)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Liste des ingrédients')).toBeVisible();
    expect(screen.getByText('Liste des étapes')).not.toBeVisible();
    expect(screen.getByText('Liste des avis')).not.toBeVisible();
  });

  it('montre les étapes et masque les ingrédients quand on choisit « Étapes »', async () => {
    ecranLarge(false);
    rendre();

    await userEvent.click(onglet(/étapes/i));

    expect(onglet(/étapes/i)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Liste des étapes')).toBeVisible();
    expect(screen.getByText('Liste des ingrédients')).not.toBeVisible();
  });

  it('passe d’un onglet à l’autre avec les flèches', async () => {
    ecranLarge(false);
    rendre();

    await userEvent.click(onglet(/ingrédients/i));
    await userEvent.keyboard('{ArrowRight}');
    expect(onglet(/étapes/i)).toHaveFocus();
    expect(onglet(/étapes/i)).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onglet(/avis/i)).toHaveFocus();
    expect(screen.getByText('Liste des avis')).toBeVisible();
  });
});

describe('SectionsRecette — écran large', () => {
  it('garde les trois sections visibles, sans onglets', () => {
    ecranLarge(true);
    rendre();

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('Liste des ingrédients')).toBeVisible();
    expect(screen.getByText('Liste des étapes')).toBeVisible();
    expect(screen.getByText('Liste des avis')).toBeVisible();
  });
});
