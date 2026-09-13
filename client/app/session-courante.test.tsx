import type { Utilisateur } from '@recipe/types';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../test/api-simulee';
import { AvecRequetes } from '../test/requetes';

import { clientRequetes } from './requetes/client-requetes';
import { requeteSession } from './requetes/session';
import { clientAction } from './routes/connexion';
import { useDeconnexion, useSession } from './session-courante';

const MOI: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@exemple.test',
  role: 'utilisateur',
  dateCreation: '2026-09-12T12:00:00.000Z',
};

const NON_CONNECTE = () =>
  json(401, { statusCode: 401, message: 'Non authentifié' });

function Pseudo() {
  const { session } = useSession();

  return <p>{session?.pseudo ?? 'visiteur'}</p>;
}

function BoutonDeconnexion() {
  return <button onClick={useDeconnexion()}>Se déconnecter</button>;
}

/** Une API qui se souvient si on est connecté : la session suit connexion et déconnexion. */
function apiAvecSession(connecteAuDepart: boolean) {
  let connecte = connecteAuDepart;

  return simulerApi({
    '/utilisateurs/moi': () => (connecte ? json(200, MOI) : NON_CONNECTE()),
    '/auth/rafraichissement': NON_CONNECTE,
    '/auth/connexion': () => {
      connecte = true;
      return json(200, MOI);
    },
    '/auth/deconnexion': () => {
      connecte = false;
      return new Response(null, { status: 204 });
    },
  });
}

describe('useSession', () => {
  it('rend l’utilisateur connecté', async () => {
    apiAvecSession(true);

    const { result } = renderHook(useSession, { wrapper: AvecRequetes });

    await waitFor(() => {
      expect(result.current).toEqual({
        session: MOI,
        sessionIndisponible: false,
      });
    });
  });

  it('rend un visiteur sur un 401 : ce n’est pas une panne', async () => {
    apiAvecSession(false);

    const { result } = renderHook(useSession, { wrapper: AvecRequetes });

    await waitFor(() => {
      expect(result.current).toEqual({
        session: null,
        sessionIndisponible: false,
      });
    });
  });

  it('dit la session indisponible quand l’API est en panne', async () => {
    simulerApi({
      '/utilisateurs/moi': () =>
        json(500, { statusCode: 500, message: 'Erreur interne' }),
    });

    const { result } = renderHook(useSession, { wrapper: AvecRequetes });

    await waitFor(() => {
      expect(clientRequetes.getQueryState(['session'])?.status).toBe('error');
    });
    expect(result.current).toEqual({
      session: null,
      sessionIndisponible: true,
    });
  });

  it('rappelle l’API après une panne : la panne n’est pas gardée comme réponse', async () => {
    let enPanne = true;
    const api = simulerApi({
      '/utilisateurs/moi': () =>
        enPanne
          ? json(500, { statusCode: 500, message: 'Erreur interne' })
          : json(200, MOI),
    });

    await clientRequetes.prefetchQuery(requeteSession);
    enPanne = false;
    await clientRequetes.prefetchQuery(requeteSession);

    expect(api.appelsA('/utilisateurs/moi')).toBe(2);
    expect(clientRequetes.getQueryData(['session'])).toEqual(MOI);
  });

  it('ne fait qu’un appel quand plusieurs composants lisent la session', async () => {
    const api = apiAvecSession(true);

    render(
      <AvecRequetes>
        <Pseudo />
        <Pseudo />
      </AvecRequetes>,
    );

    expect(await screen.findAllByText('Camille')).toHaveLength(2);
    expect(api.appelsA('/utilisateurs/moi')).toBe(1);
  });
});

describe('la session suit la connexion et la déconnexion', () => {
  it('passe au visiteur après une déconnexion, sans recharger la page', async () => {
    apiAvecSession(true);
    render(
      <MemoryRouter>
        <AvecRequetes>
          <Pseudo />
          <BoutonDeconnexion />
        </AvecRequetes>
      </MemoryRouter>,
    );
    await screen.findByText('Camille');

    await userEvent.click(
      screen.getByRole('button', { name: 'Se déconnecter' }),
    );

    expect(await screen.findByText('visiteur')).toBeInTheDocument();
  });

  it('montre l’utilisateur après une connexion, sans recharger la page', async () => {
    apiAvecSession(false);
    render(
      <AvecRequetes>
        <Pseudo />
      </AvecRequetes>,
    );
    await screen.findByText('visiteur');

    const formulaire = new FormData();
    formulaire.set('email', MOI.email);
    formulaire.set('motDePasse', 'Password123!');
    await clientAction({
      request: new Request('http://localhost/connexion', {
        method: 'POST',
        body: formulaire,
      }),
    } as unknown as Parameters<typeof clientAction>[0]);

    expect(await screen.findByText('Camille')).toBeInTheDocument();
  });
});
