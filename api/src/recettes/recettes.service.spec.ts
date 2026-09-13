import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

import { Avis } from '../avis/entities/avis.entity';

import { Recette } from './entities/recette.entity';
import { RecettesService } from './recettes.service';

// `lister` n'est pas testé ici : il se juge sur le SQL réellement produit, donc
// contre une vraie base (test/recettes-filtres.e2e-spec.ts). Le mocker reviendrait
// à tester le query builder de TypeORM, pas notre logique.
const depotRecettes = { findOne: jest.fn() };

async function creerService(): Promise<RecettesService> {
  const module = await Test.createTestingModule({
    providers: [
      RecettesService,
      { provide: getRepositoryToken(Recette), useValue: depotRecettes },
      { provide: getRepositoryToken(Avis), useValue: {} },
      // `trouverParId` ne l'utilise pas : seules les écritures ouvrent une transaction.
      { provide: getDataSourceToken(), useValue: {} },
    ],
  }).compile();

  return module.get(RecettesService);
}

describe('RecettesService.trouverParId', () => {
  let service: RecettesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    service = await creerService();
  });

  it('lève une 404 quand la recette n’existe pas', async () => {
    depotRecettes.findOne.mockResolvedValue(null);

    await expect(service.trouverParId(42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('ajoute la note moyenne calculée à partir des avis', async () => {
    depotRecettes.findOne.mockResolvedValue({
      id: 1,
      avis: [{ note: 4 }, { note: 5 }],
    });

    const recette = await service.trouverParId(1);

    expect(recette.noteMoyenne).toBe(4.5);
  });

  it('renvoie une note moyenne nulle sans aucun avis', async () => {
    depotRecettes.findOne.mockResolvedValue({ id: 1, avis: [] });

    const recette = await service.trouverParId(1);

    expect(recette.noteMoyenne).toBeNull();
  });
});
