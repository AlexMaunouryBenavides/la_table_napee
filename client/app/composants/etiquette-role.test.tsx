import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EtiquetteRole } from './etiquette-role';

describe('EtiquetteRole', () => {
  it.each([
    ['admin', /administrateur/i],
    ['moderateur', /modérateur/i],
    ['utilisateur', /utilisateur/i],
  ] as const)('écrit le rôle « %s » en toutes lettres', (role, attendu) => {
    // La couleur n'est jamais le seul porteur d'information.
    render(<EtiquetteRole role={role} />);

    expect(screen.getByText(attendu)).toBeInTheDocument();
  });
});
