import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Not } from 'typeorm';

import { Recette } from '../recettes/entities/recette.entity';

import { type ConfigCategorie } from './config-categorie';
import { CreerCategorieDto, ModifierCategorieDto } from './dto/categorie.dto';
import { type CategorieBase } from './entities/categorie.base';

const NOM_DEJA_PRIS = 'Ce nom est déjà utilisé';
const ENCORE_UTILISEE =
  'Cette catégorie est encore utilisée par au moins une recette';

// Un seul service pour les quatre ressources : elles sont identiques à la lettre, la
// condition posée par `design/routes-api.md` § 3.6 pour factoriser est remplie.
@Injectable()
export class CategoriesService {
  constructor(@InjectDataSource() private readonly source: DataSource) {}

  // Pas de pagination ici, contrairement aux autres listes : ce sont des listes de
  // référence courtes, et le front en a besoin ENTIÈRES pour construire ses filtres.
  lister(config: ConfigCategorie): Promise<CategorieBase[]> {
    return this.source.getRepository(config.entite).find({
      order: { nom: 'ASC' },
    });
  }

  async creer(
    config: ConfigCategorie,
    dto: CreerCategorieDto,
  ): Promise<CategorieBase> {
    await this.exigerNomLibre(config, dto.nom);

    const depot = this.source.getRepository(config.entite);
    return depot.save(depot.create({ nom: dto.nom }));
  }

  async modifier(
    config: ConfigCategorie,
    id: number,
    dto: ModifierCategorieDto,
  ): Promise<CategorieBase> {
    const categorie = await this.exigerCategorie(config, id);

    if (dto.nom !== undefined) {
      await this.exigerNomLibre(config, dto.nom, id);
      categorie.nom = dto.nom;
    }

    return this.source.getRepository(config.entite).save(categorie);
  }

  // La base laisserait partir la jonction en cascade : le régime disparaîtrait
  // silencieusement de toutes les recettes qui le portent. On refuse en amont.
  async supprimer(config: ConfigCategorie, id: number): Promise<void> {
    await this.exigerCategorie(config, id);

    if ((await this.compterUsages(config, id)) > 0) {
      throw new ConflictException(ENCORE_UTILISEE);
    }

    await this.source.getRepository(config.entite).delete({ id });
  }

  private compterUsages(config: ConfigCategorie, id: number): Promise<number> {
    return this.source
      .getRepository(Recette)
      .createQueryBuilder('recette')
      .innerJoin(`recette.${config.relationRecette}`, 'categorie')
      .where('categorie.id = :id', { id })
      .getCount();
  }

  private async exigerCategorie(
    config: ConfigCategorie,
    id: number,
  ): Promise<CategorieBase> {
    const categorie = await this.source
      .getRepository(config.entite)
      .findOne({ where: { id } });

    if (categorie === null) {
      throw new NotFoundException(`Catégorie ${String(id)} introuvable`);
    }

    return categorie;
  }

  private async exigerNomLibre(
    config: ConfigCategorie,
    nom: string,
    sauf?: number,
  ): Promise<void> {
    const dejaPris = await this.source.getRepository(config.entite).exists({
      where: { nom, ...(sauf === undefined ? {} : { id: Not(sauf) }) },
    });

    if (dejaPris) {
      throw new ConflictException(NOM_DEJA_PRIS);
    }
  }
}
