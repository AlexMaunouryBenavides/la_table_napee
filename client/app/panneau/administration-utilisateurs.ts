import type { RoleUtilisateur, Utilisateur } from '@recipe/types';

import { ErreurApi } from '../acces-api/erreur-api';
import { changerRole, supprimerUtilisateur } from '../acces-api/utilisateurs';

export type ResultatAdministration = {
  /** Quelle LIGNE a agi : c'est là que le retour s'affiche, pas ailleurs. */
  id: string;
  succes: boolean;
  message?: string;
  /** Le compte à jour, pour que la ligne se corrige sans attendre la liste. */
  utilisateur?: Utilisateur;
  /** Le rôle d'avant, à réafficher quand le changement a été refusé. */
  roleRetabli?: RoleUtilisateur;
};

const INTROUVABLE = 404;
const DEJA_SUPPRIME =
  'Ce compte n’existe plus : il a été supprimé entre-temps.';

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);

  return typeof valeur === 'string' ? valeur : '';
}

function erreurApi(erreur: unknown): ErreurApi {
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return erreur;
}

async function executerChangementDeRole(
  donnees: FormData,
  id: string,
): Promise<ResultatAdministration> {
  const roleActuel = texte(donnees, 'roleActuel') as RoleUtilisateur;

  try {
    const utilisateur = await changerRole(
      id,
      texte(donnees, 'role') as RoleUtilisateur,
    );

    return { id, succes: true, utilisateur };
  } catch (leve) {
    // Le sélecteur revient à l'ancienne valeur : garder à l'écran un rôle que l'API
    // a refusé mentirait sur l'état réel du compte.
    return {
      id,
      succes: false,
      message: erreurApi(leve).message,
      roleRetabli: roleActuel,
    };
  }
}

async function executerSuppression(
  id: string,
): Promise<ResultatAdministration> {
  try {
    await supprimerUtilisateur(id);

    return { id, succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Un 404 n'est pas un échec : quelqu'un d'autre a retiré le compte, le résultat
    // voulu est atteint.
    return erreur.statut === INTROUVABLE
      ? { id, succes: true, message: DEJA_SUPPRIME }
      : { id, succes: false, message: erreur.message };
  }
}

/** Deux actions sur la même ligne : c'est `intention` qui dit laquelle. */
export function executerActionUtilisateur(
  donnees: FormData,
): Promise<ResultatAdministration> {
  const id = texte(donnees, 'id');

  return texte(donnees, 'intention') === 'role'
    ? executerChangementDeRole(donnees, id)
    : executerSuppression(id);
}
