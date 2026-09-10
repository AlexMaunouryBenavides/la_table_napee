import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Page } from '@recipe/types';
import { Not, Repository } from 'typeorm';

import { DepotJetons } from '../auth/depot-jetons';
import { HachageMotDePasse } from '../auth/hachage-mot-de-passe.service';

import { ChangerMotDePasseDto } from './dto/changer-mot-de-passe.dto';
import { ChangerRoleDto } from './dto/changer-role.dto';
import { ListerUtilisateursQueryDto } from './dto/lister-utilisateurs.query.dto';
import { ModifierProfilDto } from './dto/modifier-profil.dto';
import { Utilisateur } from './entities/utilisateur.entity';

const DEJA_PRIS = 'Email ou pseudo déjà utilisé';
const ANCIEN_MOT_DE_PASSE_FAUX = "L'ancien mot de passe est incorrect";
const AUTO_RETROGRADATION = 'Un administrateur ne peut pas se retirer son rôle';
const DERNIER_ADMIN =
  "C'est le dernier administrateur : il ne peut être ni rétrogradé ni supprimé";
const PREMIERE_PAGE = 1;
const ADMIN = 'admin';

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
    const utilisateur = await this.trouver(id);

    // Vaut pour `/moi` comme pour la route d'administration : par où qu'elle passe, la
    // disparition du dernier admin rend l'administration inaccessible.
    if (
      utilisateur.role === ADMIN &&
      (await this.compterAdmins()) <= PREMIERE_PAGE
    ) {
      throw new ConflictException(DERNIER_ADMIN);
    }

    await this.utilisateurs.delete({ id });
  }

  // UC-16 — la liste est paginée comme toutes les listes de l'API : on ne renvoie
  // jamais une table entière.
  async lister(query: ListerUtilisateursQueryDto): Promise<Page<Utilisateur>> {
    const [donnees, total] = await this.utilisateurs.findAndCount({
      skip: (query.page - PREMIERE_PAGE) * query.limite,
      take: query.limite,
      order: { dateCreation: 'DESC' },
    });

    return { donnees, total, page: query.page, limite: query.limite };
  }

  // UC-16 — la route la plus dangereuse de l'API : elle distribue le pouvoir.
  async changerRole(
    id: string,
    dto: ChangerRoleDto,
    demandeurId: string,
  ): Promise<Utilisateur> {
    const cible = await this.trouver(id);

    if (cible.role === ADMIN && dto.role !== ADMIN) {
      await this.exigerRetrogradationPossible(cible.id, demandeurId);
    }

    cible.role = dto.role;
    return this.utilisateurs.save(cible);
  }

  private async exigerRetrogradationPossible(
    cibleId: string,
    demandeurId: string,
  ): Promise<void> {
    // Se retirer son propre rôle est toujours refusé, même s'il reste d'autres
    // admins : c'est presque toujours une fausse manœuvre, jamais une intention.
    if (cibleId === demandeurId) {
      throw new ConflictException(AUTO_RETROGRADATION);
    }

    if ((await this.compterAdmins()) <= PREMIERE_PAGE) {
      throw new ConflictException(DERNIER_ADMIN);
    }
  }

  private compterAdmins(): Promise<number> {
    return this.utilisateurs.countBy({ role: ADMIN });
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
