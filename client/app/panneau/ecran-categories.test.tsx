import type { Categorie } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { json, simulerApi } from '../../test/api-simulee';
import { AvecRequetes } from '../../test/requetes';
import { supprimerEtConfirmer } from '../../test/suppression-confirmee';

import { EcranCategories } from './ecran-categories';
import { ressourceDepuis } from './ressources-categories';

const REGIMES: Categorie[] = [
  { id: 3, nom: 'Végan' },
  { id: 4, nom: 'Végétarien' },
];

const COMPTEURS = {
  regimes: 2,
  'criteres-sante': 6,
  'types-aliment': 11,
  nationalites: 17,
};

function rendre({
  valeurs = REGIMES,
  compteurs = COMPTEURS,
}: {
  valeurs?: Categorie[];
  compteurs?: Record<string, number>;
} = {}) {
  const ressource = ressourceDepuis('regimes');

  if (ressource === null) {
    throw new Error('la ressource de test doit exister');
  }

  render(
    <MemoryRouter initialEntries={['/panneau/categories/regimes']}>
      <AvecRequetes>
        <EcranCategories
          ressource={ressource}
          valeurs={valeurs}
          compteurs={compteurs}
        />
      </AvecRequetes>
    </MemoryRouter>,
  );
}

const ligneDe = (nom: string): HTMLElement =>
  screen.getByText(nom).closest('tr') as HTMLElement;

describe('EcranCategories — les onglets', () => {
  it('porte le compte de chaque ressource et marque l’onglet actif', () => {
    rendre();

    const onglets = screen.getByRole('navigation', { name: /ressources/i });

    expect(within(onglets).getAllByRole('link')).toHaveLength(4);
    expect(
      within(onglets).getByRole('link', { name: /types d’aliment · 11/i }),
    ).toBeInTheDocument();
    expect(
      within(onglets).getByRole('link', { name: /régimes · 2/i }),
    ).toHaveAttribute('aria-current', 'page');
  });
});

describe('EcranCategories — renommer', () => {
  it('passe en édition SUR la ligne, sans toucher aux autres', async () => {
    rendre();

    await userEvent.click(
      within(ligneDe('Végan')).getByRole('button', { name: /renommer/i }),
    );

    expect(screen.getByDisplayValue('Végan')).toBeInTheDocument();
    // L'autre ligne reste en lecture : renommer n'est pas éditer toute la table.
    expect(
      within(ligneDe('Végétarien')).getByRole('button', { name: /renommer/i }),
    ).toBeInTheDocument();
  });
});

describe('EcranCategories — la ressource vide', () => {
  it('invite à créer la première valeur et dit à quoi elle servira', () => {
    rendre({ valeurs: [], compteurs: { ...COMPTEURS, regimes: 0 } });

    expect(screen.getByText(/aucun régime/i)).toBeInTheDocument();
    expect(screen.getByText(/éditeur de recette/i)).toBeInTheDocument();
  });

  it('laisse le formulaire d’ajout utilisable même sans aucune valeur', () => {
    // Il n'y a rien à attendre pour ajouter : le formulaire ne dépend d'aucune donnée.
    rendre({ valeurs: [], compteurs: {} });

    expect(screen.getByLabelText(/nom/i)).toBeEnabled();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeEnabled();
  });
});

describe('EcranCategories — les refus', () => {
  it('affiche le refus sur sa ligne, avec le chemin de sortie', async () => {
    simulerApi({
      '/regimes/3': () =>
        json(409, {
          statusCode: 409,
          message: 'Cette catégorie est encore utilisée',
        }),
    });
    rendre();

    await supprimerEtConfirmer('Végan', /supprimer le régime/i);

    expect(await screen.findByRole('alert')).toHaveTextContent(/utilisée/i);
    expect(
      screen.getByRole('link', { name: /voir les recettes/i }),
    ).toHaveAttribute('href', '/recettes?regime=3');
  });

  it('dit un nom déjà pris SOUS le champ, et garde la saisie', async () => {
    simulerApi({
      '/regimes': () =>
        json(409, { statusCode: 409, message: 'Ce nom est déjà utilisé' }),
    });
    rendre();

    await userEvent.type(screen.getByLabelText(/nom/i), 'Végan');
    await userEvent.click(screen.getByRole('button', { name: /ajouter/i }));

    expect(
      await screen.findByText('Ce nom est déjà utilisé'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nom/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/nom/i)).toHaveValue('Végan');
  });
});
