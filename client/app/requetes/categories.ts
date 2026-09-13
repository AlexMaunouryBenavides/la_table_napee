import { queryOptions } from '@tanstack/react-query';

import { listerCategories } from '../acces-api/categories';

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
