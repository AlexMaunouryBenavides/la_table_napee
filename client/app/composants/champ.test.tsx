import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Champ } from './champ';

describe('Champ', () => {
  it('garde son libellé visible et relie son message d’erreur au contrôle', () => {
    render(
      <Champ
        nom="email"
        libelle="Adresse e-mail"
        erreur="Cette adresse est déjà utilisée."
      />,
    );

    const controle = screen.getByLabelText('Adresse e-mail');
    expect(controle).toHaveAttribute('aria-invalid', 'true');
    expect(controle).toHaveAccessibleDescription(
      'Cette adresse est déjà utilisée.',
    );
  });

  it('n’annonce aucune erreur quand il n’y en a pas', () => {
    render(<Champ nom="email" libelle="Adresse e-mail" />);

    expect(screen.getByLabelText('Adresse e-mail')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
