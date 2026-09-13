import { faker } from '@faker-js/faker';
import { DIFFICULTES, TYPES_RECETTE, UNITES } from '@recipe/types';
import { type DataSource, type EntityManager, In } from 'typeorm';

import { CritereSante } from '../categories/entities/critere-sante.entity';
import { Nationalite } from '../categories/entities/nationalite.entity';
import { Regime } from '../categories/entities/regime.entity';
import { TypeAliment } from '../categories/entities/type-aliment.entity';
import { Composition } from '../recettes/entities/composition.entity';
import { Etape } from '../recettes/entities/etape.entity';
import { Recette } from '../recettes/entities/recette.entity';
import { trouverOuCreerIngredients } from '../recettes/trouver-ou-creer-ingredients';

// Le titre est DÉTERMINISTE : c'est lui qui rend le seed idempotent. Un titre tiré au
// hasard créerait une recette de plus à chaque exécution, et la contrainte UNIQUE ne
// dirait rien puisque le nom serait toujours différent.
export const PREFIXE_EXEMPLE = 'Exemple n°';

const INGREDIENTS_MIN = 3;
const INGREDIENTS_MAX = 6;
const ETAPES_MIN = 3;
const ETAPES_MAX = 6;
const TEMPS_MIN = 5;
const TEMPS_MAX = 90;
const PORTIONS_MIN = 1;
const PORTIONS_MAX = 8;
const PREMIERE_ETAPE = 1;
const QUANTITE_MIN = 1;
const QUANTITE_MAX = 500;

interface References {
  nationalites: Nationalite[];
  regimes: Regime[];
  criteresSante: CritereSante[];
  typesAliment: TypeAliment[];
}

const entier = (min: number, max: number) => faker.number.int({ min, max });

// Quelques éléments d'une liste, jamais zéro : une recette sans aucune catégorie ne
// remonterait dans aucun filtre, et n'éprouverait donc rien.
const quelquesUns = <T>(elements: T[]) =>
  faker.helpers.arrayElements(elements, { min: 1, max: 2 });

async function lireReferences(manager: EntityManager): Promise<References> {
  const [nationalites, regimes, criteresSante, typesAliment] =
    await Promise.all([
      manager.find(Nationalite),
      manager.find(Regime),
      manager.find(CritereSante),
      manager.find(TypeAliment),
    ]);

  if (nationalites.length === 0) {
    throw new Error(
      'Aucune donnée de référence : lance `npm run seed` avant les exemples.',
    );
  }

  return { nationalites, regimes, criteresSante, typesAliment };
}

function composerRecette(titre: string, references: References): Recette {
  return {
    titre,
    description: faker.food.description(),
    image: faker.image.urlPicsumPhotos(),
    video: null,
    difficulte: faker.helpers.arrayElement(DIFFICULTES),
    typeRecette: faker.helpers.arrayElement(TYPES_RECETTE),
    tempsPreparation: entier(TEMPS_MIN, TEMPS_MAX),
    tempsCuisson: entier(TEMPS_MIN, TEMPS_MAX),
    portions: entier(PORTIONS_MIN, PORTIONS_MAX),
    auteur: null,
    nationalite: faker.helpers.arrayElement(references.nationalites),
    regimes: quelquesUns(references.regimes),
    criteresSante: quelquesUns(references.criteresSante),
    typesAliment: quelquesUns(references.typesAliment),
  } as Recette;
}

async function garnir(manager: EntityManager, recette: Recette): Promise<void> {
  const noms = faker.helpers.uniqueArray(
    () => faker.food.ingredient(),
    entier(INGREDIENTS_MIN, INGREDIENTS_MAX),
  );
  const parNom = await trouverOuCreerIngredients(manager, noms);

  await manager.save(
    Composition,
    noms.map((nom) => ({
      recette,
      ingredient: parNom.get(nom),
      quantite: String(entier(QUANTITE_MIN, QUANTITE_MAX)),
      unite: faker.helpers.arrayElement(UNITES),
    })),
  );

  await manager.save(
    Etape,
    Array.from({ length: entier(ETAPES_MIN, ETAPES_MAX) }, (_, index) => ({
      recette,
      numero: index + PREMIERE_ETAPE,
      contenu: faker.lorem.sentence(),
    })),
  );
}

// Données de CONFORT : de quoi éprouver la pagination, les filtres et l'affichage.
// À ne jamais confondre avec les données de référence, qui sont obligatoires.
export async function semerRecettesExemple(
  source: DataSource,
  nombre: number,
): Promise<number> {
  const titres = Array.from(
    { length: nombre },
    (_, index) => `${PREFIXE_EXEMPLE}${String(index + PREMIERE_ETAPE)}`,
  );

  return source.transaction(async (manager) => {
    const references = await lireReferences(manager);

    const existants = new Set(
      (
        await manager.find(Recette, {
          where: { titre: In(titres) },
          select: { titre: true },
        })
      ).map((recette) => recette.titre),
    );

    const manquants = titres.filter((titre) => !existants.has(titre));

    for (const titre of manquants) {
      const recette = await manager.save(
        manager.create(Recette, composerRecette(titre, references)),
      );
      await garnir(manager, recette);
    }

    return manquants.length;
  });
}
