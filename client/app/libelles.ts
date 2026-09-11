import type { Difficulte, TypeRecette } from '@recipe/types';

// Les valeurs d'énumération de l'API sont sans accent ni majuscule (`entree`,
// `moyen`). Leur traduction pour l'œil vit ICI et nulle part ailleurs : trois copies
// de cette table, c'est trois occasions de diverger.

export const LIBELLES_TYPE: Record<TypeRecette, string> = {
  entree: 'Entrée',
  plat: 'Plat',
  dessert: 'Dessert',
  glace: 'Glace',
  boisson: 'Boisson',
  sauce: 'Sauce',
};

export const LIBELLES_DIFFICULTE: Record<Difficulte, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};
