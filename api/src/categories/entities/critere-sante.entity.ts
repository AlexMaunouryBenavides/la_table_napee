import { Entity } from 'typeorm';

import { CategorieBase } from './categorie.base';

@Entity('health_criteria')
export class CritereSante extends CategorieBase {}
