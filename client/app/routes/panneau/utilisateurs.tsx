import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { requeteUtilisateurs } from '../../panneau/administration-utilisateurs';
import { EcranListeUtilisateurs } from '../../panneau/liste-utilisateurs';
import { messageDEchec } from '../../panneau/requetes-panneau';
import { clientRequetes } from '../../requetes/client-requetes';
import { useSession } from '../../session-courante';

import type { Route } from './+types/utilisateurs';

export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<null> {
  await clientRequetes.prefetchQuery(
    requeteUtilisateurs(new URL(request.url).searchParams),
  );
  return null;
}

/**
 * La session sert à reconnaître SA propre ligne — le seul cas que le client peut
 * prévenir. La coquille n'affiche ce contenu qu'à un administrateur : sans session,
 * elle a déjà rendu le refus à la place.
 */
export default function PanneauUtilisateurs() {
  const { session } = useSession();
  const [parametres] = useSearchParams();
  const comptes = useQuery({
    ...requeteUtilisateurs(parametres),
    placeholderData: keepPreviousData,
  });

  if (session === null) {
    return null;
  }

  return (
    <EcranListeUtilisateurs
      resultats={comptes.data ?? null}
      echec={messageDEchec(
        comptes.error,
        'Les comptes n’ont pas pu être chargés.',
      )}
      session={session}
    />
  );
}
