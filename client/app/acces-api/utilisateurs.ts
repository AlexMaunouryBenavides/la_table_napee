import type { Page, Utilisateur } from '@recipe/types';

import { appelerApi } from './appeler-api';

/**
 * Liste paginée des comptes — UC-16, réservée à l'administrateur. Un autre rôle
 * reçoit un 403 : l'écran doit donc s'abstenir d'appeler, pas rattraper l'erreur.
 */
export function listerUtilisateurs(
  criteres: URLSearchParams,
): Promise<Page<Utilisateur>> {
  const requete = criteres.toString();

  return appelerApi<Page<Utilisateur>>(
    requete === '' ? '/utilisateurs' : `/utilisateurs?${requete}`,
  );
}
