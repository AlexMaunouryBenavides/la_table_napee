import { queryOptions } from '@tanstack/react-query';

import { chargerSession } from '../acces-api/session';

import { clientRequetes } from './client-requetes';

/**
 * `GET /utilisateurs/moi`. Une panne reste une ERREUR de requête, jamais une donnée :
 * mise en cache comme réponse, elle ferait passer l'utilisateur pour un visiteur
 * jusqu'à la fin du délai de fraîcheur.
 */
export const requeteSession = queryOptions({
  queryKey: ['session'],
  queryFn: chargerSession,
});

/** À appeler après tout ce qui change la session : connexion, déconnexion, compte. */
export function sessionAChange(): Promise<void> {
  return clientRequetes.invalidateQueries({
    queryKey: requeteSession.queryKey,
  });
}
