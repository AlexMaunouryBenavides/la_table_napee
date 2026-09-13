import { aAuMoins, type RoleUtilisateur } from '@recipe/types';

const CHEMINS_ADMINISTRATION = ['/panneau/utilisateurs', '/panneau/categories'];

/**
 * Le rôle minimal pour une page du panneau. Utilisateurs et catégories sont réservés
 * à l'administrateur ; le reste du panneau suffit à un modérateur.
 */
export function roleExigePour(chemin: string): RoleUtilisateur {
  return CHEMINS_ADMINISTRATION.some((prefixe) => chemin.startsWith(prefixe))
    ? 'admin'
    : 'moderateur';
}

export function peutAcceder(role: RoleUtilisateur, chemin: string): boolean {
  return aAuMoins(role, roleExigePour(chemin));
}
