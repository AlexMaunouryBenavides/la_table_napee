import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Page, type RecetteResume } from '@recipe/types';
import { Repository } from 'typeorm';

import { Avis } from '../avis/entities/avis.entity';

import { type ListerRecettesQueryDto } from './dto/lister-recettes.query.dto';
import { Recette } from './entities/recette.entity';
import { appliquerRecherche } from './filtres-recettes';
import { calculerNoteMoyenne } from './note-moyenne';

const PREMIERE_PAGE = 1;
const DECIMALES_NOTE = 1;

export type RecetteDetaillee = Recette & { noteMoyenne: number | null };

function resumer(recette: Recette, noteMoyenne: number | null): RecetteResume {
  return {
    id: recette.id,
    titre: recette.titre,
    image: recette.image,
    difficulte: recette.difficulte,
    typeRecette: recette.typeRecette,
    tempsPreparation: recette.tempsPreparation,
    tempsCuisson: recette.tempsCuisson,
    portions: recette.portions,
    nationalite: recette.nationalite.nom,
    noteMoyenne,
  };
}

@Injectable()
export class RecettesService {
  constructor(
    @InjectRepository(Recette)
    private readonly recettes: Repository<Recette>,
    @InjectRepository(Avis)
    private readonly avis: Repository<Avis>,
  ) {}

  async lister(query: ListerRecettesQueryDto): Promise<Page<RecetteResume>> {
    const qb = this.recettes
      .createQueryBuilder('recette')
      .leftJoinAndSelect('recette.nationalite', 'nationalite');

    appliquerRecherche(qb, query);
    qb.skip((query.page - PREMIERE_PAGE) * query.limite).take(query.limite);

    const [recettes, total] = await qb.getManyAndCount();
    const moyennes = await this.moyennesDe(recettes.map(({ id }) => id));

    return {
      donnees: recettes.map((recette) =>
        resumer(recette, moyennes.get(recette.id) ?? null),
      ),
      total,
      page: query.page,
      limite: query.limite,
    };
  }

  async trouverParId(id: number): Promise<RecetteDetaillee> {
    // Une seule requête avec ses relations : charger les ingrédients recette par
    // recette produirait une requête en boucle (N+1).
    const recette = await this.recettes.findOne({
      where: { id },
      relations: {
        nationalite: true,
        auteur: true,
        compositions: { ingredient: true },
        etapes: true,
        avis: { utilisateur: true },
        regimes: true,
        criteresSante: true,
        typesAliment: true,
      },
      order: { etapes: { numero: 'ASC' } },
    });

    if (recette === null) {
      throw new NotFoundException(`Recette ${id} introuvable`);
    }

    return { ...recette, noteMoyenne: calculerNoteMoyenne(recette.avis) };
  }

  // UNE requête d'agrégation pour toute la page, jamais une par recette (N+1).
  private async moyennesDe(ids: number[]): Promise<Map<number, number>> {
    if (ids.length === 0) {
      return new Map();
    }

    const lignes = await this.avis
      .createQueryBuilder('avis')
      .innerJoin('avis.recette', 'recette')
      .select('recette.id', 'recetteId')
      .addSelect('AVG(avis.note)', 'moyenne')
      .where('recette.id IN (:...ids)', { ids })
      .groupBy('recette.id')
      .getRawMany<{ recetteId: number; moyenne: string }>();

    return new Map(
      lignes.map(({ recetteId, moyenne }) => [
        Number(recetteId),
        Number(Number(moyenne).toFixed(DECIMALES_NOTE)),
      ]),
    );
  }
}
