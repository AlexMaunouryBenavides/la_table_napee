import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ModaleConfirmation } from './modale-confirmation';

function rendreModale(supplement: Record<string, unknown> = {}) {
  const surAnnulation = vi.fn();
  const surConfirmation = vi.fn();

  render(
    <ModaleConfirmation
      titre="Supprimer la recette"
      corps="7 ingrédients, 5 étapes et 34 avis seront supprimés."
      libelleConfirmation="Supprimer la recette"
      destructive
      surAnnulation={surAnnulation}
      surConfirmation={surConfirmation}
      {...supplement}
    />,
  );

  return { surAnnulation, surConfirmation };
}

describe('ModaleConfirmation', () => {
  it('nomme l’action sur son bouton, jamais « OK »', () => {
    rendreModale();

    expect(
      screen.getByRole('button', { name: 'Supprimer la recette' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'OK' }),
    ).not.toBeInTheDocument();
  });

  it('pose le focus initial sur Annuler, pas sur le bouton destructeur', () => {
    rendreModale();

    expect(screen.getByRole('button', { name: /annuler/i })).toHaveFocus();
  });

  it('se ferme sur Échap', async () => {
    const { surAnnulation } = rendreModale();

    await userEvent.keyboard('{Escape}');

    expect(surAnnulation).toHaveBeenCalled();
  });

  it('ne laisse pas le focus sortir de la modale', async () => {
    rendreModale();

    // Assez de tabulations pour faire le tour complet des contrôles.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it('exige le mot de confirmation avant d’autoriser une action irréversible', async () => {
    const { surConfirmation } = rendreModale({
      motDeConfirmation: 'SUPPRIMER',
    });

    const confirmation = screen.getByRole('button', {
      name: 'Supprimer la recette',
    });
    expect(confirmation).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/SUPPRIMER/), 'SUPPRIMER');

    expect(confirmation).toBeEnabled();
    await userEvent.click(confirmation);
    expect(surConfirmation).toHaveBeenCalled();
  });

  it('compare le mot de confirmation à l’identique', async () => {
    rendreModale({ motDeConfirmation: 'SUPPRIMER' });

    await userEvent.type(screen.getByLabelText(/SUPPRIMER/), 'supprimer');

    expect(
      screen.getByRole('button', { name: 'Supprimer la recette' }),
    ).toBeDisabled();
  });
});
