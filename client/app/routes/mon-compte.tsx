import { EcranCompte } from '../compte/ecran-compte';
import {
  executerMotDePasse,
  executerProfil,
  executerSuppression,
  useEnvoiCompte,
} from '../compte/mutations-compte';
import { useSession } from '../session-courante';

/** Trois envois indépendants : chaque formulaire a son propre état d'envoi et de
 *  retour, si bien qu'un échec sur l'un ne change rien aux deux autres. */
export default function MonCompte() {
  const { session, sessionIndisponible } = useSession();
  const profil = useEnvoiCompte(executerProfil);
  const motDePasse = useEnvoiCompte(executerMotDePasse);
  const suppression = useEnvoiCompte(executerSuppression);

  return (
    <EcranCompte
      session={session}
      sessionIndisponible={sessionIndisponible}
      profil={profil}
      motDePasse={motDePasse}
      suppression={suppression}
    />
  );
}
