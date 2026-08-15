// Vérifie que les garanties d'INTÉGRITÉ sont bien portées par la BASE, pas seulement
// par du code applicatif. Ces tests exigent MySQL démarré (docker compose up -d) et
// les migrations appliquées ; ils ne tournent pas encore en CI (le change
// `setup-tests` posera la base de test isolée).
//
//   npm run test:e2e

import { ROLES_UTILISATEUR } from '@recipe/types';
import {
  type DataSource,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';

import { Avis } from '../src/avis/entities/avis.entity';
import { Nationalite } from '../src/categories/entities/nationalite.entity';
import sourceDeDonnees from '../src/config/data-source';
import { Ingredient } from '../src/ingredients/entities/ingredient.entity';
import { Composition } from '../src/recettes/entities/composition.entity';
import { Etape } from '../src/recettes/entities/etape.entity';
import { Recette } from '../src/recettes/entities/recette.entity';
import { Utilisateur } from '../src/utilisateurs/entities/utilisateur.entity';

let source: DataSource;
let nationalite: Nationalite;
let ingredient: Ingredient;
let utilisateur: Utilisateur;
let recette: Recette;

// Suffixe unique par exécution : les contraintes UNIQUE interdiraient de rejouer
// les mêmes libellés deux fois.
const marque = () =>
  `test-${Date.now()}-${Math.random().toString().slice(2, 8)}`;

async function creerRecette(): Promise<Recette> {
  return source.getRepository(Recette).save({
    titre: marque(),
    description: 'description',
    image: 'https://exemple.test/image.jpg',
    video: null,
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 4,
    auteur: utilisateur,
    nationalite,
  });
}

beforeAll(async () => {
  source = await sourceDeDonnees.initialize();
  nationalite = await source.getRepository(Nationalite).save({ nom: marque() });
  ingredient = await source.getRepository(Ingredient).save({ nom: marque() });
});

beforeEach(async () => {
  utilisateur = await source.getRepository(Utilisateur).save({
    pseudo: marque(),
    email: `${marque()}@exemple.test`,
    motDePasseHash: 'hash-argon2-factice',
  });
  recette = await creerRecette();
});

// `delete({})` est refusé par TypeORM (critère vide) : on passe par le query builder.
async function viderTable(entite: EntityTarget<ObjectLiteral>): Promise<void> {
  await source.createQueryBuilder().delete().from(entite).execute();
}

afterEach(async () => {
  await viderTable(Recette);
  await viderTable(Utilisateur);
});

afterAll(async () => {
  await source.getRepository(Ingredient).delete({ id: ingredient.id });
  await source.getRepository(Nationalite).delete({ id: nationalite.id });
  await source.destroy();
});

describe('Contraintes garanties par la base', () => {
  it('refuse un deuxième avis du même utilisateur sur la même recette', async () => {
    const avis = source.getRepository(Avis);
    await avis.save({ note: 4, commentaire: 'bien', utilisateur, recette });

    await expect(
      avis.save({
        note: 2,
        commentaire: 'finalement non',
        utilisateur,
        recette,
      }),
    ).rejects.toThrow();
  });

  it('refuse une note hors des bornes 1 à 5', async () => {
    const avis = source.getRepository(Avis);

    await expect(
      avis.save({ note: 6, utilisateur, recette }),
    ).rejects.toThrow();
    await expect(
      avis.save({ note: 0, utilisateur, recette }),
    ).rejects.toThrow();
  });

  it('refuse deux fois le même ingrédient dans une recette', async () => {
    const compositions = source.getRepository(Composition);
    await compositions.save({
      quantite: '200.00',
      unite: 'g',
      recette,
      ingredient,
    });

    await expect(
      compositions.save({ quantite: '50.00', unite: 'g', recette, ingredient }),
    ).rejects.toThrow();
  });

  it('applique le rôle par défaut, membre de la liste des rôles', () => {
    expect(ROLES_UTILISATEUR).toContain(utilisateur.role);
  });
});

describe('Règles de suppression', () => {
  it('supprime le contenu possédé en cascade, sans toucher aux entités partagées', async () => {
    await source
      .getRepository(Composition)
      .save({ quantite: '100.00', unite: 'g', recette, ingredient });
    await source
      .getRepository(Etape)
      .save({ numero: 1, contenu: 'mélanger', recette });
    await source.getRepository(Avis).save({ note: 5, utilisateur, recette });

    await source.getRepository(Recette).delete({ id: recette.id });

    expect(await source.getRepository(Composition).count()).toBe(0);
    expect(await source.getRepository(Etape).count()).toBe(0);
    expect(await source.getRepository(Avis).count()).toBe(0);
    // L'entité partagée survit : la cascade ne la traverse jamais.
    expect(
      await source.getRepository(Ingredient).countBy({ id: ingredient.id }),
    ).toBe(1);
  });

  it('anonymise les avis et les recettes quand un compte est supprimé', async () => {
    const avis = await source
      .getRepository(Avis)
      .save({ note: 3, utilisateur, recette });

    await source.getRepository(Utilisateur).delete({ id: utilisateur.id });

    const avisApres = await source
      .getRepository(Avis)
      .findOne({ where: { id: avis.id }, relations: { utilisateur: true } });
    const recetteApres = await source
      .getRepository(Recette)
      .findOne({ where: { id: recette.id }, relations: { auteur: true } });

    // L'avis et la recette SURVIVENT, seul l'auteur disparaît.
    expect(avisApres?.utilisateur).toBeNull();
    expect(recetteApres?.auteur).toBeNull();
  });

  it('empêche de supprimer une entité partagée encore utilisée', async () => {
    await source
      .getRepository(Composition)
      .save({ quantite: '100.00', unite: 'g', recette, ingredient });

    await expect(
      source.getRepository(Ingredient).delete({ id: ingredient.id }),
    ).rejects.toThrow();
    await expect(
      source.getRepository(Nationalite).delete({ id: nationalite.id }),
    ).rejects.toThrow();
  });
});
