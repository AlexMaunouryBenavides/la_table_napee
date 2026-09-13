import type { RoleUtilisateur } from '@recipe/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { CAMILLE, ligneDe, THOMAS } from '../../test/comptes-exemple';
import { pageDe } from '../../test/recette-exemple';
import { rendreRoutes } from '../../test/rendu-route';
import PanneauUtilisateurs from '../routes/panneau/utilisateurs';

/** Une API qui tient la liste des comptes : rôle et suppression la changent. */
function apiComptes() {
  let comptes = [CAMILLE, THOMAS];

  return simulerApi({
    '/utilisateurs/moi': () => json(200, CAMILLE),
    '/utilisateurs': () => json(200, pageDe(comptes, 20)),
    '/utilisateurs/u-thomas/role': (requete) => {
      const { role } = JSON.parse(requete?.body as string) as {
        role: RoleUtilisateur;
      };
      comptes = comptes.map((compte) =>
        compte.id === THOMAS.id ? { ...compte, role } : compte,
      );
      return json(200, { ...THOMAS, role });
    },
    '/utilisateurs/u-thomas': () => {
      comptes = comptes.filter((compte) => compte.id !== THOMAS.id);
      return json(204);
    },
  });
}

async function rendre() {
  await rendreRoutes('/panneau/utilisateurs', {
    '/panneau/utilisateurs': <PanneauUtilisateurs />,
  });
  await screen.findByText(THOMAS.email);
}

describe('panneau — utilisateurs', () => {
  it('met la ligne à jour après un changement de rôle, sans recharger', async () => {
    apiComptes();
    await rendre();

    await userEvent.selectOptions(
      within(ligneDe(THOMAS.email)).getByRole('combobox'),
      'admin',
    );

    await waitFor(() => {
      expect(within(ligneDe(THOMAS.email)).getByRole('combobox')).toHaveValue(
        'admin',
      );
    });
    expect(within(ligneDe(THOMAS.email)).getByRole('combobox')).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('retire le compte de la liste une fois la suppression confirmée', async () => {
    apiComptes();
    await rendre();

    await userEvent.click(
      within(ligneDe(THOMAS.email)).getByRole('button', { name: /supprimer/i }),
    );
    const modale = screen.getByRole('dialog');
    await userEvent.type(within(modale).getByRole('textbox'), 'SUPPRIMER');
    await userEvent.click(
      within(modale).getByRole('button', { name: /supprimer le compte/i }),
    );

    await waitFor(() => {
      expect(screen.queryByText(THOMAS.email)).not.toBeInTheDocument();
    });
    expect(screen.getByText(CAMILLE.email)).toBeInTheDocument();
  });
});
