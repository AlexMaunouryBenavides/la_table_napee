import { type DataSource } from 'typeorm';

import { marque } from './aide-auth';
import { Nationalite, Recette } from './entites';

// Une recette valide « par défaut », sans que chaque spec ait à connaître ses onze
// colonnes obligatoires. Les tests qui jugent les FILTRES ont leurs propres variantes.
export const creerNationalite = (source: DataSource): Promise<Nationalite> =>
  source.getRepository(Nationalite).save({ nom: marque('nationalite') });

export const creerRecette = (
  source: DataSource,
  nationalite: Nationalite,
): Promise<Recette> =>
  source.getRepository(Recette).save({
    titre: marque('recette'),
    description: 'description',
    image: 'https://exemple.test/i.jpg',
    video: null,
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 10,
    portions: 2,
    auteur: null,
    nationalite,
  });
