import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { DepotJetons } from '../auth/depot-jetons';
import { HachageMotDePasse } from '../auth/hachage-mot-de-passe.service';

import { ChangerMotDePasseDto } from './dto/changer-mot-de-passe.dto';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { Utilisateur } from './entities/utilisateur.entity';

const DEJA_PRIS = 'Email ou pseudo déjà utilisé';
const ANCIEN_MOT_DE_PASSE_FAUX = "L'ancien mot de passe est incorrect";

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
    private readonly hachage: HachageMotDePasse,
    private readonly jetons: DepotJetons,
  ) {}

  // L'identité vient du cookie signé, jamais de l'URL : il n'y a donc aucun
  // identifiant à falsifier, et toute une classe de failles disparaît par construction.
  async trouver(id: string): Promise<Utilisateur> {
    const utilisateur = await this.utilisateurs.findOne({ where: { id } });

    if (utilisateur === null) {
      throw new NotFoundException('Compte introuvable');
    }

    return utilisateur;
  }

  async modifierProfil(
    id: string,
    dto: ModifierProfilDto,
  ): Promise<Utilisateur> {
    const utilisateur = await this.trouver(id);

    await this.exigerDisponible(id, dto);
    Object.assign(utilisateur, dto);

    return this.utilisateurs.save(utilisateur);
  }

  // 400 et non 401 : l'appelant est bien authentifié, c'est sa saisie qui est fausse.
  async changerMotDePasse(
    id: string,
    dto: ChangerMotDePasseDto,
  ): Promise<void> {
    const utilisateur = await this.trouver(id);

    const correspond = await this.hachage.verifier(
      utilisateur.motDePasseHash,
      dto.ancienMotDePasse,
    );
    if (!correspond) {
      throw new BadRequestException(ANCIEN_MOT_DE_PASSE_FAUX);
    }

    utilisateur.motDePasseHash = await this.hachage.hacher(
      dto.nouveauMotDePasse,
    );
    await this.utilisateurs.save(utilisateur);

    // Changer son mot de passe, c'est souvent réagir à une compromission : les
    // sessions ouvertes ailleurs doivent tomber, pas seulement celle d'ici.
    await this.jetons.revoquerToutesLesFamilles(id);
  }

  // Supprimer le compte ne supprime pas ce qu'il a écrit : la base passe l'auteur des
  // avis et des recettes à NULL (`ON DELETE SET NULL`). Un avis sans auteur reste un
  // avis utile ; le faire disparaître trouerait les notes moyennes des recettes.
  async supprimer(id: string): Promise<void> {
    const resultat = await this.utilisateurs.delete({ id });

    if ((resultat.affected ?? 0) === 0) {
      throw new NotFoundException('Compte introuvable');
    }
  }

  private async exigerDisponible(
    id: string,
    dto: ModifierProfilDto,
  ): Promise<void> {
    const criteres = [
      ...(dto.email === undefined ? [] : [{ email: dto.email, id: Not(id) }]),
      ...(dto.pseudo === undefined
        ? []
        : [{ pseudo: dto.pseudo, id: Not(id) }]),
    ];

    if (
      criteres.length > 0 &&
      (await this.utilisateurs.exists({ where: criteres }))
    ) {
      throw new ConflictException(DEJA_PRIS);
    }
  }
}
