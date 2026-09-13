import type { RoleUtilisateur } from '@recipe/types';
import { queryOptions } from '@tanstack/react-query';

import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';

import { chargerTableauDeBord } from './chargement-tableau-de-bord';

const LIMITE_PANNEAU = '12';

/**
 * Sous la clé `recettes` : une recette créée, modifiée ou supprimée fait relire le
 * tableau de bord avec le reste. Le rôle fait partie de la clé, puisqu'il décide des
 * statistiques demandées.
 */
export function requeteTableauDeBord(role: RoleUtilisateur) {
  return queryOptions({
    queryKey: ['recettes', 'tableau-de-bord', role],
    queryFn: () => chargerTableauDeBord(role),
  });
}

/** Les critères viennent de l'URL et partent tels quels : l'API est seule juge de ce
 *  qu'elle accepte. Seule la limite est imposée ici — c'est une décision d'écran. */
export function requeteRecettesPanneau(recherche: URLSearchParams) {
  const criteres = new URLSearchParams(recherche);
  criteres.set('limite', LIMITE_PANNEAU);

  return queryOptions({
    queryKey: ['recettes', 'panneau', criteres.toString()],
    queryFn: () => listerRecettes(criteres),
  });
}

export function messageDEchec(erreur: Error | null, repli: string) {
  if (erreur === null) {
    return null;
  }

  return erreur instanceof ErreurApi ? erreur.message : repli;
}
