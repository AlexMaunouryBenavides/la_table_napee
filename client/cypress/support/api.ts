/** Les comptes posés par `seed:exemples` sur la base de test, un par rôle. */
export const COMPTES = {
  admin: 'admin@exemple.test',
  moderateur: 'moderateur@exemple.test',
} as const;

export const MOT_DE_PASSE_EXEMPLE = 'Password123!';

/** L'adresse d'une route de l'API qui sert les parcours. */
export function urlApi(chemin: string): string {
  return `${String(Cypress.expose('apiUrl'))}${chemin}`;
}
