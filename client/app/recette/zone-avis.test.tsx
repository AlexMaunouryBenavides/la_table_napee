import type { Avis, Utilisateur } from '@recipe/types';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import {
  json,
  simulerApi,
  type ReponsesSimulees,
} from '../../test/api-simulee';
import { RECETTE } from '../../test/recette-exemple';
import { AvecRequetes } from '../../test/requetes';
import { clientRequetes } from '../requetes/client-requetes';

import { requeteRecette, useRecette } from './requete-recette';
import { ZoneAvis } from './zone-avis';

const CAMILLE: Utilisateur = {
  id: 'a',
  pseudo: 'Camille',
  email: 'camille@test.fr',
  role: 'utilisateur',
  dateCreation: '2026-01-01T12:00:00.000Z',
};
const LEA: Utilisateur = { ...CAMILLE, id: 'l', pseudo: 'Léa' };
const MODERATRICE: Utilisateur = {
  ...CAMILLE,
  id: 'm',
  pseudo: 'Modo',
  role: 'moderateur',
};

function avisDe(auteur: Utilisateur | null, id = 1, commentaire = 'Très bon.') {
  return {
    id,
    note: 4,
    commentaire,
    dateCreation: '2026-05-23T12:00:00.000Z',
    utilisateur: auteur,
  } satisfies Avis;
}

function Detail({ session }: { session: Utilisateur | null }) {
  const recette = useRecette(RECETTE.id);

  return (
    <ZoneAvis recetteId={recette.id} avis={recette.avis} session={session} />
  );
}

/** Une API qui tient la liste des avis : dépôt, modification et suppression la
 *  changent, et `GET /recettes/7` la rend telle qu'elle est devenue. */
function apiAvis(depart: Avis[], surcharges: ReponsesSimulees = {}) {
  let avis = depart;

  return simulerApi({
    '/recettes/7': () => json(200, { ...RECETTE, avis }),
    '/recettes/7/avis': (requete) => {
      const corps = JSON.parse(requete?.body as string) as Pick<
        Avis,
        'note' | 'commentaire'
      >;
      const cree = { ...avisDe(CAMILLE, 99), ...corps };
      avis = [...avis, cree];
      return json(201, cree);
    },
    '/avis/1': (requete) => {
      if (requete?.method === 'DELETE') {
        avis = avis.filter((publie) => publie.id !== 1);
        return json(204);
      }
      const corps = JSON.parse(requete?.body as string) as Pick<Avis, 'note'>;
      avis = avis.map((publie) =>
        publie.id === 1 ? { ...publie, ...corps } : publie,
      );
      return json(200, avis[0]);
    },
    ...surcharges,
  });
}

async function rendreDetail(session: Utilisateur | null) {
  await clientRequetes.ensureQueryData(requeteRecette(RECETTE.id));
  render(
    <MemoryRouter>
      <AvecRequetes>
        <Detail session={session} />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

function rendre(session: Utilisateur | null, avis: Avis[]) {
  render(
    <MemoryRouter>
      <AvecRequetes>
        <ZoneAvis recetteId={1} avis={avis} session={session} />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

function articleDe(commentaire: string): HTMLElement {
  const article = screen.getByText(commentaire).closest('article');
  if (article === null) {
    throw new Error(`Aucun avis ne contient « ${commentaire} »`);
  }
  return article;
}

const boutonPublier = () =>
  screen.getByRole('button', { name: /publier mon avis/i });

describe('ZoneAvis', () => {
  it('invite un visiteur à se connecter, sans lui montrer de formulaire', () => {
    rendre(null, []);

    expect(screen.getByRole('link', { name: /connect/i })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('offre le dépôt à qui n’a pas encore donné son avis', () => {
    rendre(CAMILLE, [avisDe(null)]);

    expect(boutonPublier()).toBeInTheDocument();
  });

  it('passe en modification quand l’avis existe déjà', () => {
    // Redéposer donnerait un 409 : un seul avis par personne et par recette.
    rendre(CAMILLE, [avisDe(CAMILLE)]);

    expect(
      screen.getByRole('button', { name: /modifier mon avis/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /publier mon avis/i }),
    ).not.toBeInTheDocument();
  });
});

describe('ZoneAvis — dépôt', () => {
  it('publie l’avis et l’affiche sans recharger la page', async () => {
    apiAvis([]);
    await rendreDetail(CAMILLE);

    await userEvent.type(
      screen.getByRole('textbox', { name: /commentaire/i }),
      'Parfaite.',
    );
    await userEvent.click(boutonPublier());

    // Dans la LISTE : le formulaire, lui, garde la saisie.
    expect(await screen.findByRole('article')).toHaveTextContent('Parfaite.');
    expect(screen.getByRole('heading', { name: /avis · 1/i })).toBeVisible();
  });

  it('bloque le bouton pendant l’envoi : pas de double dépôt', async () => {
    let repondre: (reponse: Response) => void = () => undefined;
    apiAvis([], {
      '/recettes/7/avis': () =>
        new Promise<Response>((resoudre) => {
          repondre = resoudre;
        }),
    });
    await rendreDetail(CAMILLE);

    await userEvent.click(boutonPublier());

    expect(boutonPublier()).toBeDisabled();
    expect(boutonPublier()).toHaveAttribute('aria-busy', 'true');
    repondre(json(201, avisDe(CAMILLE, 99)));
    await waitFor(() => {
      expect(boutonPublier()).toBeEnabled();
    });
  });

  it('garde la note et le commentaire quand l’API refuse', async () => {
    apiAvis([], {
      '/recettes/7/avis': () =>
        json(409, {
          statusCode: 409,
          message: 'Vous avez déjà donné un avis.',
        }),
    });
    await rendreDetail(CAMILLE);

    await userEvent.click(screen.getByRole('radio', { name: '3 étoiles' }));
    await userEvent.type(
      screen.getByRole('textbox', { name: /commentaire/i }),
      'Bof.',
    );
    await userEvent.click(boutonPublier());

    expect(
      await screen.findByText('Vous avez déjà donné un avis.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /commentaire/i })).toHaveValue(
      'Bof.',
    );
    expect(screen.getByRole('radio', { name: '3 étoiles' })).toBeChecked();
  });
});

describe('ZoneAvis — modification et suppression', () => {
  it('met à jour la note de son avis sans recharger la page', async () => {
    apiAvis([avisDe(CAMILLE)]);
    await rendreDetail(CAMILLE);

    await userEvent.click(screen.getByRole('radio', { name: '2 étoiles' }));
    await userEvent.click(
      screen.getByRole('button', { name: /modifier mon avis/i }),
    );

    expect(
      await screen.findByRole('img', { name: 'Noté 2,0 sur 5' }),
    ).toBeInTheDocument();
  });

  it('retire l’avis de la liste une fois la suppression confirmée', async () => {
    const api = apiAvis([avisDe(LEA)]);
    await rendreDetail(MODERATRICE);

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(api.appelsA('/avis/1')).toBe(0);
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /supprimer l’avis/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText('Très bon.')).not.toBeInTheDocument();
    });
  });

  it('affiche l’échec d’une suppression sur cet avis seulement', async () => {
    apiAvis([avisDe(LEA), avisDe(CAMILLE, 2, 'Pas mal.')], {
      '/avis/1': () =>
        json(403, { statusCode: 403, message: 'Suppression refusée.' }),
    });
    await rendreDetail(MODERATRICE);
    const premier = articleDe('Très bon.');
    const second = articleDe('Pas mal.');

    await userEvent.click(
      within(premier).getByRole('button', { name: 'Supprimer' }),
    );
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /supprimer l’avis/i,
      }),
    );

    expect(
      await within(premier).findByText('Suppression refusée.'),
    ).toBeInTheDocument();
    expect(
      within(second).queryByText('Suppression refusée.'),
    ).not.toBeInTheDocument();
  });
});
