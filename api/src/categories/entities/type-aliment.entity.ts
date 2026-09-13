import { Entity } from 'typeorm';

import { CategorieBase } from './categorie.base';

@Entity('food_type')
export class TypeAliment extends CategorieBase {}
