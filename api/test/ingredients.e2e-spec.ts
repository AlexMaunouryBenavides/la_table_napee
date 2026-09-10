// F5 — autocomplétion des ingrédients (support d'UC-11).
//
// Une seule route, en lecture : elle sert la saisie du formulaire de recette. Il n'y a
// volontairement pas de `POST /ingredients` — la création passe par « trouver ou
// créer » au moment d'enregistrer la recette, sinon « Tomate » et « tomates »
// finiraient tous deux en base (`design/routes-api.md` § 3.7).
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import { compteAvecRole, enTantQue, marque } from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import { Ingredient, sourceDeDonnees } from './entites';

const INGREDIENTS = '/api/ingredients';
const LIMITE_DEMANDEE = 2;
const LIMITE_ABSURDE = 999;

let app: INestApplication<App>;
let source: DataSource;
let moderateur: string;
let utilisateur: string;

// Préfixe unique : la table est partagée avec les autres specs, une recherche sur ce
// préfixe ne peut ramener que NOS lignes.
const prefixe = marque('zz');
const nomsCrees = ['avocat', 'carotte', 'tomate', 'Tomme'].map(
  (nom) => `${prefixe}-${nom}`,
);

const chercher = (recherche: string, jeton: string) =>
  enTantQue(
    app,
    'get',
    `${INGREDIENTS}?recherche=${encodeURIComponent(recherche)}`,
    jeton,
  );

const nomsDe = (reponse: request.Response) =>
  (reponse.body as { donnees: { nom: string }[] }).donnees.map(
    (ingredient) => ingredient.nom,
  );

beforeAll(async () => {
  app = await creerAppDeTest();
  source = await sourceDeDonnees.initialize();

  await source
    .getRepository(Ingredient)
    .save(nomsCrees.map((nom) => ({ nom })));

  moderateur = (await compteAvecRole(app, source, 'moderateur')).acces;
  utilisateur = (await compteAvecRole(app, source, 'utilisateur')).acces;
});

afterAll(async () => {
  await app.close();
  await source.destroy();
});

describe('Qui peut consulter les ingrédients', () => {
  it('refuse un visiteur anonyme (401)', () =>
    request(app.getHttpServer())
      .get(INGREDIENTS)
      .expect(HttpStatus.UNAUTHORIZED));

  it('refuse un utilisateur simple (403)', () =>
    enTantQue(app, 'get', INGREDIENTS, utilisateur).expect(
      HttpStatus.FORBIDDEN,
    ));

  it('renvoie une page enveloppée à un modérateur (200)', async () => {
    const reponse = await enTantQue(app, 'get', INGREDIENTS, moderateur).expect(
      HttpStatus.OK,
    );

    expect(reponse.body).toMatchObject({ page: 1, limite: 20 });
    expect((reponse.body as { total: number }).total).toBeGreaterThan(0);
  });
});

describe('Recherche', () => {
  it('ne renvoie que les noms qui contiennent le fragment, triés', async () => {
    const noms = nomsDe(await chercher(prefixe, moderateur).expect(200));

    // Comparaison insensible à la casse : c'est l'ordre de la collation MySQL, où
    // « tomate » précède « Tomme ». Le `.sort()` de JS, lui, est sensible à la casse.
    const attendu = [...noms].sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' }),
    );

    expect(noms).toEqual(attendu);
    expect(noms).toHaveLength(nomsCrees.length);
  });

  it('écarte ce qui ne correspond pas', async () => {
    const noms = nomsDe(
      await chercher(`${prefixe}-tom`, moderateur).expect(200),
    );

    expect(noms).toHaveLength(2);
    expect(noms).not.toContain(`${prefixe}-carotte`);
  });

  it('est insensible à la casse', async () => {
    const noms = nomsDe(
      await chercher(`${prefixe}-TOM`, moderateur).expect(200),
    );

    expect(noms).toHaveLength(2);
  });
});

describe('Pagination', () => {
  it('plafonne la page à la limite demandée', async () => {
    const reponse = await enTantQue(
      app,
      'get',
      `${INGREDIENTS}?limite=${String(LIMITE_DEMANDEE)}`,
      moderateur,
    ).expect(HttpStatus.OK);

    expect(nomsDe(reponse)).toHaveLength(LIMITE_DEMANDEE);
    expect((reponse.body as { total: number }).total).toBeGreaterThan(
      LIMITE_DEMANDEE,
    );
  });

  it('refuse une limite absurde (400)', () =>
    enTantQue(
      app,
      'get',
      `${INGREDIENTS}?limite=${String(LIMITE_ABSURDE)}`,
      moderateur,
    ).expect(HttpStatus.BAD_REQUEST));
});
