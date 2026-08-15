import { type RoleUtilisateur } from '@recipe/types';

// Ce que les guards et les services savent de l'appelant : l'identité portée par le
// jeton, rien de plus. Toute autre donnée du compte se relit en base.
export interface IdentiteRequete {
  id: string;
  role: RoleUtilisateur;
}

// Passport dépose l'identité dans `request.user` : on suit sa convention plutôt que
// d'inventer un autre emplacement.
export interface RequeteAuthentifiee {
  user?: IdentiteRequete;
}
