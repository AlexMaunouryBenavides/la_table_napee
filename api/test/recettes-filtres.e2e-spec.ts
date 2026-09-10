// Les filtres se jugent sur le SQL réellement exécuté : on teste donc le service
// contre une vraie base MySQL, pas contre un query builder mocké.
//
//   npm run test:e2e   (docker compose up -d + migration:run au préalable)

import {
  type DataSource,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';

import { Avis } from '../src/avis/entities/avis.entity';
import { Nationalite } from '../src/categories/entities/nationalite.entity';
import { Regime } from '../src/categories/entities/regime.entity';
import sourceDeDonnees from '../src/config/data-source';
import { type ListerRecettesQueryDto } from '../src/recettes/dto/lister-recettes.query.dto';
import { Recette } from '../src/recettes/entities/recette.entity';
import { RecettesService } from '../src/recettes/recettes.service';
import { Utilisateur } from '../src/utilisateurs/entities/utilisateur.entity';

let source: DataSource;
let service: RecettesService;
let nationalite: Nationalite;
let vegan: Regime;
let sansGluten: Regime;

const marque = () => `f2-${Date.now()}-${Math.random().toString().slice(2, 8)}`;

// Valeurs par défaut du DTO : les tests ne précisent que ce qu'ils veulent éprouver.
const requete = (
  partielle: Partial<ListerRecettesQueryDto> = {},
): ListerRecettesQueryDto => ({
  page: 1,
  limite: 20,
  tri: '-dateCreation',
  ...partielle,
});

interface RecetteDeTest {
  titre: string;
  difficulte?: 'facile' | 'moyen' | 'difficile';
  tempsPreparation?: number;
  tempsCuisson?: number;
  regimes?: Regime[];
}

async function creer(donnees: RecetteDeTest): Promise<Recette> {
  return source.getRepository(Recette).save({
    titre: donnees.titre,
    description: 'description',
    image: 'https://exemple.test/i.jpg',
    video: null,
    difficulte: donnees.difficulte ?? 'facile',
    typeRecette: 'plat',
    tempsPreparation: donnees.tempsPreparation ?? 10,
    tempsCuisson: donnees.tempsCuisson ?? 10,
    portions: 2,
    auteur: null,
    nationalite,
    regimes: donnees.regimes ?? [],
  });
}

async function viderTable(entite: EntityTarget<ObjectLiteral>): Promise<void> {
  await source.createQueryBuilder().delete().from(entite).execute();
}

beforeAll(async () => {
  source = await sourceDeDonnees.initialize();
  // Ces tests comptent des lignes : ils partent d'une table vide, sans dépendre de ce
  // qu'une autre spec aurait laissé derrière elle.
  await viderTable(Recette);
  service = new RecettesService(
    source.getRepository(Recette),
    source.getRepository(Avis),
    source,
  );
  nationalite = await source.getRepository(Nationalite).save({ nom: marque() });
  vegan = await source.getRepository(Regime).save({ nom: marque() });
  sansGluten = await source.getRepository(Regime).save({ nom: marque() });
});

afterEach(async () => {
  await viderTable(Recette);
  await viderTable(Utilisateur);
});

afterAll(async () => {
  await source.getRepository(Regime).delete({ id: vegan.id });
  await source.getRepository(Regime).delete({ id: sansGluten.id });
  await source.getRepository(Nationalite).delete({ id: nationalite.id });
  await source.destroy();
});

describe('Pagination', () => {
  beforeEach(async () => {
    await creer({ titre: `${marque()}-a` });
    await creer({ titre: `${marque()}-b` });
    await creer({ titre: `${marque()}-c` });
  });

  it('limite la page mais renvoie le total réel', async () => {
    const page = await service.lister(requete({ limite: 2 }));

    expect(page.donnees).toHaveLength(2);
    expect(page.total).toBe(3);
  });

  it('saute les pages précédentes', async () => {
    const page = await service.lister(requete({ page: 2, limite: 2 }));

    expect(page.donnees).toHaveLength(1);
  });
});

describe('Filtres', () => {
  it('filtre sur une partie du titre', async () => {
    await creer({ titre: 'Tarte aux pommes' });
    await creer({ titre: 'Gratin dauphinois' });

    const page = await service.lister(requete({ recherche: 'pomme' }));

    expect(page.donnees.map(({ titre }) => titre)).toEqual([
      'Tarte aux pommes',
    ]);
  });

  it('filtre sur la difficulté', async () => {
    await creer({ titre: `${marque()}-facile`, difficulte: 'facile' });
    await creer({ titre: `${marque()}-dur`, difficulte: 'difficile' });

    const page = await service.lister(requete({ difficulte: 'difficile' }));

    expect(page.total).toBe(1);
  });

  it('filtre sur le temps TOTAL, préparation plus cuisson', async () => {
    await creer({
      titre: `${marque()}-rapide`,
      tempsPreparation: 10,
      tempsCuisson: 15,
    });
    await creer({
      titre: `${marque()}-long`,
      tempsPreparation: 20,
      tempsCuisson: 40,
    });

    const page = await service.lister(requete({ tempsMax: 30 }));

    expect(page.total).toBe(1);
  });

  it('exige TOUS les régimes demandés, pas au moins un', async () => {
    await creer({ titre: `${marque()}-deux`, regimes: [vegan, sansGluten] });
    await creer({ titre: `${marque()}-un`, regimes: [vegan] });

    const lesDeux = await service.lister(
      requete({ regime: [vegan.id, sansGluten.id] }),
    );
    const unSeul = await service.lister(requete({ regime: [vegan.id] }));

    // C'est le cœur d'UC-03 : « végan ET sans gluten », jamais « ou ».
    expect(lesDeux.total).toBe(1);
    expect(unSeul.total).toBe(2);
  });

  it('combine plusieurs filtres', async () => {
    await creer({
      titre: 'Salade végane',
      difficulte: 'facile',
      regimes: [vegan],
    });
    await creer({
      titre: 'Salade classique',
      difficulte: 'facile',
      regimes: [],
    });

    const page = await service.lister(
      requete({
        recherche: 'Salade',
        difficulte: 'facile',
        regime: [vegan.id],
      }),
    );

    expect(page.donnees.map(({ titre }) => titre)).toEqual(['Salade végane']);
  });
});

describe('Tri', () => {
  it('trie par titre croissant et décroissant', async () => {
    await creer({ titre: 'Brioche' });
    await creer({ titre: 'Anchois' });
    await creer({ titre: 'Cassoulet' });

    const croissant = await service.lister(requete({ tri: 'titre' }));
    const decroissant = await service.lister(requete({ tri: '-titre' }));

    expect(croissant.donnees.map(({ titre }) => titre)).toEqual([
      'Anchois',
      'Brioche',
      'Cassoulet',
    ]);
    expect(decroissant.donnees.map(({ titre }) => titre)).toEqual([
      'Cassoulet',
      'Brioche',
      'Anchois',
    ]);
  });
});

describe('Note moyenne dans la liste', () => {
  it('agrège les avis sans requête par recette', async () => {
    const recette = await creer({ titre: `${marque()}-notee` });
    const sansAvis = await creer({ titre: `${marque()}-vierge` });
    const auteur = await source.getRepository(Utilisateur).save({
      pseudo: marque(),
      email: `${marque()}@exemple.test`,
      motDePasseHash: 'hash-factice',
    });
    await source
      .getRepository(Avis)
      .save({ note: 4, utilisateur: auteur, recette });

    const page = await service.lister(requete({ tri: 'titre' }));
    const parId = new Map(page.donnees.map((r) => [r.id, r.noteMoyenne]));

    expect(parId.get(recette.id)).toBe(4);
    // Aucun avis → null, jamais 0.
    expect(parId.get(sansAvis.id)).toBeNull();
  });
});
