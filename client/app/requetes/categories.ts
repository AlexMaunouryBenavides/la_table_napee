import { queryOptions, useQueries } from '@tanstack/react-query';

import { listerCategories } from '../acces-api/categories';

import { clientRequetes } from './client-requetes';

/**
 * UNE requête par ressource, partagée par les filtres du catalogue, l'éditeur de
 * recette et l'écran des catégories : une valeur ajoutée ou retirée dans le panneau
 * se voit partout dès que la requête est relue.
 */
export function requeteCategorie(cle: string) {
  return queryOptions({
    queryKey: ['categories', cle],
    queryFn: () => listerCategories(cle),
  });
}

/**
 * Quatre requêtes, pas une : elles échouent séparément. Un référentiel en panne
 * désactive son filtre, il ne fait pas tomber les trois autres.
 */
const REQUETES_REFERENTIELS = [
  requeteCategorie('regimes'),
  requeteCategorie('criteres-sante'),
  requeteCategorie('types-aliment'),
  requeteCategorie('nationalites'),
] as const;

export async function prechargerReferentiels(): Promise<void> {
  await Promise.all(
    REQUETES_REFERENTIELS.map((requete) =>
      clientRequetes.prefetchQuery(requete),
    ),
  );
}

export function useReferentiels() {
  const [regimes, criteresSante, typesAliment, nationalites] = useQueries({
    queries: REQUETES_REFERENTIELS,
  });

  return {
    referentiels: {
      regimes: regimes.data ?? [],
      criteresSante: criteresSante.data ?? [],
      typesAliment: typesAliment.data ?? [],
      nationalites: nationalites.data ?? [],
    },
    echec: [regimes, criteresSante, typesAliment, nationalites].some(
      (requete) => requete.isError,
    ),
  };
}
