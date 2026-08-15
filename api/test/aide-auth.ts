import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';
import { type DataSource } from 'typeorm';

import { JetonRafraichissement } from '../src/auth/entities/jeton-rafraichissement.entity';
import { hacherJeton } from '../src/auth/jetons.service';
import sourceDeDonnees from '../src/config/data-source';

import { creerAppDeTest } from './app-de-test';

export const COOKIE_ACCES = 'jeton_acces';
export const COOKIE_RAFRAICHISSEMENT = 'jeton_rafraichissement';
export const MOT_DE_PASSE = 'phrase-de-passe-assez-longue';

// Suffixe unique par exécution : `users.email` est UNIQUE, rejouer les tests avec le
// même email échouerait dès la deuxième fois.
const DEBUT_DECIMALES = 2;
const FIN_DECIMALES = 8;

export const marque = (prefixe: string) =>
  `${prefixe}-${Date.now()}-${Math.random()
    .toString()
    .slice(DEBUT_DECIMALES, FIN_DECIMALES)}`;

export function valeurCookie(
  reponse: request.Response,
  nom: string,
): string | undefined {
  const cookies = reponse.get('Set-Cookie') ?? [];
  return new RegExp(`${nom}=([^;]+)`).exec(cookies.join(';'))?.[1];
}

export function refreshDe(reponse: request.Response): string {
  const valeur = valeurCookie(reponse, COOKIE_RAFRAICHISSEMENT);
  if (valeur === undefined) {
    throw new Error("La réponse n'a pas déposé de jeton de rafraîchissement");
  }
  return valeur;
}

export const inscrire = (app: INestApplication<App>, email: string) =>
  request(app.getHttpServer())
    .post('/api/auth/inscription')
    .send({ email, motDePasse: MOT_DE_PASSE });

export const connecter = (app: INestApplication<App>, email: string) =>
  request(app.getHttpServer())
    .post('/api/auth/connexion')
    .send({ email, motDePasse: MOT_DE_PASSE });

export const rafraichir = (app: INestApplication<App>, refresh: string) =>
  request(app.getHttpServer())
    .post('/api/auth/rafraichissement')
    .set('Cookie', `${COOKIE_RAFRAICHISSEMENT}=${refresh}`);

// Retrouve la ligne exacte du jeton : on rejoue le même hachage que la production,
// donc aucun doute sur QUELLE ligne on vérifie.
export const jetonStocke = (source: DataSource, refresh: string) =>
  source
    .getRepository(JetonRafraichissement)
    .findOne({ where: { jetonHash: hacherJeton(refresh) } });

export interface ContexteAuth {
  app: INestApplication<App>;
  source: DataSource;
  email: string;
}

// Monte une application, ouvre la base et crée un compte de test — puis démonte le
// tout. Un fichier de spec PAR application : le compteur anti-bruteforce des routes
// d'auth (10 requêtes/minute) est propre à chaque instance.
export function contexteAuth(prefixe: string): ContexteAuth {
  const contexte = { email: `${marque(prefixe)}@exemple.test` } as ContexteAuth;

  beforeAll(async () => {
    contexte.app = await creerAppDeTest();
    contexte.source = await sourceDeDonnees.initialize();
    await inscrire(contexte.app, contexte.email).expect(HttpStatus.CREATED);
  });

  afterAll(async () => {
    await contexte.app.close();
    await contexte.source.destroy();
  });

  return contexte;
}
