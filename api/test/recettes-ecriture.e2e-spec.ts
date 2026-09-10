// F1 — écriture des recettes (UC-11, UC-12, UC-13).
//
// Trois choses ne se voient QUE contre une vraie base : la réutilisation des
// ingrédients, l'annulation complète en cas d'échec, et les cascades de suppression.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import { COOKIE_ACCES, compteAvecRole, marque } from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import {
  Avis,
  Composition,
  Etape,
  Ingredient,
  Nationalite,
  Recette,
  sourceDeDonnees,
} from './entites';

const INEXISTANTE = 999_999;
const NATIONALITE_INEXISTANTE = 999_999;

let app: INestApplication<App>;
let source: DataSource;
let nationalite: Nationalite;

const jetons: Record<'moderateur' | 'admin' | 'utilisateur', string> = {
  moderateur: '',
  admin: '',
  utilisateur: '',
};

interface IngredientSaisi {
  nom: string;
  quantite?: number | null;
  unite?: string;
}

function corps(partiel: Record<string, unknown> = {}) {
  return {
    titre: marque('recette'),
    description: 'Une description honnête.',
    image: 'https://exemple.test/image.jpg',
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 2,
    nationaliteId: nationalite.id,
    ingredients: [{ nom: marque('ingredient'), quantite: 2, unite: 'piece' }],
    etapes: ['Couper les légumes', 'Cuire à feu doux'],
    ...partiel,
  };
}

const poster = (jeton: string, donnees: Record<string, unknown>) =>
  request(app.getHttpServer())
    .post('/api/recettes')
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`)
    .send(donnees);

const modifier = (
  jeton: string,
  id: number,
  donnees: Record<string, unknown>,
) =>
  request(app.getHttpServer())
    .patch(`/api/recettes/${String(id)}`)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`)
    .send(donnees);

const supprimer = (jeton: string, id: number) =>
  request(app.getHttpServer())
    .delete(`/api/recettes/${String(id)}`)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`);

const lire = (id: number) =>
  request(app.getHttpServer()).get(`/api/recettes/${String(id)}`);

const idDe = (reponse: request.Response) => (reponse.body as { id: number }).id;

beforeAll(async () => {
  app = await creerAppDeTest();
  source = await sourceDeDonnees.initialize();
  nationalite = await source
    .getRepository(Nationalite)
    .save({ nom: marque('nationalite') });

  jetons.moderateur = (await compteAvecRole(app, source, 'moderateur')).acces;
  jetons.admin = (await compteAvecRole(app, source, 'admin')).acces;
  jetons.utilisateur = (await compteAvecRole(app, source, 'utilisateur')).acces;
});

afterAll(async () => {
  await app.close();
  await source.destroy();
});

describe('Qui peut écrire une recette', () => {
  it('refuse un visiteur anonyme (401)', () =>
    request(app.getHttpServer())
      .post('/api/recettes')
      .send(corps())
      .expect(HttpStatus.UNAUTHORIZED));

  it('refuse un utilisateur simple (403)', () =>
    poster(jetons.utilisateur, corps()).expect(HttpStatus.FORBIDDEN));

  it('accepte un modérateur (201)', () =>
    poster(jetons.moderateur, corps()).expect(HttpStatus.CREATED));

  it('accepte un admin, qui hérite du modérateur (201)', () =>
    poster(jetons.admin, corps()).expect(HttpStatus.CREATED));
});

describe('Création', () => {
  it('refuse une difficulté hors énumération (400)', () =>
    poster(jetons.moderateur, corps({ difficulte: 'impossible' })).expect(
      HttpStatus.BAD_REQUEST,
    ));

  it('enregistre auteur, étapes numérotées et compositions', async () => {
    const creation = await poster(jetons.moderateur, corps()).expect(
      HttpStatus.CREATED,
    );

    const detail = (await lire(idDe(creation)).expect(HttpStatus.OK))
      .body as Recette;

    expect(detail.auteur).not.toBeNull();
    expect(detail.etapes.map((etape) => etape.numero)).toEqual([1, 2]);
    expect(detail.etapes[0]?.contenu).toBe('Couper les légumes');
    expect(detail.compositions).toHaveLength(1);
    expect(detail.compositions[0]?.unite).toBe('piece');
  });

  it('refuse un titre déjà pris (409, pas 500)', async () => {
    const donnees = corps();
    await poster(jetons.moderateur, donnees).expect(HttpStatus.CREATED);

    await poster(jetons.moderateur, {
      ...corps(),
      titre: donnees.titre,
    }).expect(HttpStatus.CONFLICT);
  });

  it('crée l’ingrédient inconnu et réutilise celui qui existe déjà', async () => {
    const nom = marque('tomate');
    const ingredients: IngredientSaisi[] = [
      { nom, quantite: 3, unite: 'piece' },
    ];

    await poster(jetons.moderateur, corps({ ingredients })).expect(
      HttpStatus.CREATED,
    );
    await poster(jetons.moderateur, corps({ ingredients })).expect(
      HttpStatus.CREATED,
    );

    const lignes = await source.getRepository(Ingredient).findBy({ nom });
    expect(lignes).toHaveLength(1);
  });

  it('refuse une nationalité inexistante (400)', () =>
    poster(
      jetons.moderateur,
      corps({ nationaliteId: NATIONALITE_INEXISTANTE }),
    ).expect(HttpStatus.BAD_REQUEST));

  it('n’a rien laissé derrière après cet échec (transaction annulée)', async () => {
    const nom = marque('orpheline');

    await poster(
      jetons.moderateur,
      corps({
        nationaliteId: NATIONALITE_INEXISTANTE,
        ingredients: [{ nom, quantite: 1, unite: 'piece' }],
      }),
    ).expect(HttpStatus.BAD_REQUEST);

    // L'ingrédient est créé AVANT la recette : sans transaction, il survivrait.
    expect(await source.getRepository(Ingredient).findBy({ nom })).toHaveLength(
      0,
    );
  });
});

describe('Modification', () => {
  it('ne touche que les champs envoyés', async () => {
    const donnees = corps();
    const creation = await poster(jetons.moderateur, donnees).expect(
      HttpStatus.CREATED,
    );

    await modifier(jetons.moderateur, idDe(creation), {
      tempsCuisson: 45,
    }).expect(HttpStatus.OK);

    const detail = (await lire(idDe(creation)).expect(HttpStatus.OK))
      .body as Recette;

    expect(detail.tempsCuisson).toBe(45);
    expect(detail.titre).toBe(donnees.titre);
    expect(detail.etapes).toHaveLength(2);
  });

  it('refuse un titre déjà pris (409)', async () => {
    const premiere = await poster(jetons.moderateur, corps()).expect(
      HttpStatus.CREATED,
    );
    const seconde = await poster(jetons.moderateur, corps()).expect(
      HttpStatus.CREATED,
    );

    await modifier(jetons.moderateur, idDe(seconde), {
      titre: (premiere.body as Recette).titre,
    }).expect(HttpStatus.CONFLICT);
  });

  it('refuse une recette inexistante (404)', () =>
    modifier(jetons.moderateur, INEXISTANTE, { portions: 4 }).expect(
      HttpStatus.NOT_FOUND,
    ));

  it('refuse un utilisateur simple (403)', async () => {
    const creation = await poster(jetons.moderateur, corps()).expect(
      HttpStatus.CREATED,
    );

    await modifier(jetons.utilisateur, idDe(creation), {
      portions: 4,
    }).expect(HttpStatus.FORBIDDEN);
  });
});

describe('Suppression', () => {
  it('emporte compositions, étapes et avis (204)', async () => {
    const creation = await poster(jetons.moderateur, corps()).expect(
      HttpStatus.CREATED,
    );
    const id = idDe(creation);

    await request(app.getHttpServer())
      .post(`/api/recettes/${String(id)}/avis`)
      .set('Cookie', `${COOKIE_ACCES}=${jetons.utilisateur}`)
      .send({ note: 4 })
      .expect(HttpStatus.CREATED);

    await supprimer(jetons.moderateur, id).expect(HttpStatus.NO_CONTENT);

    expect(
      await source.getRepository(Composition).countBy({ recette: { id } }),
    ).toBe(0);
    expect(await source.getRepository(Etape).countBy({ recette: { id } })).toBe(
      0,
    );
    expect(await source.getRepository(Avis).countBy({ recette: { id } })).toBe(
      0,
    );
  });

  it('épargne les entités partagées : ingrédients et nationalité', async () => {
    const nom = marque('partage');
    const creation = await poster(
      jetons.moderateur,
      corps({ ingredients: [{ nom, quantite: 1, unite: 'g' }] }),
    ).expect(HttpStatus.CREATED);

    await supprimer(jetons.moderateur, idDe(creation)).expect(
      HttpStatus.NO_CONTENT,
    );

    expect(await source.getRepository(Ingredient).findBy({ nom })).toHaveLength(
      1,
    );
    expect(
      await source.getRepository(Nationalite).countBy({ id: nationalite.id }),
    ).toBe(1);
  });

  it('refuse une recette inexistante (404)', () =>
    supprimer(jetons.moderateur, INEXISTANTE).expect(HttpStatus.NOT_FOUND));
});
