// F0 — les comptes d'EXEMPLE (données de confort, pas de référence).
//
// Sans eux, un clone frais n'a AUCUN administrateur : le back-office est inatteignable
// autrement qu'en passant par SQL. Le seed les pose, avec des mots de passe connus et
// écrits dans le README.
//
//   npm run test:e2e   (docker compose up -d + npm run migration:run:test au préalable)

import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource, In } from 'typeorm';

import { HachageMotDePasse } from '../src/auth/hachage-mot-de-passe.service';
import {
  COMPTES_EXEMPLE,
  MOT_DE_PASSE_EXEMPLE,
  semerUtilisateursExemple,
} from '../src/seeds/utilisateurs-exemple';

import { creerAppDeTest } from './app-de-test';
import { sourceDeDonnees, Utilisateur } from './entites';

const COURRIELS = COMPTES_EXEMPLE.map((compte) => compte.email);

let source: DataSource;
let app: INestApplication<App>;

const comptes = () =>
  source.getRepository(Utilisateur).findBy({ email: In(COURRIELS) });

beforeAll(async () => {
  // Même source que les autres specs : l'application de test en ouvre une de son
  // côté, celle-ci sert aux lectures et au nettoyage.
  source = await sourceDeDonnees.initialize();
  app = await creerAppDeTest();

  // Ces tests COMPTENT des lignes : ils partent d'une base sans comptes d'exemple,
  // sans dépendre de ce qu'une exécution précédente aurait laissé.
  await source.getRepository(Utilisateur).delete({ email: In(COURRIELS) });
});

afterAll(async () => {
  await source.getRepository(Utilisateur).delete({ email: In(COURRIELS) });
  await app.close();
  await source.destroy();
});

describe('Seed des comptes d’exemple', () => {
  it('crée un compte par rôle', async () => {
    await semerUtilisateursExemple(source);

    const crees = await comptes();

    expect(crees).toHaveLength(COMPTES_EXEMPLE.length);
    expect(crees.map((compte) => compte.role).sort()).toEqual([
      'admin',
      'moderateur',
      'utilisateur',
    ]);
  });

  it('rejoué, ne crée aucun doublon', async () => {
    await semerUtilisateursExemple(source);

    expect(await comptes()).toHaveLength(COMPTES_EXEMPLE.length);
  });

  it('ne laisse jamais le mot de passe lisible en base', async () => {
    await semerUtilisateursExemple(source);

    for (const compte of await comptes()) {
      expect(compte.motDePasseHash).not.toContain(MOT_DE_PASSE_EXEMPLE);
      expect(compte.motDePasseHash.startsWith('$argon2')).toBe(true);
    }
  });

  it('pose un hachage que l’API sait vérifier', async () => {
    // La seule garantie qui compte : un hash correct mais calculé autrement ne
    // laisserait personne se connecter.
    await semerUtilisateursExemple(source);

    const reponse = await request(app.getHttpServer())
      .post('/api/auth/connexion')
      .send({
        email: COMPTES_EXEMPLE[0]?.email,
        motDePasse: MOT_DE_PASSE_EXEMPLE,
      });

    expect(reponse.status).toBe(HttpStatus.OK);
  });

  it('saute un compte dont le PSEUDO est déjà pris ailleurs', async () => {
    // `nickname` est UNIQUE : un compte créé à la main sous le même pseudo ferait
    // échouer l'insertion si l'on ne regardait que l'e-mail.
    const compte = COMPTES_EXEMPLE[0];
    const hachage = app.get(HachageMotDePasse);

    await source.getRepository(Utilisateur).delete({ email: In(COURRIELS) });
    const intrus = await source.getRepository(Utilisateur).save({
      email: 'intrus@exemple.test',
      pseudo: compte?.pseudo,
      role: 'utilisateur' as const,
      motDePasseHash: await hachage.hacher('un-autre-mot-de-passe'),
    });

    const rapport = await semerUtilisateursExemple(source);

    expect(rapport.crees).toHaveLength(COMPTES_EXEMPLE.length - 1);
    expect(rapport.conflits).toEqual([compte?.email]);

    await source.getRepository(Utilisateur).delete({ id: intrus.id });
  });

  it('ne touche pas à un compte déjà là', async () => {
    // Un compte créé à la main ne doit être ni écrasé, ni rétrogradé.
    const email = COMPTES_EXEMPLE[0]?.email ?? '';
    const hachage = app.get(HachageMotDePasse);

    await source.getRepository(Utilisateur).delete({ email });
    await source.getRepository(Utilisateur).save({
      email,
      pseudo: 'Déjà là',
      role: 'utilisateur',
      motDePasseHash: await hachage.hacher('un-autre-mot-de-passe'),
    });

    await semerUtilisateursExemple(source);

    const inchange = await source
      .getRepository(Utilisateur)
      .findOneByOrFail({ email });

    expect(inchange.pseudo).toBe('Déjà là');
    expect(inchange.role).toBe('utilisateur');
  });
});
