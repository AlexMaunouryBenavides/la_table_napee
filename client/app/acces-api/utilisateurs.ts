import type { Page, RoleUtilisateur, Utilisateur } from '@recipe/types';

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

/**
 * Le rôle a sa PROPRE URL, ce n'est pas un champ de profil : c'est l'opération la plus
 * dangereuse de l'API — elle distribue le pouvoir (`design/routes-api.md` § 3.5).
 */
export function changerRole(
  id: string,
  role: RoleUtilisateur,
): Promise<Utilisateur> {
  return appelerApi<Utilisateur>(`/utilisateurs/${id}/role`, {
    methode: 'PATCH',
    corps: { role },
  });
}

/** Les avis du compte survivent, privés de leur auteur (`ON DELETE SET NULL`). */
export function supprimerUtilisateur(id: string): Promise<void> {
  return appelerApi<void>(`/utilisateurs/${id}`, { methode: 'DELETE' });
}
