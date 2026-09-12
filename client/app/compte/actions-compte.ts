import {
  changerMotDePasse,
  modifierProfil,
  type ProfilAModifier,
  supprimerCompte,
} from '../acces-api/compte';
import { ErreurApi } from '../acces-api/erreur-api';

/** Trois formulaires sur une page, donc trois actions : une erreur de mot de passe
 *  n'a aucune raison d'effacer la saisie du profil. */
type ZoneCompte = 'profil' | 'mot-de-passe' | 'suppression';

export type ResultatCompte = {
  zone: ZoneCompte;
  succes: boolean;
  /** Ce qui n'appartient à aucun champ : panne, conflit, refus global. */
  message?: string;
  /** Les erreurs rattachées à un champ, quelle que soit leur origine. */
  champs?: Record<string, string>;
  /** Jamais un mot de passe : ce résultat vit dans l'état du routeur, donc dans
   *  l'historique de navigation. */
  saisie?: { email?: string; pseudo?: string };
};

const REQUETE_INVALIDE = 400;
const CONFIRMATION_DIFFERENTE =
  'Cette saisie ne correspond pas au nouveau mot de passe.';

function brut(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);

  return typeof valeur === 'string' ? valeur : '';
}

/** Les mots de passe ne passent JAMAIS par ici : un espace de début ou de fin y est
 *  un caractère comme un autre. */
function texte(donnees: FormData, champ: string): string {
  return brut(donnees, champ).trim();
}

function erreurApi(erreur: unknown): ErreurApi {
  // Une panne de code n'est pas un échec d'écran : elle remonte à l'ErrorBoundary.
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return erreur;
}

/** `class-validator` préfixe chaque message du nom de son champ
 *  (« email must be an email ») : c'est ce qui permet de l'afficher au bon endroit. */
function champsDepuisDetails(details?: string[]): Record<string, string> {
  const champs: Record<string, string> = {};

  for (const detail of details ?? []) {
    const [nom] = detail.split(' ');

    if (nom !== undefined && nom !== '') {
      champs[nom] ??= detail;
    }
  }

  return champs;
}

function enEchec(
  zone: ZoneCompte,
  erreur: ErreurApi,
  champs: Record<string, string>,
): ResultatCompte {
  // Un message rattaché à un champ ne s'affiche pas AUSSI en bandeau : le lire deux
  // fois ne dit pas deux choses.
  return Object.keys(champs).length > 0
    ? { zone, succes: false, champs }
    : { zone, succes: false, message: erreur.message };
}

async function executerProfil(donnees: FormData): Promise<ResultatCompte> {
  const email = texte(donnees, 'email');
  const pseudo = texte(donnees, 'pseudo');
  // Un pseudo vide veut dire « je n'y touche pas » : l'API en exige 3 caractères et
  // n'offre aucun moyen d'en effacer un.
  const corps: ProfilAModifier = {
    email,
    ...(pseudo === '' ? {} : { pseudo }),
  };

  try {
    await modifierProfil(corps);

    return { zone: 'profil', succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    return {
      ...enEchec('profil', erreur, champsDepuisDetails(erreur.details)),
      saisie: { email, pseudo },
    };
  }
}

async function executerMotDePasse(donnees: FormData): Promise<ResultatCompte> {
  const nouveau = brut(donnees, 'nouveauMotDePasse');

  if (nouveau !== brut(donnees, 'confirmation')) {
    return {
      zone: 'mot-de-passe',
      succes: false,
      champs: { confirmation: CONFIRMATION_DIFFERENTE },
    };
  }

  try {
    await changerMotDePasse(brut(donnees, 'ancienMotDePasse'), nouveau);

    return { zone: 'mot-de-passe', succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);
    const champs = champsDepuisDetails(erreur.details);

    // Un 400 sans détail de validation ne peut venir que de l'ancien mot de passe :
    // c'est la seule règle que la route vérifie elle-même, et elle répond 400 et non
    // 401 parce qu'on est bien authentifié.
    if (
      erreur.statut === REQUETE_INVALIDE &&
      Object.keys(champs).length === 0
    ) {
      champs.ancienMotDePasse = erreur.message;
    }

    return enEchec('mot-de-passe', erreur, champs);
  }
}

async function executerSuppression(): Promise<ResultatCompte> {
  try {
    await supprimerCompte();

    return { zone: 'suppression', succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    return enEchec('suppression', erreur, {});
  }
}

/** Le seul point d'entrée de l'écran : c'est `intention` qui dit quel formulaire a
 *  été envoyé. */
export function executerActionCompte(
  donnees: FormData,
): Promise<ResultatCompte> {
  switch (texte(donnees, 'intention')) {
    case 'profil':
      return executerProfil(donnees);
    case 'mot-de-passe':
      return executerMotDePasse(donnees);
    default:
      return executerSuppression();
  }
}
