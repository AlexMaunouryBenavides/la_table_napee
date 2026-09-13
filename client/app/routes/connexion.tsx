import { redirect, useNavigation } from 'react-router';

import { executerConnexion } from '../auth/action-auth';
import { EcranConnexion, type EchecAuth } from '../auth/ecran-connexion';
import { sessionAChange } from '../requetes/session';
import { useSession } from '../session-courante';

import type { Route } from './+types/connexion';

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<EchecAuth | Response> {
  const echec = await executerConnexion(await request.formData());

  if (echec !== null) {
    return echec;
  }

  // Succès : la session est relue, donc l'en-tête connaît le nouvel utilisateur sans
  // qu'on la recopie ; puis on renvoie à l'accueil.
  await sessionAChange();
  return redirect('/');
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
