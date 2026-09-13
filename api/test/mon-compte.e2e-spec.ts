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
  enTantQue,
  inscrire,
  marque,
  rafraichir,
  refreshDe,
} from './aide-auth';
import { creerAppDeTest } from './app-de-test';
import { Avis, Utilisateur, sourceDeDonnees } from './entites';
import { creerNationalite, creerRecette } from './fixtures';

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
    const reponse = await enTantQue(app, 'get', MOI, compte.acces).expect(
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

    await enTantQue(app, 'patch', MOI, compte.acces)
      .send({ pseudo })
      .expect(HttpStatus.OK);

    const reponse = await enTantQue(app, 'get', MOI, compte.acces).expect(
      HttpStatus.OK,
    );
    expect(reponse.body).toMatchObject({ pseudo });
  });

  it('refuse un email déjà pris par un autre compte (409)', async () => {
    const autre = `${marque('autre')}@exemple.test`;
    await inscrire(app, autre).expect(HttpStatus.CREATED);

    await enTantQue(app, 'patch', MOI, compte.acces)
      .send({ email: autre })
      .expect(HttpStatus.CONFLICT);
  });

  it('refuse de s’attribuer un rôle (400)', () =>
    enTantQue(app, 'patch', MOI, compte.acces)
      .send({ role: 'admin' })
      .expect(HttpStatus.BAD_REQUEST));

  it('refuse un ancien mot de passe faux (400, pas 401)', () =>
    enTantQue(app, 'patch', MOI_MOT_DE_PASSE, compte.acces)
      .send({
        ancienMotDePasse: 'ce-n-est-pas-le-bon-mot-de-passe',
        nouveauMotDePasse: NOUVEAU_MOT_DE_PASSE,
      })
      .expect(HttpStatus.BAD_REQUEST));

  it('change le mot de passe : l’ancien ne connecte plus, le nouveau oui', async () => {
    await enTantQue(app, 'patch', MOI_MOT_DE_PASSE, compte.acces)
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

// Changer son mot de passe, c'est souvent réagir à une compromission : les AUTRES
// appareils tombent, mais celui qui vient de prouver l'ancien mot de passe reste
// connecté — sinon on le déconnecte sans prévenir au prochain rafraîchissement.
describe('Sessions après un changement de mot de passe', () => {
  let app: INestApplication<App>;
  let compte: Compte;
  let autreAppareil: string;
  let nouveauRefresh: string | undefined;

  beforeAll(async () => {
    app = await creerAppDeTest();
    compte = await ouvrirCompte(app);
    autreAppareil = refreshDe(
      await connecter(app, compte.email).expect(HttpStatus.OK),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('ne révoque rien et ne pose aucun cookie si l’ancien mot de passe est faux', async () => {
    const reponse = await enTantQue(
      app,
      'patch',
      MOI_MOT_DE_PASSE,
      compte.acces,
    )
      .send({
        ancienMotDePasse: 'ce-n-est-pas-le-bon-mot-de-passe',
        nouveauMotDePasse: NOUVEAU_MOT_DE_PASSE,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(reponse.get('Set-Cookie')).toBeUndefined();
    const encoreValide = await rafraichir(app, autreAppareil).expect(
      HttpStatus.OK,
    );
    autreAppareil = refreshDe(encoreValide);
  });

  it('rouvre une session sur l’appareil courant : nouveaux cookies posés', async () => {
    const reponse = await enTantQue(
      app,
      'patch',
      MOI_MOT_DE_PASSE,
      compte.acces,
    )
      .send({
        ancienMotDePasse: MOT_DE_PASSE,
        nouveauMotDePasse: NOUVEAU_MOT_DE_PASSE,
      })
      .expect(HttpStatus.NO_CONTENT);

    // Le jeton d'ACCÈS ne prouve rien : même identifiant, même rôle, même seconde, il
    // peut sortir identique. Le jeton de rafraîchissement, lui, est tiré au hasard.
    expect(accesDe(reponse)).toBeTruthy();
    nouveauRefresh = refreshDe(reponse);
    expect(nouveauRefresh).not.toBe(compte.refresh);
  });

  it('refuse l’ancien jeton de rafraîchissement de l’appareil courant', () =>
    rafraichir(app, compte.refresh).expect(HttpStatus.UNAUTHORIZED));

  it('déconnecte l’autre appareil', () =>
    rafraichir(app, autreAppareil).expect(HttpStatus.UNAUTHORIZED));

  it('laisse le nouveau jeton de rafraîchissement fonctionner', () =>
    rafraichir(app, nouveauRefresh ?? '').expect(HttpStatus.OK));
});

describe('Suppression du compte', () => {
  let app: INestApplication<App>;
  let compte: Compte;
  let identifiantAvis: number;

  beforeAll(async () => {
    app = await creerAppDeTest();
    compte = await ouvrirCompte(app);

    const recette = await creerRecette(source, await creerNationalite(source));

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
    await enTantQue(app, 'delete', MOI, compte.acces).expect(
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
