import { redirect, useNavigation } from 'react-router';

import { executerConnexion } from '../auth/action-auth';
import { EcranConnexion, type EchecAuth } from '../auth/ecran-connexion';
import { useSession } from '../session-courante';

import type { Route } from './+types/connexion';

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<EchecAuth | Response> {
  const echec = await executerConnexion(await request.formData());

  // Succès : on renvoie à l'accueil. La redirection rejoue le loader racine, donc
  // l'en-tête connaît la nouvelle session sans qu'on la recopie.
  return echec ?? redirect('/');
}

export default function Connexion({ actionData }: Route.ComponentProps) {
  const { session } = useSession();
  const navigation = useNavigation();

  return (
    <EcranConnexion
      session={session}
      echec={actionData ?? null}
      envoiEnCours={navigation.state === 'submitting'}
    />
  );
}
