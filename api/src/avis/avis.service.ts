import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { aAuMoins } from '../auth/hierarchie-roles';
import { type IdentiteRequete } from '../auth/identite-requete';
import { Recette } from '../recettes/entities/recette.entity';

import { CreerAvisDto } from './dto/creer-avis.dto';
import { ModifierAvisDto } from './dto/modifier-avis.dto';
import { Avis } from './entities/avis.entity';

const AVIS_DEJA_DONNE = 'Vous avez déjà donné un avis sur cette recette';
const PAS_VOTRE_AVIS = "Cet avis n'est pas le vôtre";

@Injectable()
export class AvisService {
  constructor(
    @InjectRepository(Avis)
    private readonly avis: Repository<Avis>,
    @InjectRepository(Recette)
    private readonly recettes: Repository<Recette>,
  ) {}

  async listerDeLaRecette(recetteId: number): Promise<Avis[]> {
    await this.exigerRecette(recetteId);

    return this.avis.find({
      where: { recette: { id: recetteId } },
      relations: { utilisateur: true },
      order: { dateCreation: 'DESC' },
    });
  }

  async creer(
    recetteId: number,
    auteur: IdentiteRequete,
    dto: CreerAvisDto,
  ): Promise<Avis> {
    const recette = await this.exigerRecette(recetteId);

    // La base porte déjà UNIQUE(user_id, recipe_id) ; on la consulte d'abord pour
    // répondre 409 plutôt que de laisser remonter une erreur SQL en 500.
    const dejaDonne = await this.avis.exists({
      where: { recette: { id: recetteId }, utilisateur: { id: auteur.id } },
    });
    if (dejaDonne) {
      throw new ConflictException(AVIS_DEJA_DONNE);
    }

    return this.avis.save(
      this.avis.create({
        note: dto.note,
        commentaire: dto.commentaire ?? null,
        recette,
        utilisateur: { id: auteur.id },
      }),
    );
  }

  // UC-07 : seul l'auteur réécrit ses propres propos. Un modérateur peut supprimer un
  // avis (UC-14), jamais le réécrire — ce serait mettre des mots dans sa bouche.
  async modifier(
    id: number,
    demandeur: IdentiteRequete,
    dto: ModifierAvisDto,
  ): Promise<Avis> {
    const avis = await this.exigerAvis(id);

    if (!estAuteur(avis, demandeur)) {
      throw new ForbiddenException(PAS_VOTRE_AVIS);
    }

    if (dto.note !== undefined) {
      avis.note = dto.note;
    }
    if (dto.commentaire !== undefined) {
      avis.commentaire = dto.commentaire;
    }

    return this.avis.save(avis);
  }

  // Deux autorisations pour une même route : la propriété (UC-08) OU la modération
  // (UC-14). La seconde est un rôle, mais elle se juge ici parce que la première
  // exige de connaître l'objet — un guard ne l'a pas encore chargé.
  async supprimer(id: number, demandeur: IdentiteRequete): Promise<void> {
    const avis = await this.exigerAvis(id);

    if (
      !estAuteur(avis, demandeur) &&
      !aAuMoins(demandeur.role, 'moderateur')
    ) {
      throw new ForbiddenException(PAS_VOTRE_AVIS);
    }

    await this.avis.remove(avis);
  }

  private async exigerRecette(id: number): Promise<Recette> {
    const recette = await this.recettes.findOne({ where: { id } });
    if (recette === null) {
      throw new NotFoundException(`Recette ${id} introuvable`);
    }
    return recette;
  }

  private async exigerAvis(id: number): Promise<Avis> {
    const avis = await this.avis.findOne({
      where: { id },
      relations: { utilisateur: true },
    });
    if (avis === null) {
      throw new NotFoundException(`Avis ${id} introuvable`);
    }
    return avis;
  }
}

// L'avis anonymisé (compte supprimé, `utilisateur` à NULL) n'appartient plus à
// personne : `undefined === undefined` ne doit pas devenir une autorisation.
function estAuteur(avis: Avis, demandeur: IdentiteRequete): boolean {
  return avis.utilisateur !== null && avis.utilisateur.id === demandeur.id;
}
