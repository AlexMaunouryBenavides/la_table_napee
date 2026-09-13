import { type RoleUtilisateur } from '@recipe/types';
import { type DataSource, In } from 'typeorm';

import { HachageMotDePasse } from '../auth/hachage-mot-de-passe.service';
import { Utilisateur } from '../utilisateurs/entities/utilisateur.entity';

/**
 * Le même mot de passe pour les trois : ce sont des comptes de DÉVELOPPEMENT, et
 * douze caractères — le minimum qu'exige `InscriptionDto`. Le script de seed
 * l'affiche en clair à la fin : un mot de passe de démonstration qu'on ne retrouve
 * pas ne sert à personne.
 */
export const MOT_DE_PASSE_EXEMPLE = 'Password123!';

type CompteExemple = { email: string; pseudo: string; role: RoleUtilisateur };

// L'e-mail est DÉTERMINISTE : c'est lui qui rend le seed idempotent, la colonne étant
// UNIQUE. Un e-mail tiré au hasard créerait un compte de plus à chaque exécution.
export const COMPTES_EXEMPLE: CompteExemple[] = [
  { email: 'admin@exemple.test', pseudo: 'Camille', role: 'admin' },
  { email: 'moderateur@exemple.test', pseudo: 'Thomas', role: 'moderateur' },
  { email: 'utilisateur@exemple.test', pseudo: 'Léa', role: 'utilisateur' },
];

/** Ce que le seed a fait, compte par compte. `conflits` est le cas qui mérite un
 *  message : ces comptes-là n'existent PAS, et on croirait le contraire. */
export type RapportComptes = {
  crees: string[];
  /** Déjà en base, laissés intacts — utilisables. */
  presents: string[];
  /** Sautés : leur pseudo appartient à un autre compte. Ils n'existent pas. */
  conflits: string[];
};

/**
 * Sans ces comptes, un clone frais n'a AUCUN administrateur : le back-office est
 * inatteignable autrement qu'en modifiant la base à la main.
 *
 * Le hachage passe par le service de l'API, jamais par un hash recopié : le jour où
 * les paramètres d'Argon2 changent, les comptes suivent.
 *
 * Les comptes qui existent déjà sont laissés INTACTS, y compris leur rôle : écraser
 * un compte qu'on a préparé à la main serait une surprise désagréable.
 */
export async function semerUtilisateursExemple(
  source: DataSource,
): Promise<RapportComptes> {
  const depot = source.getRepository(Utilisateur);

  // L'e-mail ET le pseudo sont UNIQUE en base : un compte d'exemple dont l'un des
  // deux est déjà pris — par un compte créé à la main, par exemple — est SAUTÉ. Ne
  // regarder que l'e-mail ferait échouer le seed sur un doublon de pseudo.
  const [parEmail, parPseudo] = await Promise.all([
    depot.findBy({ email: In(COMPTES_EXEMPLE.map(({ email }) => email)) }),
    depot.findBy({ pseudo: In(COMPTES_EXEMPLE.map(({ pseudo }) => pseudo)) }),
  ]);

  const emailsPris = new Set(parEmail.map((compte) => compte.email));
  const pseudosPris = new Set(parPseudo.map((compte) => compte.pseudo));

  const presents = COMPTES_EXEMPLE.filter(({ email }) => emailsPris.has(email));
  const conflits = COMPTES_EXEMPLE.filter(
    ({ email, pseudo }) => !emailsPris.has(email) && pseudosPris.has(pseudo),
  );
  const aCreer = COMPTES_EXEMPLE.filter(
    ({ email, pseudo }) => !emailsPris.has(email) && !pseudosPris.has(pseudo),
  );

  const rapport: RapportComptes = {
    crees: aCreer.map(({ email }) => email),
    presents: presents.map(({ email }) => email),
    conflits: conflits.map(({ email }) => email),
  };

  if (aCreer.length === 0) {
    return rapport;
  }

  const hachage = new HachageMotDePasse();
  const motDePasseHash = await hachage.hacher(MOT_DE_PASSE_EXEMPLE);

  await depot.save(
    aCreer.map((compte) => depot.create({ ...compte, motDePasseHash })),
  );

  return rapport;
}
