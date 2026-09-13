import { aAuMoins, type RoleUtilisateur } from '@recipe/types';

import { LienBouton } from './lien-bouton';
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
          <LienBouton vers="/connexion" variante="primaire">
            Se connecter
          </LienBouton>
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
        // Renvoyer vers le tableau de bord quelqu'un qui n'a rien à faire dans le
        // panneau, c'est le renvoyer sur un second refus. On le ramène au site.
        aAuMoins(roleCourant, 'moderateur') ? (
          <LienBouton vers="/panneau" variante="primaire">
            Retour au tableau de bord
          </LienBouton>
        ) : (
          <LienBouton vers="/" variante="primaire">
            Retour au site
          </LienBouton>
        )
      }
    />
  );
}
