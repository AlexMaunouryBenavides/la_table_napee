import { type EntityManager, In } from 'typeorm';

import { Ingredient } from '../ingredients/entities/ingredient.entity';

// « Trouver ou créer » en DEUX requêtes, quel que soit le nombre d'ingrédients saisis :
// un SELECT pour tout le lot, un INSERT pour les seuls manquants. Chercher ingrédient
// par ingrédient serait la requête en boucle (N+1) que le projet s'interdit.
export async function trouverOuCreerIngredients(
  manager: EntityManager,
  noms: string[],
): Promise<Map<string, Ingredient>> {
  const demandes = [...new Set(noms)];

  const existants = await manager.find(Ingredient, {
    where: { nom: In(demandes) },
  });

  const parNom = new Map(
    existants.map((ingredient) => [ingredient.nom, ingredient]),
  );

  const manquants = demandes.filter((nom) => !parNom.has(nom));
  if (manquants.length === 0) {
    return parNom;
  }

  const crees = await manager.save(
    Ingredient,
    manquants.map((nom) => ({ nom })),
  );

  for (const ingredient of crees) {
    parNom.set(ingredient.nom, ingredient);
  }

  return parNom;
}
