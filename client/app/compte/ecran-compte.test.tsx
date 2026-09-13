import type { Utilisateur } from '@recipe/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { EcranCompte } from './ecran-compte';
import type { EnvoiCompte, ResultatCompte } from './mutations-compte';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-12T12:00:00.000Z',
};

/** L'état d'un formulaire au repos, ou avec le retour qu'on veut éprouver. */
function envoi(
  resultat: ResultatCompte | null = null,
  surEnvoi: EnvoiCompte['surEnvoi'] = vi.fn(),
): EnvoiCompte {
  return { resultat, envoiEnCours: false, surEnvoi };
}

function rendre({
  session = CAMILLE,
  sessionIndisponible = false,
  profil = envoi(),
  motDePasse = envoi(),
  suppression = envoi(),
}: {
  session?: Utilisateur | null;
  sessionIndisponible?: boolean;
  profil?: EnvoiCompte;
  motDePasse?: EnvoiCompte;
  suppression?: EnvoiCompte;
} = {}) {
  render(
    <MemoryRouter>
      <EcranCompte
        session={session}
        sessionIndisponible={sessionIndisponible}
        profil={profil}
        motDePasse={motDePasse}
        suppression={suppression}
      />
    </MemoryRouter>,
  );
}

describe('EcranCompte — identité', () => {
  it('salue sans pseudo plutôt qu’avec « null » ou une adresse e-mail', () => {
    // L'e-mail n'est pas un nom public : l'afficher en titre le donnerait à lire à
    // quiconque regarde l'écran par-dessus l'épaule.
    rendre({ session: { ...CAMILLE, pseudo: null } });

    const titre = screen.getByRole('heading', { level: 1 });

    expect(titre).toHaveTextContent(/^Bonjour$/);
    expect(titre).not.toHaveTextContent(/null|camille@test\.fr/i);
  });

  it('explique ce que coûte l’absence de pseudo', () => {
    rendre({ session: { ...CAMILLE, pseudo: null } });

    expect(screen.getByRole('status')).toHaveTextContent(/anonyme/i);
  });

  it('montre le rôle sans offrir de le changer', () => {
    // Modifier son propre rôle est l'affaire de l'écran 10, sur les AUTRES comptes.
    rendre({ session: { ...CAMILLE, role: 'admin' } });

    expect(screen.getByText(/administrateur/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/rôle/i)).not.toBeInTheDocument();
  });
});

describe('EcranCompte — sans session', () => {
  it('invite un visiteur à se connecter, sans formulaire ni 403', () => {
    rendre({ session: null });

    expect(screen.getByRole('link', { name: /connect/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument();
  });

  it('dit que le service est en rade quand la session n’a pas pu être lue', () => {
    // « Pas connecté faute de mieux » n'est pas « visiteur » : proposer la connexion
    // à quelqu'un qui l'est déjà serait un mensonge.
    rendre({ session: null, sessionIndisponible: true });

    expect(screen.getByRole('alert')).toHaveTextContent(/indisponible/i);
  });
});

describe('EcranCompte — retours d’action', () => {
  it('confirme l’enregistrement du profil en gardant les trois zones', () => {
    rendre({ profil: envoi({ succes: true }) });

    expect(screen.getByRole('status')).toHaveTextContent(/enregistr/i);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });

  it('dit que les autres appareils sont déconnectés, et qu’on reste connecté ici', () => {
    // L'API révoque toutes les sessions puis en rouvre une ici : le dire évite de
    // croire à une panne quand l'autre appareil demande de se reconnecter.
    rendre({ motDePasse: envoi({ succes: true }) });

    const statut = screen.getByRole('status');
    expect(statut).toHaveTextContent(/autres appareils sont déconnectés/i);
    expect(statut).toHaveTextContent(/restez connecté ici/i);
  });
});

describe('EcranCompte — suppression', () => {
  it('n’envoie rien tant que la modale n’a pas confirmé', async () => {
    const surSuppression = vi.fn();
    rendre({ suppression: envoi(null, surSuppression) });

    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(surSuppression).not.toHaveBeenCalled();
  });

  it('redit le sort des avis dans la modale, pas seulement dans la zone', async () => {
    // C'est l'information la plus importante de l'écran : elle survit au fait de ne
    // lire que la modale.
    rendre();

    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent(/anonym/i);
  });

  it('fait ses adieux au lieu de renvoyer brutalement à l’accueil', () => {
    rendre({
      session: null,
      suppression: envoi({ succes: true }),
    });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /supprimé/i,
    );
    expect(screen.getByRole('link', { name: /accueil/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/adresse e-mail/i)).not.toBeInTheDocument();
  });
});
