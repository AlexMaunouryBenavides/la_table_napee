import type { Avis } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AvisPublie } from './avis-publie';

function avis(modifications: Partial<Avis> = {}): Avis {
  return {
    id: 1,
    note: 4,
    commentaire: 'Très bon.',
    dateCreation: '2026-05-23T12:00:00.000Z',
    utilisateur: {
      id: 'a',
      pseudo: 'Camille',
      email: 'camille@test.fr',
      role: 'utilisateur',
      dateCreation: '2026-01-01T12:00:00.000Z',
    },
    ...modifications,
  };
}

describe('AvisPublie', () => {
  it('nomme un compte supprimé, jamais « null »', () => {
    render(<AvisPublie avis={avis({ utilisateur: null })} session={null} />);

    expect(screen.getByText(/compte supprimé/i)).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });

  it('affiche la note seule quand il n’y a pas de commentaire', () => {
    // Un avis sans texte est légitime : une note est déjà un avis. Pas de bloc vide.
    const { container } = render(
      <AvisPublie avis={avis({ commentaire: null })} session={null} />,
    );

    expect(screen.getByRole('img', { name: /noté 4/i })).toBeInTheDocument();
    expect(container.querySelector('blockquote')).not.toBeInTheDocument();
  });

  it('écrit la date en français, pas en ISO', () => {
    render(<AvisPublie avis={avis()} session={null} />);

    expect(screen.getByText(/23 mai 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-05-23/)).not.toBeInTheDocument();
  });
});
