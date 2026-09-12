import type { RoleUtilisateur } from '@recipe/types';

import { type EntreePanneau, sectionsPour } from '../coquilles/entrees-panneau';

export const CREATION_RECETTE = '/panneau/recettes/nouvelle';
const TABLEAU_DE_BORD = '/panneau';

const CREER: EntreePanneau = {
  libelle: 'Créer une recette',
  vers: CREATION_RECETTE,
};

/**
 * Les raccourcis DÉRIVENT du menu latéral : une entrée qu'un rôle ne voit pas ne peut
 * pas réapparaître ici par oubli, puisqu'elle n'est jamais construite.
 *
 * Le tableau de bord est retiré — une page ne se raccourcit pas elle-même.
 */
export function raccourcisPour(role: RoleUtilisateur): EntreePanneau[] {
  const entrees = sectionsPour(role)
    .flatMap((section) => section.entrees)
    .filter((entree) => entree.vers !== TABLEAU_DE_BORD);

  return [CREER, ...entrees];
}
