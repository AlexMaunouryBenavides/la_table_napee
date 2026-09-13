import { useMutation } from '@tanstack/react-query';

import { deposerAvis, modifierAvis, supprimerAvis } from '../acces-api/avis';
import { ErreurApi } from '../acces-api/erreur-api';

import { recettesOntChange } from './requete-recette';

type CorpsAvis = { note: number; commentaire: string | null };

type EchecAvis = { message: string; details?: string[] };

/** Un refus de l'API revient avec son message ; le reste reste générique. */
export function echecAvis(erreur: Error | null): EchecAvis | null {
  if (erreur === null) {
    return null;
  }

  return erreur instanceof ErreurApi
    ? { message: erreur.message, details: erreur.details }
    : { message: 'L’avis n’a pas pu être enregistré. Réessayez.' };
}

/**
 * Dépôt ou modification, selon qu'un avis existe déjà : un second dépôt vaudrait un
 * 409. Le succès attend la relecture des recettes, si bien que le bouton ne se libère
 * qu'une fois la note et la liste à jour.
 */
export function useEnregistrerAvis(
  recetteId: number,
  avisId: number | undefined,
) {
  return useMutation({
    mutationFn: (corps: CorpsAvis) =>
      avisId === undefined
        ? deposerAvis(recetteId, corps)
        : modifierAvis(avisId, corps),
    onSuccess: () => recettesOntChange(),
  });
}

/** Une mutation PAR avis : l'échec de l'un s'affiche sur lui seul. */
export function useSupprimerAvis(avisId: number) {
  return useMutation({
    mutationFn: () => supprimerAvis(avisId),
    onSuccess: () => recettesOntChange(),
  });
}
