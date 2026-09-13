import type { Page, Recette, RecetteResume } from '@recipe/types';

/** Une ligne de liste : ce que rendent `GET /recettes` et ses variantes. */
export function resumeDe(id: number, titre: string): RecetteResume {
  return {
    id,
    titre,
    image: `${String(id)}.jpg`,
    difficulte: 'moyen',
    typeRecette: 'plat',
    tempsPreparation: 30,
    tempsCuisson: 40,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: 4.8,
  };
}

/** La limite d'une page du panneau, celle qu'on rencontre le plus dans les tests. */
const LIMITE_PANNEAU = 12;

export function pageDe<T>(donnees: T[], limite = LIMITE_PANNEAU): Page<T> {
  return { donnees, total: donnees.length, page: 1, limite };
}

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
