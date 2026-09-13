// Les seeds insèrent des DONNÉES ; les migrations créent la STRUCTURE.
// Les deux ne se mélangent jamais : rejouer une migration qui insère des lignes
// produirait des doublons ou une erreur.

import { type DataSource, type EntityTarget } from 'typeorm';

import { CategorieBase } from '../categories/entities/categorie.base';
import { CritereSante } from '../categories/entities/critere-sante.entity';
import { Nationalite } from '../categories/entities/nationalite.entity';
import { Regime } from '../categories/entities/regime.entity';
import { TypeAliment } from '../categories/entities/type-aliment.entity';

import {
  CRITERES_SANTE,
  NATIONALITES,
  REGIMES,
  TYPES_ALIMENT,
} from './donnees-reference';

// `orIgnore()` s'appuie sur la contrainte UNIQUE(name) : relancer le seed ne crée
// aucun doublon. C'est ce qui le rend idempotent.
async function semerCategorie(
  source: DataSource,
  entite: EntityTarget<CategorieBase>,
  noms: string[],
): Promise<void> {
  await source
    .createQueryBuilder()
    .insert()
    .into(entite)
    .values(noms.map((nom) => ({ nom })))
    .orIgnore()
    .execute();
}

export async function semerDonneesReference(source: DataSource): Promise<void> {
  await semerCategorie(source, Regime, REGIMES);
  await semerCategorie(source, CritereSante, CRITERES_SANTE);
  await semerCategorie(source, TypeAliment, TYPES_ALIMENT);
  await semerCategorie(source, Nationalite, NATIONALITES);
}
