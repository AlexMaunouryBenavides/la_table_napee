import type { Recette } from '@recipe/types';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { obtenirRecette } from '../acces-api/recettes';
import { clientRequetes } from '../requetes/client-requetes';

/**
 * Les avis arrivent DANS la réponse : `GET /recettes/:id` les porte déjà, avec leurs
 * auteurs. Un second appel à `/recettes/:id/avis` ne ferait qu'ajouter un
 * aller-retour pour la même donnée.
 */
export function requeteRecette(id: number) {
  return queryOptions({
    queryKey: ['recettes', 'detail', id],
    queryFn: () => obtenirRecette(id),
  });
}

/** Lue dans le cache que le `clientLoader` a rempli : elle est toujours là. */
export function useRecette(id: number): Recette {
  return useSuspenseQuery(requeteRecette(id)).data;
}

/**
 * Après un avis déposé, modifié ou supprimé : la note moyenne change, sur le détail
 * comme sur les cartes du catalogue. On relit donc toutes les recettes en cache.
 */
export function recettesOntChange(): Promise<void> {
  return clientRequetes.invalidateQueries({ queryKey: ['recettes'] });
}
