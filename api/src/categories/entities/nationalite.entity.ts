import { Entity } from 'typeorm';

import { CategorieBase } from './categorie.base';

@Entity('nationality')
export class Nationalite extends CategorieBase {}
