import { useMutation } from '@tanstack/react-query';

import {
  changerMotDePasse,
  modifierProfil,
  type ProfilAModifier,
  supprimerCompte,
} from '../acces-api/compte';
import { ErreurApi } from '../acces-api/erreur-api';
import type { EnvoiFormulaire } from '../composants/envoi-formulaire';
import { sessionAChange } from '../requetes/session';

/** Trois formulaires sur une page, donc trois envois indépendants : une erreur de mot
 *  de passe n'a aucune raison de toucher au profil. */
export type ResultatCompte = {
  succes: boolean;
  /** Ce qui n'appartient à aucun champ : panne, conflit, refus global. */
  message?: string;
  /** Les erreurs rattachées à un champ, quelle que soit leur origine. */
  champs?: Record<string, string>;
};

/** L'état d'UN formulaire du compte, tel que l'écran l'affiche. */
export type EnvoiCompte = {
  resultat: ResultatCompte | null;
  envoiEnCours: boolean;
  surEnvoi: EnvoiFormulaire;
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
  // Une panne de code n'est pas un échec d'écran : elle remonte telle quelle.
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
  erreur: ErreurApi,
  champs: Record<string, string>,
): ResultatCompte {
  // Un message rattaché à un champ ne s'affiche pas AUSSI en bandeau : le lire deux
  // fois ne dit pas deux choses.
  return Object.keys(champs).length > 0
    ? { succes: false, champs }
    : { succes: false, message: erreur.message };
}

export async function executerProfil(
  donnees: FormData,
): Promise<ResultatCompte> {
  const pseudo = texte(donnees, 'pseudo');
  // Un pseudo vide veut dire « je n'y touche pas » : l'API en exige 3 caractères et
  // n'offre aucun moyen d'en effacer un.
  const corps: ProfilAModifier = {
    email: texte(donnees, 'email'),
    ...(pseudo === '' ? {} : { pseudo }),
  };

  try {
    await modifierProfil(corps);
    return { succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);
    return enEchec(erreur, champsDepuisDetails(erreur.details));
  }
}

export async function executerMotDePasse(
  donnees: FormData,
): Promise<ResultatCompte> {
  const nouveau = brut(donnees, 'nouveauMotDePasse');

  if (nouveau !== brut(donnees, 'confirmation')) {
    return { succes: false, champs: { confirmation: CONFIRMATION_DIFFERENTE } };
  }

  try {
    await changerMotDePasse(brut(donnees, 'ancienMotDePasse'), nouveau);
    return { succes: true };
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

    return enEchec(erreur, champs);
  }
}

export async function executerSuppression(): Promise<ResultatCompte> {
  try {
    await supprimerCompte();
    return { succes: true };
  } catch (leve) {
    return enEchec(erreurApi(leve), {});
  }
}

/**
 * Un succès relit la session : l'en-tête connaît le nouveau pseudo — ou la fin de la
 * session après une suppression — sans qu'on le recopie.
 */
export function useEnvoiCompte(
  executer: (donnees: FormData) => Promise<ResultatCompte>,
): EnvoiCompte {
  const mutation = useMutation({
    mutationFn: executer,
    onSuccess: async (resultat) => {
      if (resultat.succes) {
        await sessionAChange();
      }
    },
  });

  return {
    resultat: mutation.data ?? null,
    envoiEnCours: mutation.isPending,
    surEnvoi: (donnees) => {
      mutation.mutate(donnees);
    },
  };
}
