// Feature avis (UC-02, UC-06, UC-07, UC-08, UC-14).
//
// Ce qui se juge ici est LE piège du projet : `DELETE /avis/:id` porte DEUX
// autorisations différentes — la propriété (c'est mon avis) et le rôle (je suis
// modérateur). Un guard ne peut pas trancher seul : il ne sait pas encore à qui
// appartient l'avis n°42. C'est donc le service qui décide, et c'est ici qu'on le
// vérifie (`design/routes-api.md` § 4.1).
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import { type RoleUtilisateur } from '@recipe/types';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import {
  COOKIE_ACCES,
  accesDe,
  connecter,
  enTantQue,
  inscrire,
  marque,
  promouvoir,
} from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import { Avis, Nationalite, Utilisateur, sourceDeDonnees } from './entites';
import { creerNationalite, creerRecette } from './fixtures';

const INEXISTANT = 999_999;
const NOTE = 4;
const NOTE_HORS_BORNES = 6;

let app: INestApplication<App>;
let source: DataSource;
let nationalite: Nationalite;

interface Compte {
  email: string;
  acces: string;
}

async function compteConnecte(role: RoleUtilisateur): Promise<Compte> {
  const email = `${marque(role)}@exemple.test`;
  await inscrire(app, email).expect(HttpStatus.CREATED);
  await promouvoir(source, email, role);

  return {
    email,
    acces: accesDe(await connecter(app, email).expect(HttpStatus.OK)),
  };
}

let auteur: Compte;
let autre: Compte;
let moderateur: Compte;

const deposer = (recetteId: number, jeton: string, note = NOTE) =>
  request(app.getHttpServer())
    .post(`/api/recettes/${String(recetteId)}/avis`)
    .set('Cookie', `${COOKIE_ACCES}=${jeton}`)
    .send({ note, commentaire: 'Un commentaire' });

// Chaque avis exige un couple (utilisateur, recette) neuf : la base impose l'unicité.
async function avisDe(compte: Compte): Promise<number> {
  const recette = await creerRecette(source, nationalite);
  const reponse = await deposer(recette.id, compte.acces).expect(
    HttpStatus.CREATED,
  );

  return (reponse.body as { id: number }).id;
}

const cheminAvis = (id: number) => `/api/avis/${String(id)}`;

beforeAll(async () => {
  app = await creerAppDeTest();
  source = await sourceDeDonnees.initialize();
  nationalite = await creerNationalite(source);

  auteur = await compteConnecte('utilisateur');
  autre = await compteConnecte('utilisateur');
  moderateur = await compteConnecte('moderateur');
});

afterAll(async () => {
  await app.close();
  await source.destroy();
});

describe('Lecture des avis', () => {
  it('est publique et porte son auteur', async () => {
    const recette = await creerRecette(source, nationalite);
    await deposer(recette.id, auteur.acces).expect(HttpStatus.CREATED);

    const reponse = await request(app.getHttpServer())
      .get(`/api/recettes/${String(recette.id)}/avis`)
      .expect(HttpStatus.OK);

    const avis = reponse.body as { utilisateur: { email: string } }[];
    expect(avis).toHaveLength(1);
    expect(avis[0]?.utilisateur.email).toBe(auteur.email);
    expect(reponse.text).not.toContain('argon2');
  });

  it('refuse une recette inexistante (404)', () =>
    request(app.getHttpServer())
      .get(`/api/recettes/${String(INEXISTANT)}/avis`)
      .expect(HttpStatus.NOT_FOUND));
});

describe('Dépôt d’un avis', () => {
  it('enregistre l’avis d’un utilisateur connecté (201)', async () => {
    const recette = await creerRecette(source, nationalite);

    const reponse = await deposer(recette.id, auteur.acces).expect(
      HttpStatus.CREATED,
    );
    expect(reponse.body).toMatchObject({ note: NOTE });
  });

  it('refuse un second avis sur la même recette (409)', async () => {
    const recette = await creerRecette(source, nationalite);

    await deposer(recette.id, auteur.acces).expect(HttpStatus.CREATED);
    await deposer(recette.id, auteur.acces).expect(HttpStatus.CONFLICT);
  });

  it('refuse une note hors bornes (400)', async () => {
    const recette = await creerRecette(source, nationalite);

    await deposer(recette.id, auteur.acces, NOTE_HORS_BORNES).expect(
      HttpStatus.BAD_REQUEST,
    );
  });

  it('refuse un visiteur anonyme (401)', async () => {
    const recette = await creerRecette(source, nationalite);

    await request(app.getHttpServer())
      .post(`/api/recettes/${String(recette.id)}/avis`)
      .send({ note: NOTE })
      .expect(HttpStatus.UNAUTHORIZED);
  });
});

// Modifier, c'est réécrire des propos : seul leur auteur en a le droit. Le rôle n'y
// change rien — un modérateur retire un avis, il ne le récrit pas.
describe('Modification : la propriété, et rien d’autre', () => {
  it('laisse l’auteur modifier son avis (200)', async () => {
    const id = await avisDe(auteur);

    const reponse = await enTantQue(app, 'patch', cheminAvis(id), auteur.acces)
      .send({ note: 2 })
      .expect(HttpStatus.OK);

    expect(reponse.body).toMatchObject({ note: 2 });
  });

  it('refuse un autre utilisateur (403)', async () => {
    const id = await avisDe(auteur);

    await enTantQue(app, 'patch', cheminAvis(id), autre.acces)
      .send({ note: 1 })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('refuse aussi un modérateur : supprimer oui, réécrire non (403)', async () => {
    const id = await avisDe(auteur);

    await enTantQue(app, 'patch', cheminAvis(id), moderateur.acces)
      .send({ note: 1 })
      .expect(HttpStatus.FORBIDDEN);
  });

  it('refuse un avis inexistant (404)', () =>
    enTantQue(app, 'patch', cheminAvis(INEXISTANT), auteur.acces)
      .send({ note: 1 })
      .expect(HttpStatus.NOT_FOUND));
});

// Même URL, deux raisons d'avoir le droit : la propriété (UC-08) OU le rôle (UC-14).
describe('Suppression : propriété OU rôle', () => {
  it('laisse l’auteur supprimer son avis (204)', async () => {
    const id = await avisDe(auteur);

    await enTantQue(app, 'delete', cheminAvis(id), auteur.acces).expect(
      HttpStatus.NO_CONTENT,
    );
    expect(await source.getRepository(Avis).countBy({ id })).toBe(0);
  });

  it('laisse un modérateur supprimer l’avis d’autrui (204)', async () => {
    const id = await avisDe(auteur);

    await enTantQue(app, 'delete', cheminAvis(id), moderateur.acces).expect(
      HttpStatus.NO_CONTENT,
    );
  });

  it('refuse un utilisateur simple sur l’avis d’autrui (403)', async () => {
    const id = await avisDe(auteur);

    await enTantQue(app, 'delete', cheminAvis(id), autre.acces).expect(
      HttpStatus.FORBIDDEN,
    );
  });
});

describe('Avis anonymisé', () => {
  it('n’appartient plus à personne : nul ne peut le modifier (403)', async () => {
    const id = await avisDe(auteur);

    // Le compte disparaît, l'avis reste avec un auteur à NULL. Sans le contrôle
    // explicite du `null`, `undefined === undefined` deviendrait une autorisation.
    await source.getRepository(Utilisateur).delete({ email: auteur.email });

    await enTantQue(app, 'patch', cheminAvis(id), autre.acces)
      .send({ note: 1 })
      .expect(HttpStatus.FORBIDDEN);
  });
});
