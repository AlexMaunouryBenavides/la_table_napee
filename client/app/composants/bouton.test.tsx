import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Bouton } from './bouton';

describe('Bouton', () => {
  it('signale son attente et refuse un second clic', async () => {
    // Sans cela, un double clic sur « Enregistrer » envoie deux fois la recette.
    const action = vi.fn();
    render(
      <Bouton variante="primaire" chargement onClick={action}>
        Enregistrer
      </Bouton>,
    );

    const bouton = screen.getByRole('button');
    expect(bouton).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(bouton);
    expect(action).not.toHaveBeenCalled();
  });

  it('déclenche son action quand il n’attend pas', async () => {
    const action = vi.fn();
    render(
      <Bouton variante="primaire" onClick={action}>
        Enregistrer
      </Bouton>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(action).toHaveBeenCalledTimes(1);
  });
});
