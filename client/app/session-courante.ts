import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { seDeconnecter } from './acces-api/authentification';
import type { Session } from './acces-api/session';
import { requeteSession, sessionAChange } from './requetes/session';

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
 * La session est préchargée par la racine, puis lue ici dans le cache : tous les
 * composants qui la demandent partagent le même appel.
 */
export function useSession(): EtatSession {
  const { data } = useQuery(requeteSession);

  // Pas de donnée = panne, ou chargement pas encore fini : dans les deux cas on ne
  // sait pas qui est là, et ce n'est pas un visiteur.
  return data === undefined
    ? { session: null, sessionIndisponible: true }
    : { session: data, sessionIndisponible: false };
}

/**
 * Déconnecte, puis relit la session — même si l'appel a échoué : la relecture dit
 * alors la vérité, à savoir que la session tient toujours.
 */
export function useDeconnexion(): () => void {
  const naviguer = useNavigate();

  return () => {
    void (async () => {
      try {
        await seDeconnecter();
        await naviguer('/');
      } finally {
        await sessionAChange();
      }
    })();
  };
}
