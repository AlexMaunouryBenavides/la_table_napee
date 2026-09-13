import { redirect, useNavigation } from 'react-router';

import { executerInscription } from '../auth/action-auth';
import type { EchecAuth } from '../auth/ecran-connexion';
import { EcranInscription } from '../auth/ecran-inscription';
import { useSession } from '../session-courante';

import type { Route } from './+types/inscription';

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<EchecAuth | Response> {
  const echec = await executerInscription(await request.formData());

  // L'API sépare « créer un compte » (201, sans session) de « ouvrir une session ».
  // On ne maquille pas cette séparation : le compte créé, on envoie se connecter.
  return echec ?? redirect('/connexion?inscrit=1');
}

export default function Inscription({ actionData }: Route.ComponentProps) {
  const { session } = useSession();
  const navigation = useNavigation();

  return (
    <EcranInscription
      session={session}
      echec={actionData ?? null}
      envoiEnCours={navigation.state === 'submitting'}
    />
  );
}
