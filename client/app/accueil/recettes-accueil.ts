import type { RecetteResume } from '@recipe/types';
import { queryOptions, useQuery } from '@tanstack/react-query';

import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';

const RECETTES_MISES_EN_AVANT = 3;

/**
 * Le tri par défaut est `-dateCreation` : l'API n'accepte pas de tri par note, la
 * vitrine montre donc les dernières publiées.
 */
export const requeteRecettesAccueil = queryOptions({
  queryKey: ['recettes', 'accueil'],
  queryFn: () =>
    listerRecettes(
      new URLSearchParams({ limite: String(RECETTES_MISES_EN_AVANT) }),
    ),
});

/**
 * L'échec de la liste devient un message : il affiche un bandeau et laisse la vitrine
 * debout, il ne fait pas tomber la page.
 */
export function useRecettesAccueil(): {
  recettes: RecetteResume[];
  /** `null` = l'API n'a pas répondu. Ce n'est pas zéro. */
  total: number | null;
  echec: string | null;
} {
  const { data, error } = useQuery(requeteRecettesAccueil);

  return {
    recettes: data?.donnees ?? [],
    total: data?.total ?? null,
    echec:
      error === null
        ? null
        : error instanceof ErreurApi
          ? error.message
          : 'Les recettes n’ont pas pu être chargées.',
  };
}
