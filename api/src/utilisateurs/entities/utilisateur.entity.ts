import { type RoleUtilisateur } from '@recipe/types';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryColumn,
} from 'typeorm';

const ROLE_PAR_DEFAUT: RoleUtilisateur = 'utilisateur';

@Entity('users')
export class Utilisateur {
  // UUID plutôt qu'un entier séquentiel : un identifiant devinable permettrait
  // d'énumérer les comptes.
  @PrimaryColumn({ type: 'char', length: 36 })
  @Generated('uuid')
  id!: string;

  @Column({
    name: 'nickname',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  pseudo!: string | null;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  // @Exclude() : le hash ne sort JAMAIS dans une réponse HTTP.
  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  motDePasseHash!: string;

  @Column({
    name: 'role',
    type: 'varchar',
    length: 20,
    default: ROLE_PAR_DEFAUT,
  })
  role!: RoleUtilisateur;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  dateCreation!: Date;
}
