import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { EchecAuth } from './ecran-connexion';
import { EcranInscription } from './ecran-inscription';

/** Rend l'écran et RETOURNE l'espion d'envoi : c'est ainsi qu'un test affirme que
 *  rien n'est parti. */
function rendre(echec: EchecAuth | null = null) {
  const surEnvoi = vi.fn();

  render(
    <MemoryRouter>
      <EcranInscription
        session={null}
        echec={echec}
        envoiEnCours={false}
        surEnvoi={surEnvoi}
      />
    </MemoryRouter>,
  );

  return surEnvoi;
}

describe('EcranInscription', () => {
  it('n’expose AUCUN champ de rôle', () => {
    // Le rôle ne s'attribue jamais depuis le client : le champ ne doit pas exister,
    // pas être caché.
    rendre();

    expect(screen.queryByLabelText(/rôle/i)).not.toBeInTheDocument();
    expect(document.querySelector('[name="role"]')).not.toBeInTheDocument();
  });

  it('refuse un mot de passe trop court sans appeler le serveur', async () => {
    const action = rendre();

    await userEvent.type(
      screen.getByLabelText(/adresse e-mail/i),
      'camille@test.fr',
    );
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'court');
    await userEvent.click(screen.getByRole('button', { name: /créer/i }));

    // Le texte d'AIDE parle aussi de 12 caractères : on vise le refus, pas le conseil.
    expect(
      screen.getByText(/doit faire au moins 12 caractères/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(action).not.toHaveBeenCalled();
  });

  it('affiche le refus de doublon en bandeau, sans l’attacher à un champ', () => {
    // L'API dit « Email ou pseudo déjà utilisé » : elle ne dit PAS lequel, donc on
    // ne peut pas le rattacher honnêtement à l'un des deux.
    rendre({ statut: 409, message: 'Email ou pseudo déjà utilisé' });

    expect(screen.getByRole('alert')).toHaveTextContent(/déjà utilisé/i);
    expect(screen.getByLabelText(/adresse e-mail/i)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('garde la jauge de robustesse hors du chemin : elle informe, elle ne juge pas', async () => {
    const action = rendre();

    await userEvent.type(
      screen.getByLabelText(/adresse e-mail/i),
      'camille@test.fr',
    );
    await userEvent.type(
      screen.getByLabelText(/mot de passe/i),
      'motdepasse-de-douze',
    );

    expect(screen.getByTestId('jauge-mot-de-passe')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: /créer/i }));
    expect(action).toHaveBeenCalled();
  });

  it('offre d’afficher le mot de passe', () => {
    rendre();

    expect(
      screen.getByRole('button', { name: /afficher le mot de passe/i }),
    ).toBeInTheDocument();
  });

  it('marque le pseudo comme facultatif', () => {
    rendre();

    expect(screen.getByLabelText(/pseudo.*optionnel/i)).toBeInTheDocument();
  });
});
