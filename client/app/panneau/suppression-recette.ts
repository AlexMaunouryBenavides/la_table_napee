import { useMutation } from '@tanstack/react-query';

import { ErreurApi } from '../acces-api/erreur-api';
import { supprimerRecette } from '../acces-api/recettes';
import { recettesOntChange } from '../recette/requete-recette';

export type ResultatSuppression = {
  id: number;
  /** `true` dit à la ligne de disparaître — y compris sur un 404, voir plus bas. */
  supprime: boolean;
  message?: string;
};

const INTROUVABLE = 404;
const REFUSE = 403;

const DEJA_SUPPRIMEE =
  'Cette recette n’existe plus : elle a été supprimée entre-temps.';
const SANS_DROIT =
  'Action refusée : votre rôle ne permet pas de supprimer cette recette.';

/**
 * Un 404 n'est PAS un échec : quelqu'un d'autre a retiré la recette, le résultat
 * voulu est atteint. On le dit sans alarmer, et la liste se rafraîchit comme après
 * une suppression réussie.
 */
export async function executerSuppression(
  id: number,
): Promise<ResultatSuppression> {
  try {
    await supprimerRecette(id);

    return { id, supprime: true };
  } catch (leve) {
    if (!(leve instanceof ErreurApi)) {
      throw leve;
    }

    if (leve.statut === INTROUVABLE) {
      return { id, supprime: true, message: DEJA_SUPPRIMEE };
    }

    return {
      id,
      supprime: false,
      message: leve.statut === REFUSE ? SANS_DROIT : leve.message,
    };
  }
}

/**
 * Une mutation PAR ligne : l'échec de l'une ne touche qu'elle. Une recette supprimée
 * fait relire TOUTES les recettes en cache — cette liste, le tableau de bord, mais
 * aussi le catalogue public et l'accueil, qui la montreraient encore.
 */
export function useSupprimerRecette(id: number) {
  return useMutation({
    mutationFn: () => executerSuppression(id),
    onSuccess: async (resultat) => {
      if (resultat.supprime) {
        await recettesOntChange();
      }
    },
  });
}
