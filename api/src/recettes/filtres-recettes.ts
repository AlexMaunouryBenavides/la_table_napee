import { type SelectQueryBuilder } from 'typeorm';

import {
  TRIS,
  type CleTri,
  type ListerRecettesQueryDto,
} from './dto/lister-recettes.query.dto';
import { type Recette } from './entities/recette.entity';

// Table de jonction + colonne à interroger pour chaque filtre cumulatif.
const JONCTIONS = {
  regime: { table: 'regime_recipe', colonne: 'regime_id' },
  critereSante: {
    table: 'recipe_health_criteria',
    colonne: 'health_criteria_id',
  },
  typeAliment: { table: 'recipe_food_type', colonne: 'food_type_id' },
  ingredient: { table: 'composition', colonne: 'ingredient_id' },
} as const;

type CleJonction = keyof typeof JONCTIONS;

interface FiltreJonction {
  table: string;
  colonne: string;
  ids: number[];
}

// Le filtre est CUMULATIF : « végan ET sans gluten » exige les DEUX. D'où le
// `HAVING COUNT(DISTINCT …) = nombre demandé`.
// Une sous-requête plutôt qu'une jointure : joindre multiplierait les lignes et
// fausserait la pagination.
function filtrerParToutes(
  qb: SelectQueryBuilder<Recette>,
  filtre: FiltreJonction,
): void {
  const parametre = `ids_${filtre.colonne}`;
  const sousRequete = qb
    .subQuery()
    .select('lien.recipe_id')
    .from(filtre.table, 'lien')
    .where(`lien.${filtre.colonne} IN (:...${parametre})`)
    .groupBy('lien.recipe_id')
    .having(`COUNT(DISTINCT lien.${filtre.colonne}) = ${filtre.ids.length}`)
    .getQuery();

  qb.andWhere(`recette.id IN ${sousRequete}`).setParameter(
    parametre,
    filtre.ids,
  );
}

function appliquerFiltresSimples(
  qb: SelectQueryBuilder<Recette>,
  query: ListerRecettesQueryDto,
): void {
  if (query.recherche !== undefined) {
    qb.andWhere('recette.titre LIKE :recherche', {
      recherche: `%${query.recherche}%`,
    });
  }
  if (query.difficulte !== undefined) {
    qb.andWhere('recette.difficulte = :difficulte', {
      difficulte: query.difficulte,
    });
  }
  if (query.type !== undefined) {
    qb.andWhere('recette.typeRecette = :type', { type: query.type });
  }
  if (query.nationalite !== undefined) {
    qb.andWhere('recette.nationalite = :nationalite', {
      nationalite: query.nationalite,
    });
  }
  if (query.tempsMax !== undefined) {
    qb.andWhere(
      'recette.tempsPreparation + recette.tempsCuisson <= :tempsMax',
      { tempsMax: query.tempsMax },
    );
  }
}

function appliquerFiltresCumulatifs(
  qb: SelectQueryBuilder<Recette>,
  query: ListerRecettesQueryDto,
): void {
  for (const cle of Object.keys(JONCTIONS) as CleJonction[]) {
    const ids = query[cle];
    if (ids !== undefined && ids.length > 0) {
      filtrerParToutes(qb, { ...JONCTIONS[cle], ids });
    }
  }
}

// Le préfixe `-` veut dire décroissant. La clé a déjà été validée par le DTO
// contre une liste fermée : rien d'arbitraire n'arrive jusqu'ici.
function appliquerTri(qb: SelectQueryBuilder<Recette>, tri: string): void {
  const decroissant = tri.startsWith('-');
  const cle = (decroissant ? tri.slice(1) : tri) as CleTri;
  qb.orderBy(TRIS[cle], decroissant ? 'DESC' : 'ASC');
}

export function appliquerRecherche(
  qb: SelectQueryBuilder<Recette>,
  query: ListerRecettesQueryDto,
): void {
  appliquerFiltresSimples(qb, query);
  appliquerFiltresCumulatifs(qb, query);
  appliquerTri(qb, query.tri);
}
