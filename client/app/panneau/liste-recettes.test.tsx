import type { Page, RecetteResume } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { EcranListeRecettes } from './liste-recettes';
import type { ResultatSuppression } from './suppression-recette';

function recette(id: number, titre: string): RecetteResume {
  return {
    id,
    titre,
    image: `${String(id)}.jpg`,
    difficulte: 'moyen',
    typeRecette: 'plat',
    tempsPreparation: 30,
    tempsCuisson: 40,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: 4.8,
  };
}

const TARTE = recette(12, 'Tarte fine aux tomates confites');

function page(donnees: RecetteResume[]): Page<RecetteResume> {
  return { donnees, total: donnees.length, page: 1, limite: 12 };
}

type Options = {
  resultats?: Page<RecetteResume> | null;
  chargement?: boolean;
  url?: string;
  action?: () => Promise<ResultatSuppression> | ResultatSuppression;
};

function rendre({
  resultats = page([TARTE]),
  chargement = false,
  url = '/panneau/recettes',
  action,
}: Options = {}) {
  const routeur = createMemoryRouter(
    [
      {
        path: '/panneau/recettes',
        element: (
          <EcranListeRecettes
            resultats={resultats}
            echec={null}
            chargement={chargement}
          />
        ),
        action: action ?? (() => null),
      },
    ],
    { initialEntries: [url] },
  );

  render(<RouterProvider router={routeur} />);
}

async function demanderLaSuppression() {
  await userEvent.click(screen.getByRole('button', { name: /supprimer/i }));

  return screen.getByRole('dialog');
}

describe('EcranListeRecettes — la confirmation', () => {
  it('nomme la recette visée et le sort de ses avis', async () => {
    // Supprimer « une recette » et supprimer CELLE-CI ne demandent pas la même
    // attention. Et la disparition des avis est la conséquence non évidente.
    rendre();

    const modale = await demanderLaSuppression();

    expect(modale).toHaveTextContent(/tarte fine aux tomates confites/i);
    expect(modale).toHaveTextContent(/avis/i);
  });

  it('ne retire pas la ligne avant la réponse', async () => {
    // Pas de suppression optimiste : une ligne qui disparaît puis revient est pire
    // qu'une ligne qui attend.
    rendre({ action: () => new Promise(() => undefined) });

    const modale = await demanderLaSuppression();
    await userEvent.click(
      within(modale).getByRole('button', { name: /supprimer la recette/i }),
    );

    expect(await screen.findByText(/suppression…/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tarte fine aux tomates confites/i),
    ).toBeInTheDocument();
  });

  it('laisse la ligne en place, signalée, quand la suppression échoue', async () => {
    rendre({
      action: () => ({
        id: 12,
        supprime: false,
        message: 'Le service est indisponible.',
      }),
    });

    const modale = await demanderLaSuppression();
    await userEvent.click(
      within(modale).getByRole('button', { name: /supprimer la recette/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/indisponible/i);
    expect(
      screen.getByText(/tarte fine aux tomates confites/i),
    ).toBeInTheDocument();
  });
});

describe('EcranListeRecettes — les états vides', () => {
  it('distingue un catalogue neuf d’une recherche sans résultat', () => {
    rendre({ resultats: page([]) });

    expect(
      screen.getByText(/aucune recette pour l’instant/i),
    ).toBeInTheDocument();
  });

  it('propose d’effacer les critères quand c’est la recherche qui ne rend rien', () => {
    rendre({
      resultats: page([]),
      url: '/panneau/recettes?recherche=tartiflette',
    });

    expect(screen.getByText(/tartiflette/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /effacer la recherche/i }),
    ).toBeInTheDocument();
  });
});

describe('EcranListeRecettes — le chargement', () => {
  it('garde les en-têtes de colonnes lisibles pendant le chargement', () => {
    // La structure du tableau est connue avant les données : elle n'a aucune raison
    // de disparaître, ni de faire sauter la page quand les lignes arrivent.
    rendre({ chargement: true });

    expect(
      screen.getByRole('columnheader', { name: /recette/i }),
    ).toBeInTheDocument();
  });
});

describe('EcranListeRecettes — les critères', () => {
  it('écrit le filtre choisi dans l’URL sans perdre la recherche', async () => {
    rendre({ url: '/panneau/recettes?recherche=tomate' });

    await userEvent.selectOptions(
      screen.getByLabelText(/difficulté/i),
      'facile',
    );

    expect(screen.getByLabelText(/difficulté/i)).toHaveValue('facile');
    expect(screen.getByDisplayValue('tomate')).toBeInTheDocument();
  });
});
