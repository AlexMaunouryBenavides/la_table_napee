import type { Categorie, Difficulte, TypeRecette } from '@recipe/types';

import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';

export type Referentiels = {
  regimes: Categorie[];
  criteresSante: Categorie[];
  typesAliment: Categorie[];
  nationalites: Categorie[];
};

export type FiltreActif = {
  cle: string;
  valeur: string;
  libelle: string;
};

const PREMIERE_PAGE = '1';

// Ce qui gouverne l'affichage sans être un critère : personne ne veut « retirer »
// une pagination.
const HORS_FILTRES = new Set(['page', 'limite', 'tri']);

// Les quatre référentiels arrivent par identifiant : l'URL porte `regime=1`, pas
// « végan ».
const REFERENTIEL_DE: Record<string, keyof Referentiels> = {
  regime: 'regimes',
  critereSante: 'criteresSante',
  typeAliment: 'typesAliment',
  nationalite: 'nationalites',
};

/**
 * `null` quand la valeur ne se laisse pas nommer : un identifiant qui n'est plus dans
 * le référentiel (catégorie supprimée, URL trafiquée). Mieux vaut ne rien montrer
 * qu'un « undefined ».
 */
function libelleDe(
  cle: string,
  valeur: string,
  referentiels: Referentiels,
): string | null {
  const nomDuReferentiel = REFERENTIEL_DE[cle];

  if (nomDuReferentiel !== undefined) {
    const trouve = referentiels[nomDuReferentiel].find(
      (categorie) => String(categorie.id) === valeur,
    );
    return trouve?.nom ?? null;
  }

  if (cle === 'difficulte') {
    return LIBELLES_DIFFICULTE[valeur as Difficulte] ?? null;
  }

  if (cle === 'type') {
    return LIBELLES_TYPE[valeur as TypeRecette] ?? null;
  }

  if (cle === 'recherche') {
    return `« ${valeur} »`;
  }

  if (cle === 'tempsMax') {
    return `${valeur} min ou moins`;
  }

  return null;
}

/** Un filtre PAR valeur : `?regime=1&regime=2` en donne deux, retirables séparément. */
export function filtresActifs(
  parametres: URLSearchParams,
  referentiels: Referentiels,
): FiltreActif[] {
  return [...parametres.entries()].flatMap(([cle, valeur]) => {
    if (HORS_FILTRES.has(cle) || valeur === '') {
      return [];
    }

    const libelle = libelleDe(cle, valeur, referentiels);

    return libelle === null ? [] : [{ cle, valeur, libelle }];
  });
}

/** Retire UNE valeur (et pas toute la clé) puis ramène à la première page. */
export function sansFiltre(
  parametres: URLSearchParams,
  filtre: FiltreActif,
): URLSearchParams {
  const suivants = new URLSearchParams();

  for (const [cle, valeur] of parametres.entries()) {
    if (cle !== filtre.cle || valeur !== filtre.valeur) {
      suivants.append(cle, valeur);
    }
  }

  suivants.set('page', PREMIERE_PAGE);

  return suivants;
}
