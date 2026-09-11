import type {
  CritereSante,
  Nationalite,
  Regime,
  TypeAliment,
} from '@recipe/types';

import { appelerApi } from './appeler-api';

// Ces quatre listes sont COURTES et servent à construire des filtres : l'API les rend
// en tableau nu, sans l'enveloppe { donnees, total, page, limite } des listes
// paginées. C'est la seule exception, avec les avis d'une recette.
export function listerRegimes(): Promise<Regime[]> {
  return appelerApi<Regime[]>('/regimes');
}

export function listerCriteresSante(): Promise<CritereSante[]> {
  return appelerApi<CritereSante[]>('/criteres-sante');
}

export function listerTypesAliment(): Promise<TypeAliment[]> {
  return appelerApi<TypeAliment[]>('/types-aliment');
}

export function listerNationalites(): Promise<Nationalite[]> {
  return appelerApi<Nationalite[]>('/nationalites');
}
