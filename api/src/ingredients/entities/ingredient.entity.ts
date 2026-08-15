import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ingredient')
export class Ingredient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
  nom!: string;
}
