import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';

// Valeurs stockées en base, donc en anglais comme le reste du schéma.
// ACTIVE : utilisable. USED : déjà tourné. REVOKED : annulé (vol ou déconnexion).
export type EtatJeton = 'ACTIVE' | 'USED' | 'REVOKED';

const ETAT_PAR_DEFAUT: EtatJeton = 'ACTIVE';

@Entity('refresh_token')
export class JetonRafraichissement {
  @PrimaryColumn({ type: 'char', length: 36 })
  @Generated('uuid')
  id!: string;

  // Le jeton est stocké haché, comme un mot de passe.
  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  jetonHash!: string;

  // Lignée de rotation : un jeton déjà utilisé qui resurgit fait révoquer sa famille.
  @Index('idx_refresh_family')
  @Column({ name: 'family_id', type: 'char', length: 36 })
  familleId!: string;

  @Column({
    name: 'state',
    type: 'varchar',
    length: 10,
    default: ETAT_PAR_DEFAUT,
  })
  etat!: EtatJeton;

  @Column({ name: 'expires_at', type: 'datetime' })
  dateExpiration!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  dateCreation!: Date;

  @ManyToOne(() => Utilisateur, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  utilisateur!: Utilisateur;
}
