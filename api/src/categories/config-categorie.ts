import { type EntityTarget } from 'typeorm';

import { type CategorieBase } from './entities/categorie.base';

export interface ConfigCategorie {
  entite: EntityTarget<CategorieBase>;
  // Segment d'URL de la ressource (`regimes`, `criteres-sante`, …).
  chemin: string;
  // Propriété de `Recette` qui pointe vers cette catégorie. Elle sert à répondre
  // « cette catégorie est encore utilisée » sans écrire quatre requêtes différentes.
  relationRecette: string;
}
