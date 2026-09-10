// Les specs e2e travaillent toutes contre les mêmes entités et la même source. Sans ce
// point de passage, chaque fichier recopie le même bloc de huit imports — une
// duplication que jscpd relève, à juste titre.

export { Avis } from '../src/avis/entities/avis.entity';
export { Nationalite } from '../src/categories/entities/nationalite.entity';
export { default as sourceDeDonnees } from '../src/config/data-source';
export { Ingredient } from '../src/ingredients/entities/ingredient.entity';
export { Composition } from '../src/recettes/entities/composition.entity';
export { Etape } from '../src/recettes/entities/etape.entity';
export { Recette } from '../src/recettes/entities/recette.entity';
export { Utilisateur } from '../src/utilisateurs/entities/utilisateur.entity';
