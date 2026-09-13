import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ChampSecret } from './champ-secret';

function rendre() {
  const envoi = vi.fn((evenement: FormEvent) => {
    evenement.preventDefault();
  });

  render(
    <form onSubmit={envoi}>
      <ChampSecret nom="motDePasse" libelle="Mot de passe" />
    </form>,
  );

  return envoi;
}

const champ = (): HTMLElement => screen.getByLabelText(/^mot de passe$/i);

describe('ChampSecret', () => {
  it('masque la saisie par défaut', () => {
    rendre();

    expect(champ()).toHaveAttribute('type', 'password');
  });

  it('révèle la saisie sur « Afficher », et le dit', async () => {
    rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /afficher le mot de passe/i }),
    );

    expect(champ()).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /masquer le mot de passe/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('masque de nouveau sur « Masquer »', async () => {
    rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /afficher le mot de passe/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /masquer le mot de passe/i }),
    );

    expect(champ()).toHaveAttribute('type', 'password');
    expect(
      screen.getByRole('button', { name: /afficher le mot de passe/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('n’envoie pas le formulaire', async () => {
    // Un `button` sans type vaut `submit` dans un formulaire : afficher son mot de
    // passe ne doit pas tenter une connexion.
    const envoi = rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /afficher le mot de passe/i }),
    );

    expect(envoi).not.toHaveBeenCalled();
  });

  it('garde le champ relié à son libellé, et nomme le bouton en entier', () => {
    rendre();

    expect(champ().tagName).toBe('INPUT');
    expect(
      screen.getByRole('button', { name: 'Afficher le mot de passe' }),
    ).toBeInTheDocument();
  });
});
