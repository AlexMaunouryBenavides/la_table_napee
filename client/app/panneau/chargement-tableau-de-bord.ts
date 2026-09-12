import type { Page, RecetteResume, RoleUtilisateur } from '@recipe/types';

import { listerRecettes } from '../acces-api/recettes';
import { listerUtilisateurs } from '../acces-api/utilisateurs';

/** `'echec'` n'est pas `0` : « inconnu » et « aucun » ne se ressemblent pas.
 *  `'non-demande'` dit que le rôle n'a pas le droit de lire cette statistique. */
export type TableauDeBord = {
  recettes: Page<RecetteResume> | 'echec';
  comptes: number | 'echec' | 'non-demande';
};

const DERNIERES = 5;
const UNE_SEULE = 1;

function limite(valeur: number): URLSearchParams {
  return new URLSearchParams({ limite: String(valeur) });
}

/**
 * Deux appels au plus, lancés ENSEMBLE et échouant séparément : une statistique en
 * panne ne doit pas emporter le tableau de bord.
 *
 * Les cinq dernières recettes et leur compteur viennent du MÊME appel : la réponse
 * paginée porte `total` en plus de ses lignes.
 */
export async function chargerTableauDeBord(
  role: RoleUtilisateur,
): Promise<TableauDeBord> {
  const estAdmin = role === 'admin';

  const [recettes, comptes] = await Promise.allSettled([
    listerRecettes(limite(DERNIERES)),
    // `GET /utilisateurs` est réservé à l'admin : on s'abstient d'appeler plutôt que
    // de rattraper le 403 qu'on aurait provoqué soi-même.
    estAdmin ? listerUtilisateurs(limite(UNE_SEULE)) : Promise.resolve(null),
  ]);

  return {
    recettes: recettes.status === 'fulfilled' ? recettes.value : 'echec',
    comptes: comptesDepuis(estAdmin, comptes),
  };
}

function comptesDepuis(
  estAdmin: boolean,
  resultat: PromiseSettledResult<Page<unknown> | null>,
): TableauDeBord['comptes'] {
  if (!estAdmin) {
    return 'non-demande';
  }

  return resultat.status === 'fulfilled' && resultat.value !== null
    ? resultat.value.total
    : 'echec';
}
