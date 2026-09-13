import type { Utilisateur } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { CAMILLE, ligneDe, THOMAS } from '../../test/comptes-exemple';
import { pageDe } from '../../test/recette-exemple';
import { AvecRequetes } from '../../test/requetes';

import { EcranListeUtilisateurs } from './liste-utilisateurs';

const SANS_PSEUDO: Utilisateur = {
  id: 'u-anonyme',
  pseudo: null,
  email: 'k.durand@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-04-07T12:00:00.000Z',
};

function rendre(comptes: Utilisateur[] = [CAMILLE, THOMAS]) {
  render(
    <MemoryRouter>
      <AvecRequetes>
        <EcranListeUtilisateurs
          resultats={pageDe(comptes, 20)}
          echec={null}
          session={CAMILLE}
        />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

describe('EcranListeUtilisateurs — sa propre ligne', () => {
  it('verrouille le rôle et la suppression de son propre compte', () => {
    // Se retirer son rôle est presque toujours une fausse manœuvre : l'API refuse,
    // autant ne pas l'offrir.
    rendre();

    const mienne = ligneDe(CAMILLE.email);

    expect(within(mienne).getByRole('combobox')).toBeDisabled();
    expect(
      within(mienne).queryByRole('button', { name: /supprimer/i }),
    ).not.toBeInTheDocument();
    expect(mienne).toHaveTextContent(/votre compte/i);
  });

  it('laisse les autres lignes agissables', () => {
    rendre();

    const autre = ligneDe(THOMAS.email);

    expect(within(autre).getByRole('combobox')).toBeEnabled();
    expect(
      within(autre).getByRole('button', { name: /supprimer/i }),
    ).toBeInTheDocument();
  });
});

describe('EcranListeUtilisateurs — l’affichage d’un compte', () => {
  it('nomme un compte sans pseudo sans écrire « null »', () => {
    rendre([CAMILLE, SANS_PSEUDO]);

    const ligne = ligneDe('k.durand@test.fr');

    expect(ligne).toHaveTextContent(/sans pseudo/i);
    expect(ligne).not.toHaveTextContent(/null/);
  });
});

describe('EcranListeUtilisateurs — les refus', () => {
  it('affiche le refus SUR la ligne concernée, et remet l’ancien rôle', async () => {
    simulerApi({
      '/utilisateurs/u-thomas/role': () =>
        json(409, {
          statusCode: 409,
          message: 'C’est le dernier administrateur',
        }),
    });
    rendre();

    await userEvent.selectOptions(
      within(ligneDe(THOMAS.email)).getByRole('combobox'),
      'admin',
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /dernier administrateur/i,
    );
    expect(within(ligneDe(THOMAS.email)).getByRole('combobox')).toHaveValue(
      'moderateur',
    );
    expect(ligneDe(CAMILLE.email)).not.toHaveTextContent(
      /dernier administrateur/i,
    );
  });

  it('ne met en attente que la ligne en cours', async () => {
    simulerApi({
      '/utilisateurs/u-thomas/role': () =>
        new Promise<Response>(() => undefined),
    });
    rendre();

    await userEvent.selectOptions(
      within(ligneDe(THOMAS.email)).getByRole('combobox'),
      'admin',
    );

    expect(within(ligneDe(THOMAS.email)).getByRole('combobox')).toBeDisabled();
    // La ligne de Camille est verrouillée pour une autre raison : c'est la sienne.
    // On vérifie donc que la liste RESTE affichée, sans rechargement global.
    expect(screen.getByText(CAMILLE.email)).toBeInTheDocument();
  });
});

describe('EcranListeUtilisateurs — la suppression', () => {
  it('nomme le compte visé et annonce que ses avis deviennent anonymes', async () => {
    rendre();

    await userEvent.click(
      within(ligneDe(THOMAS.email)).getByRole('button', { name: /supprimer/i }),
    );

    const modale = screen.getByRole('dialog');

    expect(modale).toHaveTextContent(/thomas/i);
    expect(modale).toHaveTextContent(/anonym/i);
  });
});
