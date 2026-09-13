import type { Utilisateur } from '@recipe/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  json,
  simulerApi,
  type ReponsesSimulees,
} from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';
import Connexion from '../routes/connexion';
import Inscription from '../routes/inscription';
import { useSession } from '../session-courante';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-01T12:00:00.000Z',
};

const NON_CONNECTE = () =>
  json(401, { statusCode: 401, message: 'Non authentifié' });

function Accueil() {
  const { session } = useSession();

  return <p>accueil : {session?.pseudo ?? 'visiteur'}</p>;
}

/** Visiteur au départ ; `/auth/connexion` ouvre la session, sauf surcharge. */
function apiAuth(surcharges: ReponsesSimulees = {}) {
  let connecte = false;

  return simulerApi({
    '/utilisateurs/moi': () => (connecte ? json(200, CAMILLE) : NON_CONNECTE()),
    '/auth/rafraichissement': NON_CONNECTE,
    '/auth/connexion': () => {
      connecte = true;
      return json(200, CAMILLE);
    },
    ...surcharges,
  });
}

function rendre(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AvecRequetes>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
        </Routes>
      </AvecRequetes>
    </MemoryRouter>,
  );
}

const email = () => screen.getByLabelText(/adresse e-mail/i);
const motDePasse = () => screen.getByLabelText(/^mot de passe/i);

describe('connexion', () => {
  it('bloque le bouton pendant l’envoi, puis mène à l’accueil connecté', async () => {
    let repondre: () => void = () => undefined;
    let connecte = false;
    apiAuth({
      '/utilisateurs/moi': () =>
        connecte ? json(200, CAMILLE) : NON_CONNECTE(),
      '/auth/connexion': () =>
        new Promise<Response>((resoudre) => {
          repondre = () => {
            connecte = true;
            resoudre(json(200, CAMILLE));
          };
        }),
    });
    rendre('/connexion');

    await userEvent.type(
      await screen.findByLabelText(/adresse e-mail/i),
      CAMILLE.email,
    );
    await userEvent.type(motDePasse(), 'Password123!');
    await userEvent.click(
      screen.getByRole('button', { name: /se connecter/i }),
    );

    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeDisabled();
    repondre();
    expect(await screen.findByText('accueil : Camille')).toBeInTheDocument();
  });

  it('dit « E-mail ou mot de passe incorrect » et garde l’adresse saisie', async () => {
    apiAuth({
      '/auth/connexion': () =>
        json(401, { statusCode: 401, message: 'Identifiants invalides' }),
    });
    rendre('/connexion');

    await userEvent.type(
      await screen.findByLabelText(/adresse e-mail/i),
      CAMILLE.email,
    );
    await userEvent.type(motDePasse(), 'mauvais-mot-de-passe');
    await userEvent.click(
      screen.getByRole('button', { name: /se connecter/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou mot de passe incorrect.',
    );
    expect(email()).toHaveValue(CAMILLE.email);
  });
});

describe('inscription', () => {
  it('renvoie vers la connexion avec le bandeau « compte créé »', async () => {
    apiAuth({ '/auth/inscription': () => json(201, CAMILLE) });
    rendre('/inscription');

    await userEvent.type(
      await screen.findByLabelText(/adresse e-mail/i),
      CAMILLE.email,
    );
    await userEvent.type(motDePasse(), 'une-phrase-assez-longue');
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      /compte est créé/i,
    );
    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeInTheDocument();
  });

  it('affiche le refus et garde l’adresse et le pseudo saisis', async () => {
    apiAuth({
      '/auth/inscription': () =>
        json(409, { statusCode: 409, message: 'Email ou pseudo déjà utilisé' }),
    });
    rendre('/inscription');

    await userEvent.type(
      await screen.findByLabelText(/adresse e-mail/i),
      CAMILLE.email,
    );
    await userEvent.type(motDePasse(), 'une-phrase-assez-longue');
    await userEvent.type(screen.getByLabelText(/pseudo/i), 'Camille');
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/déjà utilisé/i);
    await waitFor(() => {
      expect(email()).toHaveValue(CAMILLE.email);
    });
    expect(screen.getByLabelText(/pseudo/i)).toHaveValue('Camille');
  });
});
