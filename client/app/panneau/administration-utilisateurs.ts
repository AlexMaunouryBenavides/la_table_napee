import type { RoleUtilisateur, Utilisateur } from '@recipe/types';
import { queryOptions, useMutation } from '@tanstack/react-query';

import { ErreurApi } from '../acces-api/erreur-api';
import {
  changerRole,
  listerUtilisateurs,
  supprimerUtilisateur,
} from '../acces-api/utilisateurs';
import { clientRequetes } from '../requetes/client-requetes';

export type ResultatAdministration = {
  succes: boolean;
  message?: string;
  /** Le compte à jour, pour que la ligne se corrige sans attendre la liste. */
  utilisateur?: Utilisateur;
  /** Le rôle d'avant, à réafficher quand le changement a été refusé. */
  roleRetabli?: RoleUtilisateur;
};

/** Ce qu'une ligne demande : les deux actions partagent son unique retour. */
type DemandeAdministration =
  | { action: 'role'; role: RoleUtilisateur }
  | { action: 'suppression' };

const INTROUVABLE = 404;
const DEJA_SUPPRIME =
  'Ce compte n’existe plus : il a été supprimé entre-temps.';

function erreurApi(erreur: unknown): ErreurApi {
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return erreur;
}

export function requeteUtilisateurs(criteres: URLSearchParams) {
  return queryOptions({
    queryKey: ['utilisateurs', criteres.toString()],
    queryFn: () => listerUtilisateurs(criteres),
  });
}

export async function executerChangementDeRole(
  compte: Utilisateur,
  role: RoleUtilisateur,
): Promise<ResultatAdministration> {
  try {
    return { succes: true, utilisateur: await changerRole(compte.id, role) };
  } catch (leve) {
    // Le sélecteur revient à l'ancienne valeur : garder à l'écran un rôle que l'API
    // a refusé mentirait sur l'état réel du compte.
    return {
      succes: false,
      message: erreurApi(leve).message,
      roleRetabli: compte.role,
    };
  }
}

export async function executerSuppressionCompte(
  id: string,
): Promise<ResultatAdministration> {
  try {
    await supprimerUtilisateur(id);

    return { succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Un 404 n'est pas un échec : quelqu'un d'autre a retiré le compte, le résultat
    // voulu est atteint.
    return erreur.statut === INTROUVABLE
      ? { succes: true, message: DEJA_SUPPRIME }
      : { succes: false, message: erreur.message };
  }
}

/**
 * Une mutation PAR ligne : un refus ou une attente ne touche que ce compte. Un succès
 * relit la liste des comptes et le tableau de bord, qui en affiche le nombre.
 */
export function useAdministrationCompte(compte: Utilisateur) {
  return useMutation({
    mutationFn: (demande: DemandeAdministration) =>
      demande.action === 'role'
        ? executerChangementDeRole(compte, demande.role)
        : executerSuppressionCompte(compte.id),
    onSuccess: async (resultat) => {
      if (resultat.succes) {
        await Promise.all([
          clientRequetes.invalidateQueries({ queryKey: ['utilisateurs'] }),
          clientRequetes.invalidateQueries({
            queryKey: ['recettes', 'tableau-de-bord'],
          }),
        ]);
      }
    },
  });
}

export type AdministrationCompte = ReturnType<typeof useAdministrationCompte>;
