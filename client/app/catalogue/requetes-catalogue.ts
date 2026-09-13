import type { Page, RecetteResume } from '@recipe/types';
import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';
import {
  prechargerReferentiels,
  useReferentiels,
} from '../requetes/categories';
import { clientRequetes } from '../requetes/client-requetes';

import type { Referentiels } from './filtres-actifs';

export type DonneesCatalogue = {
  resultats: Page<RecetteResume> | null;
  referentiels: Referentiels;
  echecListe: { message: string; details?: string[] } | null;
  echecReferentiels: boolean;
};

/** Une page par jeu de critères : la clé est la recherche de l'URL, telle quelle. */
function requeteRecettes(criteres: URLSearchParams) {
  return queryOptions({
    queryKey: ['recettes', 'liste', criteres.toString()],
    queryFn: () => listerRecettes(criteres),
  });
}

/** La liste et les référentiels partent ENSEMBLE : aucun n'attend l'autre. */
export async function prechargerCatalogue(
  criteres: URLSearchParams,
): Promise<void> {
  await Promise.all([
    clientRequetes.prefetchQuery(requeteRecettes(criteres)),
    prechargerReferentiels(),
  ]);
}

/** `details[]` porte le « pourquoi » d'un 400 : le perdre laisse l'utilisateur devant
 *  un « requête invalide » qu'il ne peut pas corriger. */
function echecDe(raison: Error): DonneesCatalogue['echecListe'] {
  return raison instanceof ErreurApi
    ? { message: raison.message, details: raison.details }
    : { message: 'Les recettes n’ont pas pu être chargées.' };
}

export function useCatalogue(criteres: URLSearchParams): DonneesCatalogue {
  // La page précédente reste affichée pendant que la suivante arrive : pas de liste
  // qui se vide et saute à chaque filtre.
  const liste = useQuery({
    ...requeteRecettes(criteres),
    placeholderData: keepPreviousData,
  });
  const { referentiels, echec } = useReferentiels();

  return {
    resultats: liste.data ?? null,
    referentiels,
    echecListe: liste.error === null ? null : echecDe(liste.error),
    echecReferentiels: echec,
  };
}
