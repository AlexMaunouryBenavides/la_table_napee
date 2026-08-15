import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Recette } from '../../recettes/entities/recette.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';

const LONGUEUR_COMMENTAIRE = 255;

@Entity('review')
// Un seul avis par (utilisateur, recette) : la règle est garantie par la base,
// pas seulement par le code.
@Unique(['utilisateur', 'recette'])
@Check('`grade` between 1 and 5')
export class Avis {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'grade', type: 'int' })
  note!: number;

  @Column({
    name: 'comment',
    type: 'varchar',
    length: LONGUEUR_COMMENTAIRE,
    nullable: true,
  })
  commentaire!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  dateCreation!: Date;

  // Nullable : l'avis survit à la suppression du compte, anonymisé.
  @ManyToOne(() => Utilisateur, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  utilisateur!: Utilisateur | null;

  @ManyToOne(() => Recette, (recette) => recette.avis, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recette!: Recette;
}
