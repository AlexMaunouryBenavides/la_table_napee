import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { JetonRafraichissement } from './entities/jeton-rafraichissement.entity';

export interface NouveauJeton {
  jetonHash: string;
  familleId: string;
  utilisateur: Utilisateur;
  dateExpiration: Date;
}

// Classe abstraite plutôt qu'interface : elle sert AUSSI de jeton d'injection Nest,
// donc le jour où les jetons partiront vers Redis, seule l'implémentation change et
// aucun service appelant ne bouge.
@Injectable()
export abstract class DepotJetons {
  abstract creer(jeton: NouveauJeton): Promise<void>;
  abstract trouverParHash(hash: string): Promise<JetonRafraichissement | null>;
  abstract marquerUtilise(id: string): Promise<void>;
  abstract revoquerFamille(familleId: string): Promise<void>;
  abstract revoquerToutesLesFamilles(utilisateurId: string): Promise<void>;
}

@Injectable()
export class DepotJetonsMysql extends DepotJetons {
  constructor(
    @InjectRepository(JetonRafraichissement)
    private readonly jetons: Repository<JetonRafraichissement>,
  ) {
    super();
  }

  async creer(jeton: NouveauJeton): Promise<void> {
    await this.jetons.save(this.jetons.create(jeton));
  }

  // L'utilisateur est chargé avec le jeton : le rafraîchissement doit relire le rôle
  // RÉEL en base, pas celui que portait l'ancien access token.
  trouverParHash(hash: string): Promise<JetonRafraichissement | null> {
    return this.jetons.findOne({
      where: { jetonHash: hash },
      relations: { utilisateur: true },
    });
  }

  async marquerUtilise(id: string): Promise<void> {
    await this.jetons.update({ id }, { etat: 'USED' });
  }

  // UNE requête pour toute la lignée : c'est ce que l'index sur `family_id` sert.
  async revoquerFamille(familleId: string): Promise<void> {
    await this.jetons.update({ familleId }, { etat: 'REVOKED' });
  }

  // Après un changement de mot de passe, aucune session ouverte ailleurs ne doit
  // survivre : on coupe toutes les lignées du compte, pas seulement la courante.
  async revoquerToutesLesFamilles(utilisateurId: string): Promise<void> {
    await this.jetons.update(
      { utilisateur: { id: utilisateurId } },
      { etat: 'REVOKED' },
    );
  }
}
