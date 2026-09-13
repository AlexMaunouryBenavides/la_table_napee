// F4 — les quatre ressources de catégories (UC-03 en lecture, UC-15 en écriture).
//
// Elles partagent EXACTEMENT le même contrat : lecture ouverte à tous (le visiteur
// anonyme en a besoin pour construire ses filtres), écriture réservée à l'admin.
// `/regimes` sert de représentant et se teste à fond ; les trois autres sont vérifiées
// en paramétré, parce qu'elles doivent se comporter à l'identique.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import { COOKIE_ACCES, compteAvecRole, enTantQue, marque } from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import { Recette, Regime, sourceDeDonnees } from './entites';
import { creerNationalite, creerRecette } from './fixtures';

const REGIMES = '/api/regimes';
const INEXISTANT = 999_999;

let app: INestApplication<App>;
let source: DataSource;
let admin: string;
let moderateur: string;

const creer = (chemin: string, nom: string, jeton: string) =>
  request(app.getHttpServer())
    .post(chemin)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`)
    .send({ nom });

const idDe = (reponse: request.Response) => (reponse.body as { id: number }).id;

// Crée une catégorie et renvoie son identifiant : la plupart des tests ont besoin
// d'une ligne fraîche à eux, les noms étant uniques.
async function regime(): Promise<number> {
  const reponse = await creer(REGIMES, marque('regime'), admin).expect(
    HttpStatus.CREATED,
  );
  return idDe(reponse);
}

beforeAll(async () => {
  app = await creerAppDeTest();
  source = await sourceDeDonnees.initialize();

  admin = (await compteAvecRole(app, source, 'admin')).acces;
  moderateur = (await compteAvecRole(app, source, 'moderateur')).acces;
});

afterAll(async () => {
  await app.close();
  await source.destroy();
});

describe('Qui peut quoi', () => {
  it('ouvre la lecture à tout le monde (200)', async () => {
    await regime();

    const reponse = await request(app.getHttpServer())
      .get(REGIMES)
      .expect(HttpStatus.OK);

    expect((reponse.body as unknown[]).length).toBeGreaterThan(0);
  });

  it('refuse l’écriture à un visiteur anonyme (401)', () =>
    request(app.getHttpServer())
      .post(REGIMES)
      .send({ nom: marque('refuse') })
      .expect(HttpStatus.UNAUTHORIZED));

  it('refuse l’écriture à un modérateur : c’est admin qui est exigé (403)', () =>
    creer(REGIMES, marque('refuse'), moderateur).expect(HttpStatus.FORBIDDEN));
});

describe('Écriture par un administrateur', () => {
  it('crée une catégorie (201)', async () => {
    const nom = marque('regime');

    const reponse = await creer(REGIMES, nom, admin).expect(HttpStatus.CREATED);
    expect(reponse.body).toMatchObject({ nom });
  });

  it('refuse un nom déjà pris (409)', async () => {
    const nom = marque('regime');

    await creer(REGIMES, nom, admin).expect(HttpStatus.CREATED);
    await creer(REGIMES, nom, admin).expect(HttpStatus.CONFLICT);
  });

  it('renomme une catégorie (200)', async () => {
    const id = await regime();
    const nom = marque('renomme');

    const reponse = await enTantQue(
      app,
      'patch',
      `${REGIMES}/${String(id)}`,
      admin,
    )
      .send({ nom })
      .expect(HttpStatus.OK);

    expect(reponse.body).toMatchObject({ nom });
  });

  it('refuse un renommage vers un nom déjà pris (409)', async () => {
    const premier = await regime();
    const second = await regime();
    const nomDuPremier = (
      await request(app.getHttpServer()).get(REGIMES).expect(HttpStatus.OK)
    ).body as { id: number; nom: string }[];

    const cible = nomDuPremier.find((ligne) => ligne.id === premier);

    await enTantQue(app, 'patch', `${REGIMES}/${String(second)}`, admin)
      .send({ nom: cible?.nom })
      .expect(HttpStatus.CONFLICT);
  });

  it('supprime une catégorie inutilisée (204)', async () => {
    const id = await regime();

    await enTantQue(app, 'delete', `${REGIMES}/${String(id)}`, admin).expect(
      HttpStatus.NO_CONTENT,
    );
    expect(await source.getRepository(Regime).countBy({ id })).toBe(0);
  });

  it('refuse de supprimer une catégorie utilisée par une recette (409)', async () => {
    const id = await regime();

    // Sans ce refus, la jonction partirait en cascade : le régime disparaîtrait
    // silencieusement de toutes les recettes qui le portent.
    const recette = await creerRecette(source, await creerNationalite(source));
    await source
      .getRepository(Recette)
      .save({ id: recette.id, regimes: [{ id }] });

    await enTantQue(app, 'delete', `${REGIMES}/${String(id)}`, admin).expect(
      HttpStatus.CONFLICT,
    );
  });

  it('refuse un identifiant inexistant (404)', async () => {
    await enTantQue(app, 'patch', `${REGIMES}/${String(INEXISTANT)}`, admin)
      .send({ nom: marque('fantome') })
      .expect(HttpStatus.NOT_FOUND);

    await enTantQue(
      app,
      'delete',
      `${REGIMES}/${String(INEXISTANT)}`,
      admin,
    ).expect(HttpStatus.NOT_FOUND);
  });
});

// Les trois autres ressources n'ont pas à être testées ligne à ligne : ce qui compte
// est qu'elles se comportent COMME le représentant.
describe.each([
  ['/api/criteres-sante'],
  ['/api/types-aliment'],
  ['/api/nationalites'],
])('%s suit le même contrat', (chemin) => {
  it('lecture publique, création admin, refus du modérateur', async () => {
    const nom = marque('categorie');

    await creer(chemin, nom, moderateur).expect(HttpStatus.FORBIDDEN);
    await creer(chemin, nom, admin).expect(HttpStatus.CREATED);

    const reponse = await request(app.getHttpServer())
      .get(chemin)
      .expect(HttpStatus.OK);

    expect((reponse.body as { nom: string }[]).map((l) => l.nom)).toContain(
      nom,
    );
  });
});
