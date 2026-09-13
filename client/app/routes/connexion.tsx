import { EcranConnexion } from '../auth/ecran-connexion';
import { useConnexion } from '../auth/mutations-auth';
import { useSession } from '../session-courante';

export default function Connexion() {
  const { session } = useSession();
  const connexion = useConnexion();

  return (
    <EcranConnexion
      session={session}
      echec={connexion.data ?? null}
      envoiEnCours={connexion.isPending}
      surEnvoi={(donnees) => {
        connexion.mutate(donnees);
      }}
    />
  );
}
