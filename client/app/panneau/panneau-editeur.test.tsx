import type { Recette } from '@recipe/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import '../../test/brouillons';
import {
  json,
  simulerApi,
  type ReponsesSimulees,
} from '../../test/api-simulee';
import { CAMILLE } from '../../test/comptes-exemple';
import { pageDe, RECETTE } from '../../test/recette-exemple';
import { rendreRoutes } from '../../test/rendu-route';
import { clientRequetes } from '../requetes/client-requetes';
import PanneauEditeur from '../routes/panneau/editeur-recette';

import { brouillonDepuis } from './brouillon-recette';
import { useBrouillons } from './brouillons';

/** Une recette que la validation locale accepte : un ingrédient, une étape. */
const TARTE: Recette = {
  ...RECETTE,
  compositions: [
    {
      id: 1,
      quantite: '500.00',
      unite: 'g',
      ingredient: { id: 7, nom: 'Tomates cerises' },
    },
  ],
  etapes: [{ id: 1, numero: 1, contenu: 'Enfourner.' }],
};

function apiEditeur(surcharges: ReponsesSimulees = {}) {
  return simulerApi({
    '/utilisateurs/moi': () => json(200, CAMILLE),
    '/recettes/7': () => json(200, TARTE),
    '/recettes/8': () => json(200, { ...TARTE, id: 8, titre: 'Glace' }),
    '/regimes': () => json(200, []),
    '/criteres-sante': () => json(200, []),
    '/types-aliment': () => json(200, []),
    '/nationalites': () => json(200, [{ id: 1, nom: 'Française' }]),
    ...surcharges,
  });
}

const rendre = (url: string) =>
  rendreRoutes(url, {
    '/panneau/recettes': <p>liste des recettes</p>,
    '/panneau/recettes/nouvelle': <PanneauEditeur />,
    '/panneau/recettes/:id/modifier': <PanneauEditeur />,
  });

const titre = () => screen.getByLabelText(/titre/i);
const enregistrer = () => screen.getByRole('button', { name: /enregistrer/i });

async function retitrer(nouveau: string) {
  await userEvent.clear(await screen.findByDisplayValue(TARTE.titre));
  await userEvent.type(titre(), nouveau);
}

describe('éditeur — enregistrement', () => {
  it('crée la recette, bloque le bouton pendant l’envoi, puis ouvre sa modification', async () => {
    let repondre: () => void = () => undefined;
    apiEditeur({
      '/recettes': () =>
        new Promise<Response>((resoudre) => {
          repondre = () => {
            resoudre(json(201, { ...TARTE, id: 51 }));
          };
        }),
      '/recettes/51': () => json(200, { ...TARTE, id: 51 }),
    });
    useBrouillons.getState().garder('nouvelle', brouillonDepuis(TARTE));
    clientRequetes.setQueryData(['recettes', 'accueil'], pageDe([], 3));
    await rendre('/panneau/recettes/nouvelle');

    await userEvent.click(enregistrer());
    expect(enregistrer()).toBeDisabled();
    repondre();

    expect(
      await screen.findByRole('heading', { name: /modifier la recette/i }),
    ).toBeInTheDocument();
    expect(
      clientRequetes.getQueryState(['recettes', 'accueil'])?.isInvalidated,
    ).toBe(true);
  });

  it('annonce une modification enregistrée, sans quitter la page', async () => {
    apiEditeur();
    clientRequetes.setQueryData(['recettes', 'liste', ''], pageDe([], 12));
    await rendre('/panneau/recettes/7/modifier');

    await retitrer('Tarte revisitée');
    await userEvent.click(enregistrer());

    expect(
      await screen.findByText(/modifications sont enregistrées/i),
    ).toBeInTheDocument();
    expect(titre()).toBeInTheDocument();
    expect(
      clientRequetes.getQueryState(['recettes', 'liste', ''])?.isInvalidated,
    ).toBe(true);
  });

  it('rattache un titre refusé à son champ, sans rien effacer', async () => {
    apiEditeur({
      '/recettes/7': (requete) =>
        requete?.method === 'PATCH'
          ? json(400, {
              statusCode: 400,
              message: 'Requête invalide',
              details: ['titre Ce titre est déjà utilisé'],
            })
          : json(200, TARTE),
    });
    await rendre('/panneau/recettes/7/modifier');

    await retitrer('Tarte en double');
    await userEvent.click(enregistrer());

    expect(
      await screen.findByText('titre Ce titre est déjà utilisé'),
    ).toBeInTheDocument();
    expect(titre()).toHaveAttribute('aria-invalid', 'true');
    expect(titre()).toHaveValue('Tarte en double');
  });

  it('affiche un refus général en bandeau', async () => {
    apiEditeur({
      '/recettes/7': (requete) =>
        requete?.method === 'PATCH'
          ? json(500, {
              statusCode: 500,
              message: 'Le service est indisponible.',
            })
          : json(200, TARTE),
    });
    await rendre('/panneau/recettes/7/modifier');

    await retitrer('Tarte revisitée');
    await userEvent.click(enregistrer());

    expect(await screen.findByRole('alert')).toHaveTextContent(/indisponible/i);
  });

  it('n’appelle pas l’API pour un brouillon sans étape', async () => {
    const api = apiEditeur({ '/recettes': () => json(201, TARTE) });
    useBrouillons
      .getState()
      .garder('nouvelle', { ...brouillonDepuis(TARTE), etapes: [''] });
    await rendre('/panneau/recettes/nouvelle');

    await userEvent.click(enregistrer());

    expect(await screen.findByText(/au moins une étape/i)).toBeInTheDocument();
    expect(api.appelsA('/recettes')).toBe(0);
  });
});

describe('éditeur — le brouillon', () => {
  it('retrouve la saisie en revenant, même après un rechargement', async () => {
    apiEditeur();
    const premier = await rendre('/panneau/recettes/7/modifier');
    await retitrer('Brouillon en cours');
    premier.unmount();

    // Ce que lirait une page rechargée : la session du navigateur garde le brouillon.
    expect(sessionStorage.getItem('brouillons-recettes')).toContain(
      'Brouillon en cours',
    );
    await rendre('/panneau/recettes/7/modifier');

    expect(
      await screen.findByDisplayValue('Brouillon en cours'),
    ).toBeInTheDocument();
  });

  it('garde un brouillon par recette', async () => {
    apiEditeur();
    const premier = await rendre('/panneau/recettes/7/modifier');
    await retitrer('Brouillon de la tarte');
    premier.unmount();

    const deuxieme = await rendre('/panneau/recettes/8/modifier');
    expect(await screen.findByDisplayValue('Glace')).toBeInTheDocument();
    deuxieme.unmount();

    await rendre('/panneau/recettes/nouvelle');
    expect(await screen.findByLabelText(/titre/i)).toHaveValue('');
  });

  it('oublie le brouillon quand on annule', async () => {
    apiEditeur();
    const premier = await rendre('/panneau/recettes/7/modifier');
    await retitrer('Saisie abandonnée');

    await userEvent.click(screen.getByRole('link', { name: /annuler/i }));
    expect(await screen.findByText('liste des recettes')).toBeInTheDocument();
    premier.unmount();
    await rendre('/panneau/recettes/7/modifier');

    expect(await screen.findByDisplayValue(TARTE.titre)).toBeInTheDocument();
  });

  it('oublie le brouillon une fois la recette enregistrée', async () => {
    apiEditeur();
    await rendre('/panneau/recettes/7/modifier');

    await retitrer('Tarte revisitée');
    await userEvent.click(enregistrer());

    await screen.findByText(/modifications sont enregistrées/i);
    expect(useBrouillons.getState().brouillons['7']).toBeUndefined();
  });
});
