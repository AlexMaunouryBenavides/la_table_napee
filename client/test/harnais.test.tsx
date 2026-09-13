// Ce test ne vérifie aucune règle du produit : il vérifie que le harnais lui-même
// fonctionne — rendu React dans jsdom, requêtes accessibles, matchers de jest-dom,
// et démontage entre deux tests. Il reste ici tant que le front existe : le jour où
// il échoue, ce n'est pas un écran qui est cassé, c'est l'outillage.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

function CompteurDeFumee() {
  const [clics, setClics] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        setClics(clics + 1);
      }}
    >
      Cliqué {clics} fois
    </button>
  );
}

describe('harnais de tests du client', () => {
  it('rend un composant et le rend interrogeable par son rôle accessible', () => {
    render(<CompteurDeFumee />);

    expect(
      screen.getByRole('button', { name: 'Cliqué 0 fois' }),
    ).toBeInTheDocument();
  });

  it('réagit à une interaction utilisateur', async () => {
    render(<CompteurDeFumee />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('Cliqué 1 fois');
  });

  it('repart d’un document vide à chaque test', () => {
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
