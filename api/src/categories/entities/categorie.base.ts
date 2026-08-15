import { Column, PrimaryGeneratedColumn } from 'typeorm';

// Les quatre catégories ont exactement la même forme. La factorisation est justifiée
// ici : quatre cas réels identiques, pas une abstraction anticipée.
export abstract class CategorieBase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  nom!: string;
}
