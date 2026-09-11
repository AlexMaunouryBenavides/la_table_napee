import { useRouteLoaderData } from 'react-router';

import type { Session } from './acces-api/session';

// L'identifiant que React Router donne à la route racine : c'est par lui que les
// enfants retrouvent les données de son loader.
const ID_ROUTE_RACINE = 'root';

export type EtatSession = {
  /** `null` = visiteur. Le rôle vient du serveur, jamais d'une valeur écrite ici. */
  session: Session;
  /**
   * `true` quand `GET /utilisateurs/moi` n'a pas pu répondre. On est alors « pas
   * connecté » faute de mieux, mais ce n'est pas la même chose qu'un visiteur : un
   * écran protégé doit dire que le service est en rade, pas afficher un 403.
   */
  sessionIndisponible: boolean;
};

/**
 * La session est chargée une seule fois, par la racine. Tout écran la lit ici plutôt
 * que de refaire l'appel — et comme la racine a fini de charger avant que ses enfants
 * ne soient rendus, elle est toujours connue à ce stade.
 */
export function useSession(): EtatSession {
  return (
    useRouteLoaderData<EtatSession>(ID_ROUTE_RACINE) ?? {
      session: null,
      sessionIndisponible: true,
    }
  );
}
