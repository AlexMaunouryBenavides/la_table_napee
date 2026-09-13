import type {
  Categorie,
  CritereSante,
  Nationalite,
  Regime,
  TypeAliment,
} from '@recipe/types';

import { appelerApi } from './appeler-api';

// Ces quatre listes sont COURTES et servent à construire des filtres : l'API les rend
// en tableau nu, sans l'enveloppe { donnees, total, page, limite } des listes
// paginées. C'est la seule exception, avec les avis d'une recette.
//
// Les quatre ressources partagent le même contrat à la lettre : un seul jeu de
// fonctions, paramétré par le segment d'URL.

export function listerCategories(ressource: string): Promise<Categorie[]> {
  return appelerApi<Categorie[]>(`/${ressource}`);
}

/** Réservé à l'administrateur (UC-15) — la lecture, elle, est publique. */
export function creerCategorie(
  ressource: string,
  nom: string,
): Promise<Categorie> {
  return appelerApi<Categorie>(`/${ressource}`, {
    methode: 'POST',
    corps: { nom },
  });
}

export function renommerCategorie(
  ressource: string,
  id: number,
  nom: string,
): Promise<Categorie> {
  return appelerApi<Categorie>(`/${ressource}/${String(id)}`, {
    methode: 'PATCH',
    corps: { nom },
  });
}

/** L'API refuse si la catégorie est encore portée par une recette : la laisser partir
 *  la ferait disparaître silencieusement de ces recettes. */
export function supprimerCategorie(
  ressource: string,
  id: number,
): Promise<void> {
  return appelerApi<void>(`/${ressource}/${String(id)}`, {
    methode: 'DELETE',
  });
}

export function listerRegimes(): Promise<Regime[]> {
  return listerCategories('regimes');
}

export function listerCriteresSante(): Promise<CritereSante[]> {
  return listerCategories('criteres-sante');
}

export function listerTypesAliment(): Promise<TypeAliment[]> {
  return listerCategories('types-aliment');
}

export function listerNationalites(): Promise<Nationalite[]> {
  return listerCategories('nationalites');
}
