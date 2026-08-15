import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

import { ConnexionDto } from './dto/connexion.dto';
import { InscriptionDto } from './dto/inscription.dto';
import { HachageMotDePasse } from './hachage-mot-de-passe.service';
import { type CoupleDeJetons, JetonsService } from './jetons.service';

// Message unique pour « email inconnu » ET « mot de passe faux » : deux messages
// distincts diraient à un attaquant quels emails existent en base.
const IDENTIFIANTS_INVALIDES = 'Identifiants invalides';

export interface SessionOuverte {
  utilisateur: Utilisateur;
  jetons: CoupleDeJetons;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
    private readonly hachage: HachageMotDePasse,
    private readonly jetons: JetonsService,
  ) {}

  async inscrire(dto: InscriptionDto): Promise<Utilisateur> {
    if (await this.dejaPris(dto)) {
      throw new ConflictException('Email ou pseudo déjà utilisé');
    }

    const utilisateur = this.utilisateurs.create({
      email: dto.email,
      pseudo: dto.pseudo ?? null,
      motDePasseHash: await this.hachage.hacher(dto.motDePasse),
      // Le rôle n'est jamais lu depuis l'entrée : il vient du défaut de l'entité.
    });

    return this.utilisateurs.save(utilisateur);
  }

  async connecter(dto: ConnexionDto): Promise<SessionOuverte> {
    const utilisateur = await this.utilisateurs.findOne({
      where: { email: dto.email },
    });

    // On hache même sans compte trouvé (voir HachageMotDePasse) : sinon le temps de
    // réponse trahit l'existence de l'email.
    const motDePasseValide = await this.hachage.verifier(
      utilisateur?.motDePasseHash,
      dto.motDePasse,
    );

    if (utilisateur === null || !motDePasseValide) {
      throw new UnauthorizedException(IDENTIFIANTS_INVALIDES);
    }

    return {
      utilisateur,
      jetons: await this.jetons.emettreNouvelleSession(utilisateur),
    };
  }

  private dejaPris(dto: InscriptionDto): Promise<boolean> {
    // Un tableau de conditions = un OU. Le pseudo n'y entre que s'il a été fourni,
    // sinon `pseudo: undefined` ferait correspondre n'importe quelle ligne.
    const conflits: FindOptionsWhere<Utilisateur>[] = [{ email: dto.email }];
    if (dto.pseudo !== undefined) {
      conflits.push({ pseudo: dto.pseudo });
    }

    return this.utilisateurs.exists({ where: conflits });
  }
}
