import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ErreurApi } from '../acces-api/erreur-api';
import { creerRecette, modifierRecette } from '../acces-api/recettes';
import { recettesOntChange } from '../recette/requete-recette';

import type { CorpsRecette } from './brouillon-recette';
import { cleBrouillon, useBrouillons } from './brouillons';
import type { RetourEnregistrement } from './editeur-recette';

const REQUETE_INVALIDE = 400;

/** `details[]` porte le « pourquoi » d'un 400 : chaque message est préfixé du nom de
 *  son champ, ce qui permet de l'afficher au bon endroit plutôt qu'en vrac. */
function champsDepuis(erreur: ErreurApi): Record<string, string> | undefined {
  if (erreur.statut !== REQUETE_INVALIDE || erreur.details === undefined) {
    return undefined;
  }

  const champs: Record<string, string> = {};

  for (const detail of erreur.details) {
    const [nom] = detail.split(' ');

    if (nom !== undefined && nom !== '') {
      champs[nom] ??= detail;
    }
  }

  return Object.keys(champs).length === 0 ? undefined : champs;
}

/** Un seul envoi, jamais partiel. La création rend l'identifiant de la recette née. */
async function executerEnregistrement(
  recetteId: number | null,
  corps: CorpsRecette,
): Promise<RetourEnregistrement & { id?: number }> {
  try {
    if (recetteId !== null) {
      await modifierRecette(recetteId, corps);
      return { succes: true };
    }

    const creee = await creerRecette(corps);
    return { succes: true, id: creee.id };
  } catch (leve) {
    if (!(leve instanceof ErreurApi)) {
      throw leve;
    }

    return { succes: false, message: leve.message, champs: champsDepuis(leve) };
  }
}

/**
 * Après un succès : les recettes en cache sont relues (liste du panneau, catalogue,
 * détail), PUIS le brouillon est oublié — l'éditeur montre alors la recette telle
 * qu'enregistrée, sans passer par l'ancienne version. En création, l'URL change : la
 * recette a désormais un identifiant.
 */
export function useEnregistrerRecette(recetteId: number | null) {
  const naviguer = useNavigate();
  const oublier = useBrouillons((etat) => etat.oublier);

  return useMutation({
    mutationFn: (corps: CorpsRecette) =>
      executerEnregistrement(recetteId, corps),
    onSuccess: async (resultat) => {
      if (!resultat.succes) {
        return;
      }

      await recettesOntChange();
      oublier(cleBrouillon(recetteId));

      if (resultat.id !== undefined) {
        await naviguer(`/panneau/recettes/${String(resultat.id)}/modifier`);
      }
    },
  });
}
