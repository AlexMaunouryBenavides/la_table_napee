// F0 — les recettes d'EXEMPLE (données de confort, pas de référence).
//
// Un seed se rejoue : sur une base déjà peuplée, il ne doit rien casser ni rien
// dupliquer. C'est la seule vraie garantie à tenir ici, et elle repose sur des titres
// DÉTERMINISTES — un titre généré au hasard créerait une recette de plus à chaque
// exécution.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { type DataSource, Like } from 'typeorm';

import {
  PREFIXE_EXEMPLE,
  semerRecettesExemple,
} from '../src/seeds/recettes-exemple';
import { semerDonneesReference } from '../src/seeds/semer';

import {
  Composition,
  Etape,
  Recette,
  Regime,
  sourceDeDonnees,
} from './entites';

const NOMBRE = 5;

let source: DataSource;

const compterExemples = () =>
  source.getRepository(Recette).countBy({ titre: Like(`${PREFIXE_EXEMPLE}%`) });

beforeAll(async () => {
  source = await sourceDeDonnees.initialize();
  await semerDonneesReference(source);

  // Ces tests COMPTENT des lignes : ils partent d'une base sans exemples, sans
  // dépendre de ce qu'une exécution précédente aurait laissé.
  await source
    .getRepository(Recette)
    .delete({ titre: Like(`${PREFIXE_EXEMPLE}%`) });
});

afterAll(async () => {
  await source.destroy();
});

describe('Seed des recettes d’exemple', () => {
  it('crée des recettes complètes', async () => {
    await semerRecettesExemple(source, NOMBRE);

    expect(await compterExemples()).toBe(NOMBRE);

    const recettes = await source.getRepository(Recette).find({
      where: { titre: Like(`${PREFIXE_EXEMPLE}%`) },
      relations: { nationalite: true, compositions: true, etapes: true },
    });

    for (const recette of recettes) {
      expect(recette.nationalite).not.toBeNull();
      expect(recette.compositions.length).toBeGreaterThan(0);
      expect(recette.etapes.map((etape) => etape.numero)).toContain(1);
    }
  });

  it('rejoué, ne crée aucun doublon', async () => {
    await semerRecettesExemple(source, NOMBRE);

    expect(await compterExemples()).toBe(NOMBRE);
    expect(
      await source.getRepository(Composition).count(),
    ).toBeGreaterThanOrEqual(NOMBRE);
    expect(await source.getRepository(Etape).count()).toBeGreaterThanOrEqual(
      NOMBRE,
    );
  });

  it('ne touche pas aux données de référence', async () => {
    const avant = await source.getRepository(Regime).count();

    await semerRecettesExemple(source, NOMBRE);
    await semerDonneesReference(source);

    expect(await source.getRepository(Regime).count()).toBe(avant);
  });
});
