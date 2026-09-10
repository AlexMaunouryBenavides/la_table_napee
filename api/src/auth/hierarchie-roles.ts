import { type RoleUtilisateur } from '@recipe/types';

// L'héritage des rôles vit ICI et nulle part ailleurs : admin ⊃ modérateur ⊃
// utilisateur. Le guard s'en sert pour les routes, les services pour les règles
// métier — une seule définition, donc aucun risque de divergence.
const NIVEAUX: Record<RoleUtilisateur, number> = {
  utilisateur: 1,
  moderateur: 2,
  admin: 3,
};

export function aAuMoins(role: RoleUtilisateur, exige: RoleUtilisateur) {
  return NIVEAUX[role] >= NIVEAUX[exige];
}
