import type { Categorie } from '@recipe/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { CAMILLE } from '../../test/comptes-exemple';
import { rendreRoutes } from '../../test/rendu-route';
import { supprimerEtConfirmer } from '../../test/suppression-confirmee';
import { clientRequetes } from '../requetes/client-requetes';
import PanneauCategories from '../routes/panneau/categories';

type CorpsNom = { nom: string };

/** Une API qui tient la liste des régimes : création, renommage et suppression la
 *  changent. Les trois autres ressources restent vides. */
function apiCategories() {
  let regimes: Categorie[] = [
    { id: 3, nom: 'Végan' },
    { id: 4, nom: 'Végétarien' },
  ];

  return simulerApi({
    '/utilisateurs/moi': () => json(200, CAMILLE),
    '/regimes': (requete) => {
      if (requete?.method === 'POST') {
        const { nom } = JSON.parse(requete.body as string) as CorpsNom;
        regimes = [...regimes, { id: 9, nom }];
        return json(201, { id: 9, nom });
      }
      return json(200, regimes);
    },
    '/regimes/3': (requete) => {
      if (requete?.method === 'DELETE') {
        regimes = regimes.filter((regime) => regime.id !== 3);
        return json(204);
      }
      const { nom } = JSON.parse(requete?.body as string) as CorpsNom;
      regimes = regimes.map((regime) =>
        regime.id === 3 ? { ...regime, nom } : regime,
      );
      return json(200, { id: 3, nom });
    },
    '/criteres-sante': () => json(200, []),
    '/types-aliment': () => json(200, []),
    '/nationalites': () => json(200, []),
  });
}

async function rendre() {
  await rendreRoutes('/panneau/categories/regimes', {
    '/panneau/categories/:ressource': <PanneauCategories />,
  });
  await screen.findByText('Végétarien');
}

const ligneDe = (nom: string) => {
  const ligne = screen.getByText(nom).closest('tr');
  if (ligne === null) {
    throw new Error(`Aucune ligne pour ${nom}`);
  }
  return ligne;
};

describe('panneau — catégories', () => {
  it('ajoute une valeur, visible aussitôt ici et dans les filtres du catalogue', async () => {
    apiCategories();
    await rendre();

    await userEvent.type(screen.getByLabelText(/nom/i), 'Sans gluten');
    await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    expect(await screen.findByText('Sans gluten')).toBeInTheDocument();
    // Le catalogue lit la même requête : ses filtres ont la nouvelle valeur.
    expect(
      clientRequetes.getQueryData<Categorie[]>(['categories', 'regimes']),
    ).toContainEqual({ id: 9, nom: 'Sans gluten' });
  });

  it('renomme en place, puis repasse la ligne en lecture', async () => {
    apiCategories();
    await rendre();

    await userEvent.click(
      within(ligneDe('Végan')).getByRole('button', { name: /renommer/i }),
    );
    const champ = screen.getByDisplayValue('Végan');
    await userEvent.clear(champ);
    await userEvent.type(champ, 'Végétalien');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByText('Végétalien')).toBeInTheDocument();
    expect(
      within(ligneDe('Végétalien')).getByRole('button', { name: /renommer/i }),
    ).toBeInTheDocument();
  });

  it('retire la valeur supprimée et met le compteur de l’onglet à jour', async () => {
    apiCategories();
    await rendre();

    await supprimerEtConfirmer('Végan', /supprimer le régime/i);

    await waitFor(() => {
      expect(screen.queryByText('Végan')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('link', { name: /régimes · 1/i }),
    ).toBeInTheDocument();
  });
});
