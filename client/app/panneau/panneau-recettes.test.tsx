import type { Utilisateur } from '@recipe/types';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { pageDe, resumeDe } from '../../test/recette-exemple';
import { AvecRequetes } from '../../test/requetes';
import { clientRequetes } from '../requetes/client-requetes';
import { requeteSession } from '../requetes/session';
import PanneauAccueil from '../routes/panneau/accueil';
import PanneauRecettes from '../routes/panneau/recettes';

const ADMIN: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'admin@exemple.test',
  role: 'admin',
  dateCreation: '2026-01-01T12:00:00.000Z',
};

const TARTE = resumeDe(12, 'Tarte fine aux tomates');
const PANNE = () => json(500, { statusCode: 500, message: 'Panne' });

async function rendre(url: string) {
  await clientRequetes.prefetchQuery(requeteSession);
  render(
    <MemoryRouter initialEntries={[url]}>
      <AvecRequetes>
        <Routes>
          <Route path="/panneau" element={<PanneauAccueil />} />
          <Route path="/panneau/recettes" element={<PanneauRecettes />} />
        </Routes>
      </AvecRequetes>
    </MemoryRouter>,
  );
}

describe('panneau — tableau de bord', () => {
  it('relance la lecture des dernières recettes avec « Réessayer », sans recharger', async () => {
    let enPanne = true;
    simulerApi({
      '/utilisateurs/moi': () => json(200, ADMIN),
      '/utilisateurs?limite=1': () => json(200, { ...pageDe([], 1), total: 3 }),
      '/recettes?limite=5': () =>
        enPanne ? PANNE() : json(200, pageDe([TARTE], 5)),
    });
    await rendre('/panneau');

    const message = await screen.findByText(/n’ont pas pu être chargées/i);
    enPanne = false;
    await userEvent.click(
      within(message).getByRole('button', { name: 'Réessayer' }),
    );

    expect(
      await screen.findByRole('link', { name: TARTE.titre }),
    ).toBeInTheDocument();
  });
});

describe('panneau — liste des recettes', () => {
  it('garde la liste affichée pendant le chargement d’autres critères', async () => {
    simulerApi({
      '/utilisateurs/moi': () => json(200, ADMIN),
      '/recettes?limite=12': () => json(200, pageDe([TARTE])),
      // Changer un filtre ramène page 1 : `page` fait partie de la requête.
      '/recettes?difficulte=facile&page=1&limite=12': () =>
        new Promise<Response>(() => undefined),
    });
    await rendre('/panneau/recettes');
    await screen.findByText(TARTE.titre);

    await userEvent.selectOptions(
      screen.getByLabelText(/difficulté/i),
      'facile',
    );

    expect(screen.getByLabelText(/difficulté/i)).toHaveValue('facile');
    expect(screen.getByText(TARTE.titre)).toBeInTheDocument();
  });

  it('retire la recette supprimée et fait relire le catalogue public', async () => {
    let supprimee = false;
    simulerApi({
      '/utilisateurs/moi': () => json(200, ADMIN),
      '/recettes?limite=12': () => json(200, pageDe(supprimee ? [] : [TARTE])),
      '/recettes/12': () => {
        supprimee = true;
        return json(204);
      },
    });
    clientRequetes.setQueryData(['recettes', 'accueil'], pageDe([TARTE], 3));
    await rendre('/panneau/recettes');

    await userEvent.click(
      await screen.findByRole('button', { name: `Supprimer ${TARTE.titre}` }),
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /supprimer la recette/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText(TARTE.titre)).not.toBeInTheDocument();
    });
    expect(
      clientRequetes.getQueryState(['recettes', 'accueil'])?.isInvalidated,
    ).toBe(true);
  });
});
