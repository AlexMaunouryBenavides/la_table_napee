import { useNavigation } from 'react-router';

import {
  executerActionCompte,
  type ResultatCompte,
} from '../compte/actions-compte';
import { EcranCompte } from '../compte/ecran-compte';
import { useSession } from '../session-courante';

import type { Route } from './+types/mon-compte';

/**
 * Une seule action pour les trois formulaires : c'est le champ `intention` qui dit
 * lequel a été envoyé. Le retour d'action déclenche la revalidation du loader racine,
 * donc l'en-tête connaît le nouveau pseudo — ou la fin de la session après une
 * suppression — sans qu'on le recopie ici.
 */
export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultatCompte> {
  return executerActionCompte(await request.formData());
}

export default function MonCompte({ actionData }: Route.ComponentProps) {
  const { session, sessionIndisponible } = useSession();
  const navigation = useNavigation();

  return (
    <EcranCompte
      session={session}
      sessionIndisponible={sessionIndisponible}
      resultat={actionData ?? null}
      envoiEnCours={navigation.state === 'submitting'}
    />
  );
}
