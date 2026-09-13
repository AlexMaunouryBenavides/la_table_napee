import type { Utilisateur } from '@recipe/types';

import { appelerApi } from './appeler-api';
import { ErreurApi } from './erreur-api';

const NON_AUTHENTIFIE = 401;

/** `null` = visiteur. Le rôle vient toujours du serveur : le client ne le devine pas. */
export type Session = Utilisateur | null;

/**
 * L'état « connecté » se déduit du serveur, jamais d'une valeur écrite par le client.
 *
 * Un `401` n'est pas une erreur d'écran : c'est la réponse normale pour un visiteur.
 * En revanche une panne (`500`, API injoignable) se propage — l'avaler afficherait un
 * site anonyme et muet au lieu de dire que le service est en rade.
 */
export async function chargerSession(): Promise<Session> {
  try {
    return await appelerApi<Utilisateur>('/utilisateurs/moi');
  } catch (erreur) {
    if (erreur instanceof ErreurApi && erreur.statut === NON_AUTHENTIFIE) {
      return null;
    }
    throw erreur;
  }
}
