import { type Difficulte, type TypeRecette } from '@recipe/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Avis } from '../../avis/entities/avis.entity';
import { CritereSante } from '../../categories/entities/critere-sante.entity';
import { Nationalite } from '../../categories/entities/nationalite.entity';
import { Regime } from '../../categories/entities/regime.entity';
import { TypeAliment } from '../../categories/entities/type-aliment.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';

import { Composition } from './composition.entity';
import { Etape } from './etape.entity';

const LONGUEUR_URL = 512;
const LONGUEUR_TEXTE_COURT = 255;
const LONGUEUR_ENUM = 20;

@Entity('recipe')
export class Recette {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'title',
    type: 'varchar',
    length: LONGUEUR_TEXTE_COURT,
    unique: true,
  })
  titre!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'image', type: 'varchar', length: LONGUEUR_URL })
  image!: string;

  @Column({
    name: 'video',
    type: 'varchar',
    length: LONGUEUR_URL,
    nullable: true,
  })
  video!: string | null;

  @Column({ name: 'difficulty', type: 'varchar', length: LONGUEUR_ENUM })
  difficulte!: Difficulte;

  @Column({ name: 'recipe_type', type: 'varchar', length: LONGUEUR_ENUM })
  typeRecette!: TypeRecette;

  @Column({ name: 'preparation_time', type: 'int' })
  tempsPreparation!: number;

  @Column({ name: 'cooking_time', type: 'int' })
  tempsCuisson!: number;

  @Column({ name: 'portion', type: 'int' })
  portions!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  dateCreation!: Date;

  // Nullable : la recette survit à la suppression de son auteur (anonymisation).
  @ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  auteur!: Utilisateur | null;

  // Entité partagée : on ne peut pas supprimer une nationalité encore utilisée.
  @ManyToOne(() => Nationalite, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'nationality_id' })
  nationalite!: Nationalite;

  @OneToMany(() => Composition, (composition) => composition.recette)
  compositions!: Composition[];

  @OneToMany(() => Etape, (etape) => etape.recette)
  etapes!: Etape[];

  @OneToMany(() => Avis, (avis) => avis.recette)
  avis!: Avis[];

  @ManyToMany(() => Regime)
  @JoinTable({
    name: 'regime_recipe',
    joinColumn: { name: 'recipe_id' },
    inverseJoinColumn: { name: 'regime_id' },
  })
  regimes!: Regime[];

  @ManyToMany(() => CritereSante)
  @JoinTable({
    name: 'recipe_health_criteria',
    joinColumn: { name: 'recipe_id' },
    inverseJoinColumn: { name: 'health_criteria_id' },
  })
  criteresSante!: CritereSante[];

  @ManyToMany(() => TypeAliment)
  @JoinTable({
    name: 'recipe_food_type',
    joinColumn: { name: 'recipe_id' },
    inverseJoinColumn: { name: 'food_type_id' },
  })
  typesAliment!: TypeAliment[];
}
