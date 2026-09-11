import type { RoleUtilisateur } from '@recipe/types';
import { Link } from 'react-router';

import { PageImpasse } from './page-impasse';

const LIBELLES: Record<RoleUtilisateur, string> = {
  admin: 'administrateur',
  moderateur: 'modérateur',
  utilisateur: 'utilisateur',
};

/**
 * Écran 13, dans deux variantes. Il s'affiche À L'URL DEMANDÉE et dans la coquille
 * courante : jamais de redirection, qui ferait perdre l'adresse et laisserait croire
 * que la page n'existe pas.
 */
export function AccesRefuse({
  roleCourant,
  roleExige,
}: {
  /** `null` = visiteur : ce n'est pas un refus définitif, juste une étape manquante. */
  roleCourant: RoleUtilisateur | null;
  roleExige: RoleUtilisateur;
}) {
  if (roleCourant === null) {
    return (
      <PageImpasse
        code={401}
        titre="Cette page demande d’être connecté"
        explication="Connectez-vous, vous reviendrez ici ensuite."
        actions={
          <Link to="/connexion" className="underline">
            Se connecter
          </Link>
        }
      />
    );
  }

  return (
    <PageImpasse
      code={403}
      titre="Cette page ne vous est pas ouverte"
      // Nommer les deux rôles évite la question « pourquoi ? » : on sait ce qu'on est
      // et ce qu'il aurait fallu être.
      explication={`Elle demande le rôle ${LIBELLES[roleExige]}, et vous êtes ${LIBELLES[roleCourant]}.`}
      actions={
        <Link to="/panneau" className="underline">
          Retour au tableau de bord
        </Link>
      }
    />
  );
}
