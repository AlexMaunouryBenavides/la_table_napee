import type { Difficulte, Recette, TypeRecette, Unite } from '@recipe/types';

/** Une ligne de composition en cours de saisie : tout y est texte, comme dans les
 *  champs du formulaire. La conversion n'a lieu qu'à l'enregistrement. */
export type LigneIngredient = { nom: string; quantite: string; unite: Unite };

export type BrouillonRecette = {
  titre: string;
  description: string;
  image: string;
  video: string;
  difficulte: Difficulte;
  typeRecette: TypeRecette;
  nationaliteId: string;
  tempsPreparation: string;
  tempsCuisson: string;
  portions: string;
  ingredients: LigneIngredient[];
  /** Le numéro d'une étape vient de sa POSITION : il n'est jamais saisi. */
  etapes: string[];
  regimes: number[];
  criteresSante: number[];
  typesAliment: number[];
};

/** Le corps envoyé à l'API — la forme de `CreerRecetteDto`. Un champ absent n'est pas
 *  un champ vide : `video` omise vaut « pas de vidéo », `quantite` omise « à volonté ». */
export type CorpsRecette = {
  titre: string;
  description: string;
  image: string;
  video?: string;
  difficulte: Difficulte;
  typeRecette: TypeRecette;
  nationaliteId: number;
  tempsPreparation: number;
  tempsCuisson: number;
  portions: number;
  ingredients: { nom: string; quantite?: number; unite: Unite }[];
  etapes: string[];
  regimes: number[];
  criteresSante: number[];
  typesAliment: number[];
};

export type Validation = {
  corps: CorpsRecette | null;
  erreurs: Record<string, string>;
};

const UNITE_PAR_DEFAUT: Unite = 'g';
const PORTIONS_PAR_DEFAUT = '4';
const QUANTITE_INVALIDE = 'La quantité doit être un nombre supérieur à zéro.';
const SANS_INGREDIENT = 'Une recette a besoin d’au moins un ingrédient.';
const SANS_ETAPE = 'Une recette a besoin d’au moins une étape.';

export function ligneVide(): LigneIngredient {
  return { nom: '', quantite: '', unite: UNITE_PAR_DEFAUT };
}

/** Une ligne d'ingrédient et une étape sont offertes d'emblée : un formulaire qui
 *  commence par « ajouter une ligne » demande un clic pour rien. */
export function brouillonVide(): BrouillonRecette {
  return {
    titre: '',
    description: '',
    image: '',
    video: '',
    difficulte: 'facile',
    typeRecette: 'plat',
    nationaliteId: '',
    tempsPreparation: '',
    tempsCuisson: '',
    portions: PORTIONS_PAR_DEFAUT,
    ingredients: [ligneVide()],
    etapes: [''],
    regimes: [],
    criteresSante: [],
    typesAliment: [],
  };
}

const identifiants = (categories: { id: number }[]): number[] =>
  categories.map(({ id }) => id);

export function brouillonDepuis(recette: Recette): BrouillonRecette {
  return {
    titre: recette.titre,
    description: recette.description,
    image: recette.image,
    video: recette.video ?? '',
    difficulte: recette.difficulte,
    typeRecette: recette.typeRecette,
    nationaliteId: String(recette.nationalite.id),
    tempsPreparation: String(recette.tempsPreparation),
    tempsCuisson: String(recette.tempsCuisson),
    portions: String(recette.portions),
    ingredients: recette.compositions.map((composition) => ({
      nom: composition.ingredient.nom,
      // `'500.00'` côté MySQL, `500` à l'écran : le zéro décimal n'apporte rien.
      quantite:
        composition.quantite === null
          ? ''
          : String(Number(composition.quantite)),
      unite: composition.unite,
    })),
    etapes: recette.etapes.map((etape) => etape.contenu),
    regimes: identifiants(recette.regimes),
    criteresSante: identifiants(recette.criteresSante),
    typesAliment: identifiants(recette.typesAliment),
  };
}

/** Déplace une étape d'un cran. Aux bords, ne fait RIEN : une étape qui disparaît
 *  parce qu'on a insisté sur « monter » serait une perte silencieuse. */
export function deplacerEtape(
  etapes: string[],
  index: number,
  sens: -1 | 1,
): string[] {
  const cible = index + sens;

  if (cible < 0 || cible >= etapes.length) {
    return etapes;
  }

  const deplacees = [...etapes];
  [deplacees[index], deplacees[cible]] = [
    deplacees[cible] as string,
    deplacees[index] as string,
  ];

  return deplacees;
}

function quantiteDe(
  ligne: LigneIngredient,
  erreurs: Record<string, string>,
  index: number,
): { quantite?: number } {
  const saisie = ligne.quantite.trim();

  // Vide veut dire « à volonté » (sel, poivre) : le champ est OMIS, pas mis à zéro.
  if (saisie === '') {
    return {};
  }

  const quantite = Number(saisie);

  if (!Number.isFinite(quantite) || quantite <= 0) {
    erreurs[`ingredient-${String(index)}`] = QUANTITE_INVALIDE;

    return {};
  }

  return { quantite };
}

function ingredientsDe(
  brouillon: BrouillonRecette,
  erreurs: Record<string, string>,
): CorpsRecette['ingredients'] {
  const retenus = brouillon.ingredients
    // Une ligne jamais remplie ne bloque pas l'enregistrement : on l'oublie.
    .map((ligne, index) => ({ ligne, index }))
    .filter(({ ligne }) => ligne.nom.trim() !== '')
    .map(({ ligne, index }) => ({
      nom: ligne.nom.trim(),
      ...quantiteDe(ligne, erreurs, index),
      unite: ligne.unite,
    }));

  if (retenus.length === 0) {
    erreurs.ingredients = SANS_INGREDIENT;
  }

  return retenus;
}

function etapesDe(
  brouillon: BrouillonRecette,
  erreurs: Record<string, string>,
): string[] {
  const retenues = brouillon.etapes
    .map((etape) => etape.trim())
    .filter((etape) => etape !== '');

  if (retenues.length === 0) {
    erreurs.etapes = SANS_ETAPE;
  }

  return retenues;
}

/**
 * Le brouillon devient un corps de requête — ou rien, avec ses erreurs. On ne valide
 * ici que ce qui coûterait un aller-retour pour un refus certain ; l'API reste seule
 * juge du reste.
 */
export function corpsDepuis(brouillon: BrouillonRecette): Validation {
  const erreurs: Record<string, string> = {};
  const ingredients = ingredientsDe(brouillon, erreurs);
  const etapes = etapesDe(brouillon, erreurs);
  const video = brouillon.video.trim();

  if (Object.keys(erreurs).length > 0) {
    return { corps: null, erreurs };
  }

  return {
    corps: {
      titre: brouillon.titre.trim(),
      description: brouillon.description.trim(),
      image: brouillon.image.trim(),
      ...(video === '' ? {} : { video }),
      difficulte: brouillon.difficulte,
      typeRecette: brouillon.typeRecette,
      nationaliteId: Number(brouillon.nationaliteId),
      tempsPreparation: Number(brouillon.tempsPreparation),
      tempsCuisson: Number(brouillon.tempsCuisson),
      portions: Number(brouillon.portions),
      ingredients,
      etapes,
      regimes: brouillon.regimes,
      criteresSante: brouillon.criteresSante,
      typesAliment: brouillon.typesAliment,
    },
    erreurs,
  };
}
