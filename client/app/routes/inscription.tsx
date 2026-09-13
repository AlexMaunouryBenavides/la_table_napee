import { EcranInscription } from '../auth/ecran-inscription';
import { useInscription } from '../auth/mutations-auth';
import { useSession } from '../session-courante';

export default function Inscription() {
  const { session } = useSession();
  const inscription = useInscription();

  return (
    <EcranInscription
      session={session}
      echec={inscription.data ?? null}
      envoiEnCours={inscription.isPending}
      surEnvoi={(donnees) => {
        inscription.mutate(donnees);
      }}
    />
  );
}
