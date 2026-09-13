import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { seConnecter, sInscrire } from '../acces-api/authentification';
import { ErreurApi } from '../acces-api/erreur-api';
import { sessionAChange } from '../requetes/session';

import type { EchecAuth } from './ecran-connexion';

const NON_AUTHENTIFIE = 401;

// L'API répond « Identifiants invalides », ce qui est juste mais sec. C'est la SEULE
// réécriture de message du client : une exception nommée, pas une couche de
// traduction. Et elle ne désigne toujours aucun des deux champs.
const IDENTIFIANTS_REFUSES = 'E-mail ou mot de passe incorrect.';

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);

  return typeof valeur === 'string' ? valeur.trim() : '';
}

function echecDe(erreur: unknown, surIdentifiants: boolean): EchecAuth {
  // Une panne de code n'est pas un échec d'écran : elle remonte telle quelle.
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return {
    statut: erreur.statut,
    message:
      surIdentifiants && erreur.statut === NON_AUTHENTIFIE
        ? IDENTIFIANTS_REFUSES
        : erreur.message,
    details: erreur.details,
  };
}

/** Un refus revient comme DONNÉE (`EchecAuth`), `null` veut dire « c'est fait ». */
async function executerConnexion(donnees: FormData): Promise<EchecAuth | null> {
  try {
    await seConnecter(texte(donnees, 'email'), texte(donnees, 'motDePasse'));
    return null;
  } catch (erreur) {
    return echecDe(erreur, true);
  }
}

async function executerInscription(
  donnees: FormData,
): Promise<EchecAuth | null> {
  const pseudo = texte(donnees, 'pseudo');

  try {
    await sInscrire({
      email: texte(donnees, 'email'),
      motDePasse: texte(donnees, 'motDePasse'),
      ...(pseudo === '' ? {} : { pseudo }),
    });
    return null;
  } catch (erreur) {
    return echecDe(erreur, false);
  }
}

/** Succès : on part pour l'accueil, puis la session est relue — l'en-tête connaît
 *  alors le nouvel utilisateur sans qu'on la recopie. */
export function useConnexion() {
  const naviguer = useNavigate();

  return useMutation({
    mutationFn: executerConnexion,
    onSuccess: async (echec) => {
      if (echec === null) {
        await naviguer('/');
        await sessionAChange();
      }
    },
  });
}

/** L'API sépare « créer un compte » de « ouvrir une session ». On ne maquille pas
 *  cette séparation : le compte créé, on envoie se connecter. */
export function useInscription() {
  const naviguer = useNavigate();

  return useMutation({
    mutationFn: executerInscription,
    onSuccess: async (echec) => {
      if (echec === null) {
        await naviguer('/connexion?inscrit=1');
      }
    },
  });
}
