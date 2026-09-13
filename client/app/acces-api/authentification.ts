import type { Utilisateur } from '@recipe/types';

import { appelerApi } from './appeler-api';

/**
 * L'API pose les cookies httpOnly dans sa réponse : il n'y a rien à récupérer ni à
 * ranger côté client. Le retour ne sert qu'à savoir que c'est fait.
 */
export function seConnecter(
  email: string,
  motDePasse: string,
): Promise<Utilisateur> {
  return appelerApi<Utilisateur>('/auth/connexion', {
    methode: 'POST',
    corps: { email, motDePasse },
  });
}

/** Succès = compte créé ET session ouverte : l'API pose les cookies au passage. */
export function sInscrire(corps: {
  email: string;
  motDePasse: string;
  pseudo?: string;
}): Promise<Utilisateur> {
  return appelerApi<Utilisateur>('/auth/inscription', {
    methode: 'POST',
    corps,
  });
}

/**
 * L'API efface les cookies httpOnly et révoque la famille de jetons de rafraîchissement.
 * Le client n'a rien à nettoyer : il n'a jamais rien stocké.
 */
export function seDeconnecter(): Promise<void> {
  return appelerApi<void>('/auth/deconnexion', { methode: 'POST' });
}
