// Vérifie ce qui se juge de l'extérieur : les statuts du contrat, les drapeaux des
// cookies, et le fait qu'aucun secret ne sorte ni ne soit stocké en clair.
//
// Budget : ces routes sont limitées à 10 requêtes/minute (anti-bruteforce), donc ce
// fichier reste volontairement sous cette barre.
//
//   npm run test:e2e   (docker compose up -d + migration:run:test au préalable)

import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import { JetonRafraichissement } from '../src/auth/entities/jeton-rafraichissement.entity';
import sourceDeDonnees from '../src/config/data-source';

import { creerAppDeTest } from './app-de-test';

const MOT_DE_PASSE = 'phrase-de-passe-assez-longue';
const LONGUEUR_UUID = 36;

let app: INestApplication<App>;
let source: DataSource;

const marque = () =>
  `auth-${Date.now()}-${Math.random().toString().slice(2, 8)}`;
const email = `${marque()}@exemple.test`;

const messageDe = (reponse: { body: unknown }) =>
  (reponse.body as { message: string }).message;

beforeAll(async () => {
  app = await creerAppDeTest();
  source = await sourceDeDonnees.initialize();
});

afterAll(async () => {
  await app.close();
  await source.destroy();
});

describe('Inscription', () => {
  it('crée le compte sans jamais renvoyer le hash du mot de passe', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/api/auth/inscription')
      .send({ email, motDePasse: MOT_DE_PASSE })
      .expect(201);

    expect(reponse.body).toMatchObject({ email, role: 'utilisateur' });
    expect(reponse.text).not.toContain('argon2');
    expect(reponse.body).not.toHaveProperty('motDePasseHash');
  });

  it('refuse un email déjà pris (409)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/inscription')
      .send({ email, motDePasse: MOT_DE_PASSE })
      .expect(409);
  });

  it('refuse un mot de passe trop court avant tout traitement (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/inscription')
      .send({ email: `${marque()}@exemple.test`, motDePasse: 'court' })
      .expect(400);
  });
});

describe('Connexion', () => {
  it('dépose deux cookies httpOnly + SameSite=Lax et stocke le refresh haché', async () => {
    const reponse = await request(app.getHttpServer())
      .post('/api/auth/connexion')
      .send({ email, motDePasse: MOT_DE_PASSE })
      .expect(200);

    const cookies = reponse.get('Set-Cookie') ?? [];
    expect(cookies).toHaveLength(2);
    for (const cookie of cookies) {
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    }

    const valeurEnClair = /jeton_rafraichissement=([^;]+)/.exec(
      cookies.join(';'),
    )?.[1];
    expect(valeurEnClair).toBeDefined();

    const stockes = await source
      .getRepository(JetonRafraichissement)
      .find({ relations: { utilisateur: true } });
    const jetons = stockes.filter(
      ({ utilisateur }) => utilisateur.email === email,
    );

    const [jeton] = jetons;
    expect(jetons).toHaveLength(1);
    expect(jeton?.jetonHash).not.toBe(valeurEnClair);
    expect(jeton?.familleId).toHaveLength(LONGUEUR_UUID);
  });

  it('renvoie le même 401 pour un mot de passe faux et pour un email inconnu', async () => {
    const mauvaisMotDePasse = await request(app.getHttpServer())
      .post('/api/auth/connexion')
      .send({ email, motDePasse: 'ce-nest-pas-le-bon-mot' })
      .expect(401);

    const emailInconnu = await request(app.getHttpServer())
      .post('/api/auth/connexion')
      .send({ email: `${marque()}@exemple.test`, motDePasse: MOT_DE_PASSE })
      .expect(401);

    // Deux messages différents diraient à un attaquant quels emails existent.
    expect(messageDe(mauvaisMotDePasse)).toBe(messageDe(emailInconnu));
  });
});
