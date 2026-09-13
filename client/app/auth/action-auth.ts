import { seConnecter, sInscrire } from '../acces-api/authentification';
import { ErreurApi } from '../acces-api/erreur-api';

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

function echecDe(
  erreur: unknown,
  saisie: EchecAuth['saisie'],
  surIdentifiants: boolean,
): EchecAuth {
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  const message =
    surIdentifiants && erreur.statut === NON_AUTHENTIFIE
      ? IDENTIFIANTS_REFUSES
      : erreur.message;

  return {
    statut: erreur.statut,
    message,
    details: erreur.details,
    // Le mot de passe n'est JAMAIS renvoyé à l'écran : le conserver le ferait vivre
    // dans l'état du routeur, donc dans l'historique de navigation.
    saisie,
  };
}

export async function executerConnexion(
  donnees: FormData,
): Promise<EchecAuth | null> {
  const email = texte(donnees, 'email');

  try {
    await seConnecter(email, texte(donnees, 'motDePasse'));
    return null;
  } catch (erreur) {
    return echecDe(erreur, { email }, true);
  }
}

export async function executerInscription(
  donnees: FormData,
): Promise<EchecAuth | null> {
  const email = texte(donnees, 'email');
  const pseudo = texte(donnees, 'pseudo');

  try {
    await sInscrire({
      email,
      motDePasse: texte(donnees, 'motDePasse'),
      ...(pseudo === '' ? {} : { pseudo }),
    });
    return null;
  } catch (erreur) {
    return echecDe(erreur, { email, pseudo }, false);
  }
}
