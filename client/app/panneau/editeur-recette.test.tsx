import type { Categorie, Ingredient } from '@recipe/types';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../../test/brouillons';
import { chercherIngredients } from '../acces-api/ingredients';

import { brouillonVide, type BrouillonRecette } from './brouillon-recette';
import {
  EcranEditeurRecette,
  type Referentiels,
  type RetourEnregistrement,
} from './editeur-recette';

vi.mock('../acces-api/ingredients');

const NATIONALITES: Categorie[] = [{ id: 3, nom: 'Française' }];

const REFERENTIELS: Referentiels = {
  nationalites: NATIONALITES,
  regimes: [{ id: 2, nom: 'Végétarien' }],
  criteresSante: [],
  typesAliment: [],
};

const VIDES: Referentiels = {
  nationalites: [],
  regimes: [],
  criteresSante: [],
  typesAliment: [],
};

beforeEach(() => {
  // Sans valeur par défaut, l'automock rend `undefined` et l'autocomplétion casse.
  vi.mocked(chercherIngredients).mockReset().mockResolvedValue([]);
});

function brouillonDeTest(): BrouillonRecette {
  return {
    ...brouillonVide(),
    titre: 'Tarte fine',
    tempsPreparation: '45',
    tempsCuisson: '25',
    ingredients: [{ nom: 'Tomates cerises', quantite: '500', unite: 'g' }],
    etapes: ['Préchauffer le four.', 'Enfourner deux heures.'],
  };
}

function rendre({
  brouillon = brouillonDeTest(),
  referentiels = REFERENTIELS,
  retour = null,
}: {
  brouillon?: BrouillonRecette;
  referentiels?: Referentiels;
  retour?: RetourEnregistrement | null;
} = {}) {
  render(
    <MemoryRouter initialEntries={['/panneau/recettes/nouvelle']}>
      <EcranEditeurRecette
        brouillonInitial={brouillon}
        referentiels={referentiels}
        retour={retour}
        envoiEnCours={false}
        recetteId={null}
        surEnvoi={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe('EcranEditeurRecette — les étapes', () => {
  it('les déplace au clavier et les renumérote aussitôt', async () => {
    // Le numéro vient de la POSITION : aucun champ « numéro » n'est saisissable.
    rendre();

    const etapes = screen.getAllByRole('listitem');
    await userEvent.click(
      within(etapes[1] as HTMLElement).getByRole('button', {
        name: /monter/i,
      }),
    );

    const apres = screen.getAllByRole('listitem');

    expect(within(apres[0] as HTMLElement).getByRole('textbox')).toHaveValue(
      'Enfourner deux heures.',
    );
    expect(apres[0]).toHaveTextContent('1');
  });

  it('n’offre aucun champ où saisir un numéro d’étape', () => {
    rendre();

    expect(screen.queryByLabelText(/numéro/i)).not.toBeInTheDocument();
  });
});

describe('EcranEditeurRecette — l’autocomplétion d’ingrédients', () => {
  it('propose le référentiel sans jamais créer par simple frappe', async () => {
    const trouves: Ingredient[] = [{ id: 7, nom: 'Parmesan râpé' }];
    vi.mocked(chercherIngredients).mockResolvedValue(trouves);

    rendre();

    await userEvent.type(screen.getByLabelText(/^Ingrédient 1$/), 'parmes');

    expect(await screen.findByText('Parmesan râpé')).toBeInTheDocument();
    // Il n'existe pas de POST /ingredients : l'ingrédient naît à l'enregistrement
    // de la recette, par « trouver ou créer ».
    expect(chercherIngredients).toHaveBeenCalled();
  });

  it('laisse garder un nom absent du référentiel', async () => {
    vi.mocked(chercherIngredients).mockResolvedValue([]);

    rendre();

    const champ = screen.getByLabelText(/^Ingrédient 1$/);
    await userEvent.clear(champ);
    await userEvent.type(champ, 'yuzu');

    expect(champ).toHaveValue('yuzu');
    expect(await screen.findByText(/yuzu/i)).toBeInTheDocument();
  });
});

describe('EcranEditeurRecette — les échecs', () => {
  it('rattache un titre déjà pris à son champ, sans perdre la saisie', () => {
    rendre({
      retour: {
        succes: false,
        message: 'Requête invalide',
        champs: { titre: 'Ce titre est déjà utilisé' },
      },
    });

    expect(screen.getByLabelText(/titre/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/titre/i)).toHaveValue('Tarte fine');
    expect(
      screen.getByDisplayValue('Préchauffer le four.'),
    ).toBeInTheDocument();
  });
});

describe('EcranEditeurRecette — les référentiels', () => {
  it('reste saisissable avant l’arrivée des catégories', () => {
    // En création il n'y a rien à charger : le formulaire doit être utilisable tout
    // de suite, les listes arrivent en arrière-plan.
    rendre({ brouillon: brouillonVide(), referentiels: VIDES });

    expect(screen.getByLabelText(/titre/i)).toBeEnabled();
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeEnabled();
  });
});

describe('EcranEditeurRecette — le récapitulatif', () => {
  it('compte ce qui est saisi, pas ce qui a été chargé', () => {
    rendre();

    const recapitulatif = screen.getByRole('group', {
      name: /récapitulatif/i,
    });

    expect(recapitulatif).toHaveTextContent('70 min');
    expect(recapitulatif).toHaveTextContent(/1 ingrédient/);
    expect(recapitulatif).toHaveTextContent(/2 étapes/);
  });
});
