import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Recette } from './recette.entity';

@Entity('steps')
@Unique(['recette', 'numero'])
export class Etape {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'number', type: 'int' })
  numero!: number;

  @Column({ name: 'content', type: 'text' })
  contenu!: string;

  @ManyToOne(() => Recette, (recette) => recette.etapes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recette!: Recette;
}
