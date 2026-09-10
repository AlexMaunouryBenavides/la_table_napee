// F2 — son propre compte (UC-09, UC-09b).
//
// `/moi` n'a pas d'identifiant dans l'URL : il n'y a rien à falsifier. Ce qui se juge
// ici, c'est donc la suite : le hash ne sort jamais, le rôle ne s'attribue pas, un
// changement de mot de passe tue les sessions, et une suppression ANONYMISE les avis
// au lieu de les effacer.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import {
  COOKIE_ACCES,
  MOT_DE_PASSE,
  accesDe,
  connecter,
  inscrire,
  marque,
  rafraichir,
  refreshDe,
} from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import {
  Avis,
  Nationalite,
  Recette,
  Utilisateur,
  sourceDeDonnees,
} from './entites';

const NOUVEAU_MOT_DE_PASSE = 'une-autre-phrase-de-passe-longue';
const MOI = '/api/utilisateurs/moi';
const MOI_MOT_DE_PASSE = `${MOI}/mot-de-passe`;

let source: DataSource;

interface Compte {
  email: string;
  acces: string;
  refresh: string;
}

async function ouvrirCompte(app: INestApplication<App>): Promise<Compte> {
  const email = `${marque('moi')}@exemple.test`;
  await inscrire(app, email).expect(HttpStatus.CREATED);

  const connexion = await connecter(app, email).expect(HttpStatus.OK);
  return { email, acces: accesDe(connexion), refresh: refreshDe(connexion) };
}

const avecJeton = (
  app: INestApplication<App>,
  methode: 'get' | 'patch' | 'delete',
  chemin: string,
  jeton: string,
) =>
  request(app.getHttpServer())
    [methode](chemin)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`);

beforeAll(async () => {
  source = await sourceDeDonnees.initialize();
});

afterAll(async () => {
  await source.destroy();
});

// Deux applications : les routes d'auth sont limitées à 10 requêtes/minute et le
// compteur est propre à chaque instance.
describe('Profil et mot de passe', () => {
  let app: INestApplication<App>;
  let compte: Compte;

  beforeAll(async () => {
    app = await creerAppDeTest();
    compte = await ouvrirCompte(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuse un visiteur anonyme (401)', () =>
    request(app.getHttpServer()).get(MOI).expect(HttpStatus.UNAUTHORIZED));

  it('renvoie le compte courant sans jamais exposer le hash', async () => {
    const reponse = await avecJeton(app, 'get', MOI, compte.acces).expect(
      HttpStatus.OK,
    );

    expect(reponse.body).toMatchObject({
      email: compte.email,
      role: 'utilisateur',
    });
    expect(reponse.body).not.toHaveProperty('motDePasseHash');
    expect(reponse.text).not.toContain('argon2');
  });

  it('change le pseudo', async () => {
    const pseudo = marque('pseudo');

    await avecJeton(app, 'patch', MOI, compte.acces)
      .send({ pseudo })
      .expect(HttpStatus.OK);

    const reponse = await avecJeton(app, 'get', MOI, compte.acces).expect(
      HttpStatus.OK,
    );
    expect(reponse.body).toMatchObject({ pseudo });
  });

  it('refuse un email déjà pris par un autre compte (409)', async () => {
    const autre = `${marque('autre')}@exemple.test`;
    await inscrire(app, autre).expect(HttpStatus.CREATED);

    await avecJeton(app, 'patch', MOI, compte.acces)
      .send({ email: autre })
      .expect(HttpStatus.CONFLICT);
  });

  it('refuse de s’attribuer un rôle (400)', () =>
    avecJeton(app, 'patch', MOI, compte.acces)
      .send({ role: 'admin' })
      .expect(HttpStatus.BAD_REQUEST));

  it('refuse un ancien mot de passe faux (400, pas 401)', () =>
    avecJeton(app, 'patch', MOI_MOT_DE_PASSE, compte.acces)
      .send({
        ancienMotDePasse: 'ce-n-est-pas-le-bon-mot-de-passe',
        nouveauMotDePasse: NOUVEAU_MOT_DE_PASSE,
      })
      .expect(HttpStatus.BAD_REQUEST));

  it('change le mot de passe : l’ancien ne connecte plus, le nouveau oui', async () => {
    await avecJeton(app, 'patch', MOI_MOT_DE_PASSE, compte.acces)
      .send({
        ancienMotDePasse: MOT_DE_PASSE,
        nouveauMotDePasse: NOUVEAU_MOT_DE_PASSE,
      })
      .expect(HttpStatus.NO_CONTENT);

    await connecter(app, compte.email).expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .post('/api/auth/connexion')
      .send({ email: compte.email, motDePasse: NOUVEAU_MOT_DE_PASSE })
      .expect(HttpStatus.OK);
  });

  it('a révoqué les sessions ouvertes avant le changement', () =>
    rafraichir(app, compte.refresh).expect(HttpStatus.UNAUTHORIZED));
});

describe('Suppression du compte', () => {
  let app: INestApplication<App>;
  let compte: Compte;
  let identifiantAvis: number;

  beforeAll(async () => {
    app = await creerAppDeTest();
    compte = await ouvrirCompte(app);

    const nationalite = await source
      .getRepository(Nationalite)
      .save({ nom: marque('nat') });

    const recette = await source.getRepository(Recette).save({
      titre: marque('recette'),
      description: 'description',
      image: 'https://exemple.test/i.jpg',
      video: null,
      difficulte: 'facile',
      typeRecette: 'plat',
      tempsPreparation: 10,
      tempsCuisson: 10,
      portions: 2,
      auteur: null,
      nationalite,
    });

    const avis = await request(app.getHttpServer())
      .post(`/api/recettes/${String(recette.id)}/avis`)
      .set('Cookie', `${COOKIE_ACCES}=${compte.acces}`)
      .send({ note: 5, commentaire: 'Très bon' })
      .expect(HttpStatus.CREATED);

    identifiantAvis = (avis.body as { id: number }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('supprime le compte (204)', async () => {
    await avecJeton(app, 'delete', MOI, compte.acces).expect(
      HttpStatus.NO_CONTENT,
    );

    expect(
      await source.getRepository(Utilisateur).countBy({ email: compte.email }),
    ).toBe(0);
  });

  it('laisse ses avis en place, anonymisés', async () => {
    const avis = await source.getRepository(Avis).findOne({
      where: { id: identifiantAvis },
      relations: { utilisateur: true },
    });

    expect(avis).not.toBeNull();
    expect(avis?.commentaire).toBe('Très bon');
    expect(avis?.utilisateur).toBeNull();
  });

  it('ne rafraîchit plus rien', () =>
    rafraichir(app, compte.refresh).expect(HttpStatus.UNAUTHORIZED));
});
