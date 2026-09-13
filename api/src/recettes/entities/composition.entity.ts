import { type Unite } from '@recipe/types';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Ingredient } from '../../ingredients/entities/ingredient.entity';

import { Recette } from './recette.entity';

const PRECISION_QUANTITE = 6;
const DECIMALES_QUANTITE = 2;
const LONGUEUR_ENUM = 20;

// Jonction ENRICHIE : le lien porte une quantité et une unité, donc c'est une entité
// à part entière (deux @ManyToOne), pas un @ManyToMany.
@Entity('composition')
@Unique(['recette', 'ingredient'])
export class Composition {
  @PrimaryGeneratedColumn()
  id!: number;

  // NULL ne veut pas dire zéro : il veut dire « à volonté » (sel, poivre).
  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: PRECISION_QUANTITE,
    scale: DECIMALES_QUANTITE,
    nullable: true,
  })
  quantite!: string | null;

  @Column({ name: 'unit', type: 'varchar', length: LONGUEUR_ENUM })
  unite!: Unite;

  @ManyToOne(() => Recette, (recette) => recette.compositions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recette!: Recette;

  @ManyToOne(() => Ingredient, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient!: Ingredient;
}
