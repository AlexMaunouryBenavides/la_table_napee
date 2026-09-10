// F3 — administration des utilisateurs (UC-16).
//
// C'est l'opération la plus dangereuse de l'API : elle distribue le pouvoir. D'où la
// règle anti-auto-rétrogradation — sans elle, une seule requête rend l'administration
// définitivement inaccessible (`design/routes-api.md` § 4.4).
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import { type RoleUtilisateur } from '@recipe/types';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import {
  accesDe,
  connecter,
  enTantQue,
  inscrire,
  marque,
  promouvoir,
} from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import { Utilisateur, sourceDeDonnees } from './entites';

const UTILISATEURS = '/api/utilisateurs';
const INCONNU = '00000000-0000-4000-8000-000000000000';

let source: DataSource;

interface Compte {
  id: string;
  email: string;
  acces: string;
}

// « Le dernier admin » ne veut rien dire si d'autres specs en ont laissé traîner :
// on repart d'une base sans aucun administrateur.
async function neutraliserAdmins(): Promise<void> {
  await source
    .getRepository(Utilisateur)
    .update({ role: 'admin' }, { role: 'utilisateur' });
}

async function inscrit(
  app: INestApplication<App>,
  prefixe: string,
): Promise<string> {
  const email = `${marque(prefixe)}@exemple.test`;
  await inscrire(app, email).expect(HttpStatus.CREATED);
  return email;
}

async function identifiantDe(email: string): Promise<string> {
  const utilisateur = await source
    .getRepository(Utilisateur)
    .findOneByOrFail({ email });
  return utilisateur.id;
}

// Inscrit, pose le rôle en base, puis se connecte : le jeton porte alors ce rôle.
async function compteConnecte(
  app: INestApplication<App>,
  role: RoleUtilisateur,
): Promise<Compte> {
  const email = await inscrit(app, role);
  await promouvoir(source, email, role);

  return {
    id: await identifiantDe(email),
    email,
    acces: accesDe(await connecter(app, email).expect(HttpStatus.OK)),
  };
}

beforeAll(async () => {
  source = await sourceDeDonnees.initialize();
});

afterAll(async () => {
  await source.destroy();
});

// Une application par bloc : les routes d'auth sont limitées à 10 requêtes/minute et
// le compteur est propre à chaque instance.
describe('Liste et changement de rôle', () => {
  let app: INestApplication<App>;
  let admin: Compte;
  let autreAdmin: Compte;
  let moderateur: Compte;
  let cible: string;

  beforeAll(async () => {
    app = await creerAppDeTest();
    await neutraliserAdmins();

    admin = await compteConnecte(app, 'admin');
    autreAdmin = await compteConnecte(app, 'admin');
    moderateur = await compteConnecte(app, 'moderateur');
    cible = await identifiantDe(await inscrit(app, 'cible'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuse un visiteur anonyme (401)', () =>
    request(app.getHttpServer())
      .get(UTILISATEURS)
      .expect(HttpStatus.UNAUTHORIZED));

  it('refuse un modérateur : c’est admin qui est exigé (403)', () =>
    enTantQue(app, 'get', UTILISATEURS, moderateur.acces).expect(
      HttpStatus.FORBIDDEN,
    ));

  it('renvoie une page enveloppée, sans aucun hash', async () => {
    const reponse = await enTantQue(
      app,
      'get',
      UTILISATEURS,
      admin.acces,
    ).expect(HttpStatus.OK);

    expect(reponse.body).toMatchObject({ page: 1, limite: 20 });
    expect(
      (reponse.body as { donnees: unknown[] }).donnees.length,
    ).toBeGreaterThan(0);
    expect((reponse.body as { total: number }).total).toBeGreaterThan(0);
    expect(reponse.text).not.toContain('argon2');
  });

  it('promeut un utilisateur en modérateur (200)', async () => {
    await enTantQue(app, 'patch', `${UTILISATEURS}/${cible}/role`, admin.acces)
      .send({ role: 'moderateur' })
      .expect(HttpStatus.OK);

    const apres = await source
      .getRepository(Utilisateur)
      .findOneByOrFail({ id: cible });
    expect(apres.role).toBe('moderateur');
  });

  it('refuse un rôle inconnu (400)', () =>
    enTantQue(app, 'patch', `${UTILISATEURS}/${cible}/role`, admin.acces)
      .send({ role: 'super-admin' })
      .expect(HttpStatus.BAD_REQUEST));

  it('refuse un compte inexistant (404)', () =>
    enTantQue(app, 'patch', `${UTILISATEURS}/${INCONNU}/role`, admin.acces)
      .send({ role: 'moderateur' })
      .expect(HttpStatus.NOT_FOUND));

  it('interdit à un admin de se retirer son propre rôle (409)', () =>
    enTantQue(app, 'patch', `${UTILISATEURS}/${admin.id}/role`, admin.acces)
      .send({ role: 'utilisateur' })
      .expect(HttpStatus.CONFLICT));

  // La règle vise le DERNIER admin, pas tout admin : tant qu'il en reste un autre,
  // la rétrogradation est légitime.
  it('autorise la rétrogradation d’un autre admin quand il en reste un (200)', () =>
    enTantQue(
      app,
      'patch',
      `${UTILISATEURS}/${autreAdmin.id}/role`,
      admin.acces,
    )
      .send({ role: 'utilisateur' })
      .expect(HttpStatus.OK));
});

describe('Suppression par un administrateur', () => {
  let app: INestApplication<App>;
  let admin: Compte;
  let victime: string;
  let moi: Compte;

  beforeAll(async () => {
    app = await creerAppDeTest();
    await neutraliserAdmins();

    admin = await compteConnecte(app, 'admin');
    victime = await identifiantDe(await inscrit(app, 'victime'));
    moi = await compteConnecte(app, 'utilisateur');
  });

  afterAll(async () => {
    await app.close();
  });

  it('supprime un compte (204)', async () => {
    await enTantQue(
      app,
      'delete',
      `${UTILISATEURS}/${victime}`,
      admin.acces,
    ).expect(HttpStatus.NO_CONTENT);

    expect(
      await source.getRepository(Utilisateur).countBy({ id: victime }),
    ).toBe(0);
  });

  it('refuse un compte inexistant (404)', () =>
    enTantQue(app, 'delete', `${UTILISATEURS}/${INCONNU}`, admin.acces).expect(
      HttpStatus.NOT_FOUND,
    ));

  it('refuse de supprimer le dernier admin (409)', () =>
    enTantQue(app, 'delete', `${UTILISATEURS}/${admin.id}`, admin.acces).expect(
      HttpStatus.CONFLICT,
    ));

  // `/moi` doit rester capté par sa propre route, pas par `:id`.
  it('laisse `/utilisateurs/moi` supprimer son propre compte', async () => {
    await enTantQue(app, 'delete', `${UTILISATEURS}/moi`, moi.acces).expect(
      HttpStatus.NO_CONTENT,
    );

    expect(
      await source.getRepository(Utilisateur).countBy({ id: moi.id }),
    ).toBe(0);
  });
});
