import type { Page, RecetteResume } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { pageDe, resumeDe } from '../../test/recette-exemple';
import { AvecRequetes } from '../../test/requetes';

import { EcranListeRecettes } from './liste-recettes';

const TARTE = resumeDe(12, 'Tarte fine aux tomates confites');
const GLACE = resumeDe(13, 'Glace au basilic');

type Options = {
  resultats?: Page<RecetteResume> | null;
  chargement?: boolean;
  url?: string;
};

function rendre({
  resultats = pageDe([TARTE]),
  chargement = false,
  url = '/panneau/recettes',
}: Options = {}) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AvecRequetes>
        <EcranListeRecettes
          resultats={resultats}
          echec={null}
          chargement={chargement}
        />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

async function confirmerLaSuppression(recette: RecetteResume) {
  await userEvent.click(
    screen.getByRole('button', { name: `Supprimer ${recette.titre}` }),
  );
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /supprimer la recette/i,
    }),
  );
}

describe('EcranListeRecettes — la confirmation', () => {
  it('nomme la recette visée et le sort de ses avis', async () => {
    // Supprimer « une recette » et supprimer CELLE-CI ne demandent pas la même
    // attention. Et la disparition des avis est la conséquence non évidente.
    rendre();

    await userEvent.click(screen.getByRole('button', { name: /supprimer/i }));
    const modale = screen.getByRole('dialog');

    expect(modale).toHaveTextContent(/tarte fine aux tomates confites/i);
    expect(modale).toHaveTextContent(/avis/i);
  });

  it('ne retire pas la ligne avant la réponse', async () => {
    // Pas de suppression optimiste : une ligne qui disparaît puis revient est pire
    // qu'une ligne qui attend.
    simulerApi({
      '/recettes/12': () => new Promise<Response>(() => undefined),
    });
    rendre();

    await confirmerLaSuppression(TARTE);

    expect(await screen.findByText(/suppression…/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tarte fine aux tomates confites/i),
    ).toBeInTheDocument();
  });

  it('signale l’échec sur sa ligne et laisse les autres agissables', async () => {
    simulerApi({
      '/recettes/12': () =>
        json(500, { statusCode: 500, message: 'Le service est indisponible.' }),
    });
    rendre({ resultats: pageDe([TARTE, GLACE]) });

    await confirmerLaSuppression(TARTE);

    expect(await screen.findByRole('alert')).toHaveTextContent(/indisponible/i);
    expect(
      screen.getByText(/tarte fine aux tomates confites/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Supprimer ${GLACE.titre}` }),
    ).toBeEnabled();
  });
});

describe('EcranListeRecettes — les états vides', () => {
  it('distingue un catalogue neuf d’une recherche sans résultat', () => {
    rendre({ resultats: pageDe([]) });

    expect(
      screen.getByText(/aucune recette pour l’instant/i),
    ).toBeInTheDocument();
  });

  it('propose d’effacer les critères quand c’est la recherche qui ne rend rien', () => {
    rendre({
      resultats: pageDe([]),
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
