import { Entity } from 'typeorm';

import { CategorieBase } from './categorie.base';

@Entity('regime')
export class Regime extends CategorieBase {}
