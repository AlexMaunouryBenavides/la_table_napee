import { appelerApi } from './appeler-api';

/**
 * L'API efface les cookies httpOnly et révoque la famille de jetons de rafraîchissement.
 * Le client n'a rien à nettoyer : il n'a jamais rien stocké.
 */
export function seDeconnecter(): Promise<void> {
  return appelerApi<void>('/auth/deconnexion', { methode: 'POST' });
}
