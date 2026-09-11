import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Bandeau } from './bandeau';

describe('Bandeau', () => {
  it.each(['erreur', 'alerte'] as const)(
    'interrompt le lecteur d’écran pour un ton « %s »',
    (ton) => {
      render(<Bandeau ton={ton} message="Quelque chose a échoué." />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    },
  );

  it.each(['succes', 'info'] as const)(
    'attend la fin de la phrase en cours pour un ton « %s »',
    (ton) => {
      // Interrompre une lecture pour annoncer un succès est une faute d'usage.
      render(<Bandeau ton={ton} message="C’est enregistré." />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    },
  );

  it('rend chaque erreur de validation renvoyée par l’API', () => {
    render(
      <Bandeau
        ton="erreur"
        message="Requête invalide"
        details={['Le titre est obligatoire.', 'La difficulté est inconnue.']}
      />,
    );

    expect(screen.getByText('Le titre est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('La difficulté est inconnue.')).toBeInTheDocument();
  });

  it('ne rend pas de liste vide quand il n’y a aucun détail', () => {
    render(<Bandeau ton="erreur" message="Service indisponible." />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('est focalisable par programme, pour recevoir le focus après un échec', () => {
    render(<Bandeau ton="erreur" message="Requête invalide" />);

    const bandeau = screen.getByRole('alert');
    bandeau.focus();

    expect(bandeau).toHaveFocus();
  });
});
