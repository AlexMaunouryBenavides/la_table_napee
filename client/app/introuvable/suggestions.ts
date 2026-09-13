import type { RecetteResume } from '@recipe/types';

import { listerRecettes } from '../acces-api/recettes';

const LONGUEUR_MINIMALE = 4;
const NOMBRE_DE_SUGGESTIONS = '3';
const SEPARATEURS = /[/\-_.]+/;
const QUE_DES_CHIFFRES = /^\d+$/;

// Les mots des adresses du site lui-même : ils ne disent rien de la recette cherchée.
const MOTS_DE_NAVIGATION = new Set([
  'recettes',
  'recette',
  'panneau',
  'categories',
  'compte',
  'connexion',
  'inscription',
  'utilisateurs',
  'modifier',
  'nouvelle',
]);

/** Une adresse mal encodée ne doit pas faire tomber la page d'erreur elle-même. */
function decoder(chemin: string): string {
  try {
    return decodeURIComponent(chemin);
  } catch {
    return chemin;
  }
}

/**
 * Le mot de l'adresse le plus prometteur pour une recherche : le plus long, donc le
 * plus spécifique (« tomate » plutôt que « fine »). `null` quand rien n'est
 * exploitable — la page ne propose alors rien, plutôt que des recettes au hasard.
 */
export function termeDeRecherche(chemin: string): string | null {
  const mots = decoder(chemin)
    .toLowerCase()
    .split(SEPARATEURS)
    .filter(
      (mot) =>
        mot.length >= LONGUEUR_MINIMALE &&
        !QUE_DES_CHIFFRES.test(mot) &&
        !MOTS_DE_NAVIGATION.has(mot),
    );

  return mots.reduce<string | null>(
    (plusLong, mot) =>
      plusLong === null || mot.length > plusLong.length ? mot : plusLong,
    null,
  );
}

/**
 * Jusqu'à trois recettes proches de l'adresse demandée. Une panne de l'API n'est pas
 * une seconde erreur à montrer : la 404 reste une 404, sans suggestions.
 */
export async function chargerSuggestions(
  chemin: string,
): Promise<RecetteResume[]> {
  const terme = termeDeRecherche(chemin);

  if (terme === null) {
    return [];
  }

  try {
    const page = await listerRecettes(
      new URLSearchParams({ recherche: terme, limite: NOMBRE_DE_SUGGESTIONS }),
    );
    return page.donnees;
  } catch {
    return [];
  }
}
