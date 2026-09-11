import type { RoleUtilisateur } from '@recipe/types';

type EntreePanneau = { libelle: string; vers: string };
export type SectionPanneau = { titre: string; entrees: EntreePanneau[] };

const GESTION: SectionPanneau = {
  titre: 'Gestion',
  entrees: [
    { libelle: 'Tableau de bord', vers: '/panneau' },
    { libelle: 'Recettes', vers: '/panneau/recettes' },
  ],
};

const ADMINISTRATION: SectionPanneau = {
  titre: 'Administration',
  entrees: [
    { libelle: 'Utilisateurs', vers: '/panneau/utilisateurs' },
    { libelle: 'Catégories', vers: '/panneau/categories/regimes' },
  ],
};

/**
 * La navigation se CONSTRUIT depuis le rôle : un modérateur ne reçoit jamais le
 * markup des entrées d'administration, il ne les voit pas « masquées en CSS ».
 *
 * Ce n'est pas un contrôle de sécurité — l'API refuse de toute façon — c'est une
 * interface qui ne promet rien qu'elle ne puisse tenir.
 */
export function sectionsPour(role: RoleUtilisateur): SectionPanneau[] {
  if (role === 'admin') {
    return [GESTION, ADMINISTRATION];
  }

  if (role === 'moderateur') {
    return [GESTION];
  }

  return [];
}
