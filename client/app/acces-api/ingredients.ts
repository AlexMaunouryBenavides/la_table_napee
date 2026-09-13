import type { Ingredient, Page } from '@recipe/types';

import { appelerApi } from './appeler-api';

const LIMITE_SUGGESTIONS = 8;

/**
 * Autocomplétion du référentiel — la seule route d'ingrédients, en lecture. Il
 * n'existe pas de `POST /ingredients` : un ingrédient inconnu naît à l'enregistrement
 * de la recette, par « trouver ou créer » (`design/routes-api.md` § 3.7).
 */
export async function chercherIngredients(
  recherche: string,
): Promise<Ingredient[]> {
  const criteres = new URLSearchParams({
    recherche,
    limite: String(LIMITE_SUGGESTIONS),
  });

  const page = await appelerApi<Page<Ingredient>>(
    `/ingredients?${criteres.toString()}`,
  );

  return page.donnees;
}
