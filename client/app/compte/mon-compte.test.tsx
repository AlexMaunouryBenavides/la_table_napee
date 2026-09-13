import type { Utilisateur } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  json,
  simulerApi,
  type ReponsesSimulees,
} from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';
import { clientRequetes } from '../requetes/client-requetes';
import { requeteSession } from '../requetes/session';
import MonCompte from '../routes/mon-compte';
import { useSession } from '../session-courante';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-12T12:00:00.000Z',
};

/** Ce que l'en-tête du site afficherait : il lit la même session. */
function EnTete() {
  const { session } = useSession();

  return <p>en-tête : {session?.pseudo ?? 'visiteur'}</p>;
}

/** Un compte qui vit : le profil se modifie, la suppression ferme la session. */
function apiCompte(surcharges: ReponsesSimulees = {}) {
  let moi: Utilisateur | null = CAMILLE;

  return simulerApi({
    '/utilisateurs/moi': (requete) => {
      if (requete?.method === 'PATCH') {
        moi = { ...CAMILLE, ...(JSON.parse(requete.body as string) as object) };
        return json(200, moi);
      }
      if (requete?.method === 'DELETE') {
        moi = null;
        return json(204);
      }
      return moi === null
        ? json(401, { statusCode: 401, message: 'Non authentifié' })
        : json(200, moi);
    },
    '/auth/rafraichissement': () =>
      json(401, { statusCode: 401, message: 'Non authentifié' }),
    '/utilisateurs/moi/mot-de-passe': () => json(204),
    ...surcharges,
  });
}

async function rendre() {
  await clientRequetes.prefetchQuery(requeteSession);
  render(
    <MemoryRouter>
      <AvecRequetes>
        <EnTete />
        <MonCompte />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

const champ = (libelle: RegExp) => screen.getByLabelText(libelle);
const bouton = (nom: RegExp) => screen.getByRole('button', { name: nom });

async function remplirMotDePasse() {
  await userEvent.type(champ(/mot de passe actuel/i), 'Password123!');
  await userEvent.type(
    champ(/nouveau mot de passe/i),
    'une-phrase-assez-longue',
  );
  await userEvent.type(champ(/^confirmation/i), 'une-phrase-assez-longue');
}

describe('mon compte — profil', () => {
  it('met le nouveau pseudo dans l’en-tête sans recharger la page', async () => {
    apiCompte();
    await rendre();

    await userEvent.clear(champ(/pseudo/i));
    await userEvent.type(champ(/pseudo/i), 'Camomille');
    await userEvent.click(bouton(/enregistrer/i));

    expect(await screen.findByText('en-tête : Camomille')).toBeInTheDocument();
  });

  it('affiche une erreur de format sous son champ', async () => {
    apiCompte({
      '/utilisateurs/moi': (requete) =>
        requete?.method === 'PATCH'
          ? json(400, {
              statusCode: 400,
              message: 'Requête invalide',
              details: ['email must be an email'],
            })
          : json(200, CAMILLE),
    });
    await rendre();

    await userEvent.click(bouton(/enregistrer/i));

    expect(
      await screen.findByText('email must be an email'),
    ).toBeInTheDocument();
    expect(champ(/adresse e-mail/i)).toHaveAttribute('aria-invalid', 'true');
    expect(champ(/adresse e-mail/i)).toHaveAccessibleDescription(
      /email must be an email/,
    );
  });
});

describe('mon compte — mot de passe', () => {
  it('annonce les autres appareils déconnectés et garde la session ici', async () => {
    apiCompte();
    await rendre();

    await remplirMotDePasse();
    await userEvent.click(bouton(/changer le mot de passe/i));

    expect(await screen.findByRole('status')).toHaveTextContent(
      /autres appareils sont déconnectés/i,
    );
    expect(screen.getByText('en-tête : Camille')).toBeInTheDocument();
  });

  it('n’efface pas la saisie du profil quand le mot de passe échoue', async () => {
    apiCompte({
      '/utilisateurs/moi/mot-de-passe': () =>
        json(400, {
          statusCode: 400,
          message: 'L’ancien mot de passe est incorrect',
        }),
    });
    await rendre();

    await userEvent.clear(champ(/pseudo/i));
    await userEvent.type(champ(/pseudo/i), 'Brouillon');
    await remplirMotDePasse();
    await userEvent.click(bouton(/changer le mot de passe/i));

    expect(
      await screen.findByText('L’ancien mot de passe est incorrect'),
    ).toBeInTheDocument();
    expect(champ(/mot de passe actuel/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(champ(/pseudo/i)).toHaveValue('Brouillon');
  });
});

describe('mon compte — suppression et envois', () => {
  it('fait ses adieux et repasse l’en-tête en visiteur après confirmation', async () => {
    apiCompte();
    await rendre();

    await userEvent.click(bouton(/supprimer mon compte…/i));
    const modale = screen.getByRole('dialog');
    await userEvent.type(within(modale).getByRole('textbox'), 'SUPPRIMER');
    await userEvent.click(
      within(modale).getByRole('button', { name: /supprimer mon compte/i }),
    );

    expect(
      await screen.findByRole('heading', { name: /compte a été supprimé/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('en-tête : visiteur')).toBeInTheDocument();
  });

  it('ne bloque que les boutons du formulaire en cours d’envoi', async () => {
    apiCompte({
      '/utilisateurs/moi': (requete) =>
        requete?.method === 'PATCH'
          ? new Promise<Response>(() => undefined)
          : json(200, CAMILLE),
    });
    await rendre();

    await userEvent.click(bouton(/enregistrer/i));

    expect(bouton(/enregistrer/i)).toBeDisabled();
    expect(bouton(/changer le mot de passe/i)).toBeEnabled();
  });
});
