import type { Recette } from '@recipe/types';

/** Une recette complète et neutre : chaque test n'écrase que ce qu'il éprouve. */
export const RECETTE: Recette = {
  id: 7,
  titre: 'Tarte fine aux tomates',
  description: 'Une pâte sablée et des tomates confites.',
  image: '',
  video: null,
  difficulte: 'moyen',
  typeRecette: 'plat',
  nationalite: { id: 1, nom: 'Française' },
  tempsPreparation: 45,
  tempsCuisson: 25,
  portions: 4,
  compositions: [],
  etapes: [],
  avis: [],
  regimes: [],
  criteresSante: [],
  typesAliment: [],
  auteur: null,
  dateCreation: '2026-03-04T12:00:00.000Z',
  noteMoyenne: null,
};
