import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { type ChargeUtileJeton } from '@recipe/types';
import { Repository } from 'typeorm';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { JetonRafraichissement } from './entities/jeton-rafraichissement.entity';

const OCTETS_ALEATOIRES = 32;
const MS_PAR_JOUR = 86_400_000;

export interface CoupleDeJetons {
  acces: string;
  rafraichissement: string;
}

// Le jeton de rafraîchissement est 32 octets tirés au hasard : impossible à deviner,
// donc un hachage rapide (SHA-256) suffit à le protéger en base. Argon2 est fait pour
// compenser la faiblesse des mots de passe HUMAINS ; ici il ne servirait qu'à ralentir
// chaque rafraîchissement.
function hacherJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

@Injectable()
export class JetonsService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(JetonRafraichissement)
    private readonly jetons: Repository<JetonRafraichissement>,
  ) {}

  // Une connexion ouvre une nouvelle FAMILLE : la lignée de rotation de cette session.
  emettreNouvelleSession(utilisateur: Utilisateur): Promise<CoupleDeJetons> {
    return this.emettre(utilisateur, randomUUID());
  }

  private async emettre(
    utilisateur: Utilisateur,
    familleId: string,
  ): Promise<CoupleDeJetons> {
    const charge: ChargeUtileJeton = {
      sub: utilisateur.id,
      role: utilisateur.role,
    };
    const acces = await this.jwt.signAsync(charge);
    const rafraichissement =
      randomBytes(OCTETS_ALEATOIRES).toString('base64url');

    await this.jetons.save(
      this.jetons.create({
        jetonHash: hacherJeton(rafraichissement),
        familleId,
        utilisateur,
        dateExpiration: this.expirationRafraichissement(),
      }),
    );

    return { acces, rafraichissement };
  }

  private expirationRafraichissement(): Date {
    const jours = this.config.getOrThrow<number>('RAFRAICHISSEMENT_JOURS');
    return new Date(Date.now() + jours * MS_PAR_JOUR);
  }
}
