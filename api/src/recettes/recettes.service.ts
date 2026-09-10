import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { type Page, type RecetteResume } from '@recipe/types';
import {
  DataSource,
  type EntityManager,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { Avis } from '../avis/entities/avis.entity';
import { type Ingredient } from '../ingredients/entities/ingredient.entity';

import {
  type CreerRecetteDto,
  type IngredientSaisiDto,
} from './dto/creer-recette.dto';
import { type ListerRecettesQueryDto } from './dto/lister-recettes.query.dto';
import { type ModifierRecetteDto } from './dto/modifier-recette.dto';
import { Composition } from './entities/composition.entity';
import { Etape } from './entities/etape.entity';
import { Recette } from './entities/recette.entity';
import { appliquerRecherche } from './filtres-recettes';
import { calculerNoteMoyenne } from './note-moyenne';
import { trouverOuCreerIngredients } from './trouver-ou-creer-ingredients';

const PREMIERE_PAGE = 1;
const DECIMALES_NOTE = 1;

const TITRE_DEJA_PRIS = 'Ce titre de recette est déjà pris';
const REFERENCE_INCONNUE = 'Nationalité, régime ou catégorie inconnu';

// Codes MySQL : contrainte de clé étrangère non satisfaite, et doublon sur un index
// unique. La base refuse ; l'API traduit ce refus, elle ne le laisse pas fuiter en 500.
const CODE_REFERENCE_INCONNUE = 1452;
const CODE_DOUBLON = 1062;

const CHAMPS_SCALAIRES = [
  'titre',
  'description',
  'image',
  'video',
  'difficulte',
  'typeRecette',
  'tempsPreparation',
  'tempsCuisson',
  'portions',
] as const;

function estErreurMysql(erreur: unknown, code: number): boolean {
  return (
    erreur instanceof QueryFailedError &&
    (erreur.driverError as { errno?: number }).errno === code
  );
}

function traduire(erreur: unknown): never {
  if (estErreurMysql(erreur, CODE_REFERENCE_INCONNUE)) {
    throw new BadRequestException(REFERENCE_INCONNUE);
  }
  if (estErreurMysql(erreur, CODE_DOUBLON)) {
    throw new ConflictException(TITRE_DEJA_PRIS);
  }
  throw erreur;
}

// Seuls les champs réellement envoyés sont retenus : c'est ce qui donne au PATCH sa
// sémantique (« modifie ce que j'envoie ») et le distingue d'un remplacement.
function champsScalaires(dto: ModifierRecetteDto): Partial<Recette> {
  const retenus: Record<string, unknown> = {};

  for (const champ of CHAMPS_SCALAIRES) {
    if (dto[champ] !== undefined) {
      retenus[champ] = dto[champ];
    }
  }

  return retenus;
}

const references = (ids?: number[]) => ids?.map((id) => ({ id }));

function enCompositions(
  recette: Recette,
  saisies: IngredientSaisiDto[],
  parNom: Map<string, Ingredient>,
) {
  return saisies.map((saisie) => ({
    recette,
    ingredient: parNom.get(saisie.nom),
    // NULL ne veut pas dire zéro : il veut dire « à volonté ».
    quantite: saisie.quantite === undefined ? null : String(saisie.quantite),
    unite: saisie.unite,
  }));
}

// Le numéro se déduit de la position : impossible d'avoir deux étapes n°3.
const enEtapes = (recette: Recette, contenus: string[]) =>
  contenus.map((contenu, index) => ({
    recette,
    numero: index + 1,
    contenu,
  }));

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
    @InjectDataSource()
    private readonly source: DataSource,
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

  // UC-11 — création. Tout se joue dans UNE transaction : une recette à moitié
  // enregistrée (ingrédients créés, recette absente) est pire que pas de recette.
  async creer(dto: CreerRecetteDto, auteurId: string): Promise<Recette> {
    return this.ecrire(async (manager) => {
      await exigerTitreLibre(manager, dto.titre);

      const parNom = await trouverOuCreerIngredients(
        manager,
        dto.ingredients.map((saisie) => saisie.nom),
      );

      const recette = await manager.save(
        manager.create(Recette, {
          ...champsScalaires(dto),
          auteur: { id: auteurId },
          nationalite: { id: dto.nationaliteId },
          regimes: references(dto.regimes) ?? [],
          criteresSante: references(dto.criteresSante) ?? [],
          typesAliment: references(dto.typesAliment) ?? [],
        }),
      );

      await manager.save(
        Composition,
        enCompositions(recette, dto.ingredients, parNom),
      );
      await manager.save(Etape, enEtapes(recette, dto.etapes));

      return recette;
    });
  }

  // UC-12 — modification. Les champs absents du corps ne sont pas touchés ; ceux qui
  // sont présents remplacent l'existant.
  async modifier(id: number, dto: ModifierRecetteDto): Promise<Recette> {
    return this.ecrire(async (manager) => {
      const recette = await exigerRecette(manager, id);

      if (dto.titre !== undefined) {
        await exigerTitreLibre(manager, dto.titre, id);
      }

      Object.assign(recette, champsScalaires(dto), relations(dto));
      await manager.save(recette);
      await remplacerContenu(manager, recette, dto);

      return recette;
    });
  }

  // UC-13 — suppression. Compositions, étapes, avis et jonctions partent en cascade
  // (déclaré en base) ; les entités partagées, elles, sont protégées par RESTRICT.
  async supprimer(id: number): Promise<void> {
    const resultat = await this.recettes.delete(id);

    if ((resultat.affected ?? 0) === 0) {
      throw new NotFoundException(`Recette ${String(id)} introuvable`);
    }
  }

  // Un seul endroit ouvre une transaction et traduit les refus de la base.
  private async ecrire<T>(
    action: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.source.transaction(action);
    } catch (erreur) {
      return traduire(erreur);
    }
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

async function exigerTitreLibre(
  manager: EntityManager,
  titre: string,
  sauf?: number,
): Promise<void> {
  const dejaPris = await manager.exists(Recette, {
    where: { titre, ...(sauf === undefined ? {} : { id: Not(sauf) }) },
  });

  if (dejaPris) {
    throw new ConflictException(TITRE_DEJA_PRIS);
  }
}

async function exigerRecette(
  manager: EntityManager,
  id: number,
): Promise<Recette> {
  const recette = await manager.findOne(Recette, { where: { id } });

  if (recette === null) {
    throw new NotFoundException(`Recette ${String(id)} introuvable`);
  }

  return recette;
}

// Les relations absentes du corps restent telles quelles : `undefined` n'est pas
// « vide », c'est « non concerné ».
function relations(dto: ModifierRecetteDto): Partial<Recette> {
  return {
    ...(dto.nationaliteId === undefined
      ? {}
      : { nationalite: { id: dto.nationaliteId } }),
    ...(dto.regimes === undefined ? {} : { regimes: references(dto.regimes) }),
    ...(dto.criteresSante === undefined
      ? {}
      : { criteresSante: references(dto.criteresSante) }),
    ...(dto.typesAliment === undefined
      ? {}
      : { typesAliment: references(dto.typesAliment) }),
  } as Partial<Recette>;
}

// Ingrédients et étapes se REMPLACENT en bloc : fusionner ligne à ligne demanderait un
// identifiant côté client, que le contrat ne prévoit pas.
async function remplacerContenu(
  manager: EntityManager,
  recette: Recette,
  dto: ModifierRecetteDto,
): Promise<void> {
  if (dto.ingredients !== undefined) {
    await manager.delete(Composition, { recette: { id: recette.id } });
    const parNom = await trouverOuCreerIngredients(
      manager,
      dto.ingredients.map((saisie) => saisie.nom),
    );
    await manager.save(
      Composition,
      enCompositions(recette, dto.ingredients, parNom),
    );
  }

  if (dto.etapes !== undefined) {
    await manager.delete(Etape, { recette: { id: recette.id } });
    await manager.save(Etape, enEtapes(recette, dto.etapes));
  }
}
