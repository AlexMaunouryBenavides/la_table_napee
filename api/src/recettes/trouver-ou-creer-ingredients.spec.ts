import { type EntityManager } from 'typeorm';

import { Ingredient } from '../ingredients/entities/ingredient.entity';

import { trouverOuCreerIngredients } from './trouver-ou-creer-ingredients';

// La seule alerte de performance immédiate du projet : dix ingrédients saisis ne
// doivent pas produire dix allers-retours en base (`CLAUDE.md`, priorité n°3).

const NOMBRE_INGREDIENTS = 10;

const noms = Array.from(
  { length: NOMBRE_INGREDIENTS },
  (_, index) => `ingredient-${String(index)}`,
);

function managerFactice(existants: Ingredient[]) {
  return {
    find: jest.fn().mockResolvedValue(existants),
    save: jest
      .fn()
      .mockImplementation((_cible: unknown, valeurs: unknown) =>
        Promise.resolve(valeurs),
      ),
  };
}

describe('trouverOuCreerIngredients', () => {
  it('cherche les dix ingrédients en une seule requête et n’écrit qu’une fois', async () => {
    const manager = managerFactice([]);

    await trouverOuCreerIngredients(manager as unknown as EntityManager, noms);

    expect(manager.find).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledTimes(1);
  });

  it('n’écrit rien quand tous les ingrédients existent déjà', async () => {
    const existants = noms.map((nom, index) => ({ id: index, nom }));
    const manager = managerFactice(existants);

    const resultat = await trouverOuCreerIngredients(
      manager as unknown as EntityManager,
      noms,
    );

    expect(manager.save).not.toHaveBeenCalled();
    expect(resultat.size).toBe(NOMBRE_INGREDIENTS);
  });
});
