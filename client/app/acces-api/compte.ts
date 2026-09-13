import type { Utilisateur } from '@recipe/types';

import { appelerApi } from './appeler-api';

// `/moi` plutôt que `/utilisateurs/:id` : sans identifiant dans l'URL, il n'y a rien à
// falsifier. L'identité vient du cookie (`design/routes-api.md` § 3.4).
const MOI = '/utilisateurs/moi';

/** Les deux seuls champs modifiables. Ni le rôle ni le mot de passe ne passent par
 *  là : l'API refuserait tout champ qu'elle n'a pas déclaré. */
export type ProfilAModifier = { email?: string; pseudo?: string };

export function modifierProfil(corps: ProfilAModifier): Promise<Utilisateur> {
  return appelerApi<Utilisateur>(MOI, { methode: 'PATCH', corps });
}

/** Route séparée parce que c'est une opération différente : elle exige l'ancien mot
 *  de passe, que la connexion ne redemande jamais. */
export function changerMotDePasse(
  ancienMotDePasse: string,
  nouveauMotDePasse: string,
): Promise<void> {
  return appelerApi<void>(`${MOI}/mot-de-passe`, {
    methode: 'PATCH',
    corps: { ancienMotDePasse, nouveauMotDePasse },
  });
}

/** Les avis survivent, privés de leur auteur (`ON DELETE SET NULL`). L'API efface
 *  aussi les cookies : le client n'a rien à nettoyer. */
export function supprimerCompte(): Promise<void> {
  return appelerApi<void>(MOI, { methode: 'DELETE' });
}
