import type { RoleUtilisateur } from '@recipe/types';

export type EntreePanneau = { libelle: string; vers: string };
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

const ONGLETS_GESTION: EntreePanneau[] = [
  { libelle: 'Bord', vers: '/panneau' },
  { libelle: 'Recettes', vers: '/panneau/recettes' },
];

/**
 * Les onglets du bas, sur petit écran : les destinations QUOTIDIENNES du rôle. Même
 * règle que le menu — rien vers une route interdite — mais trois places au plus : les
 * catégories restent dans le tiroir.
 */
export function ongletsPanneau(role: RoleUtilisateur): EntreePanneau[] {
  if (role === 'admin') {
    return [
      ...ONGLETS_GESTION,
      { libelle: 'Comptes', vers: '/panneau/utilisateurs' },
    ];
  }

  return role === 'moderateur' ? ONGLETS_GESTION : [];
}
