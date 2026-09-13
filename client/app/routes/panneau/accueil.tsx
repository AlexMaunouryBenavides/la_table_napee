import type { RoleUtilisateur } from '@recipe/types';
import { useQuery } from '@tanstack/react-query';

import { requeteTableauDeBord } from '../../panneau/requetes-panneau';
import { EcranTableauDeBord } from '../../panneau/tableau-de-bord';
import { clientRequetes } from '../../requetes/client-requetes';
import { requeteSession } from '../../requetes/session';
import { useSession } from '../../session-courante';

/**
 * Le rôle décide des statistiques qu'on a le DROIT de demander : il vient de la
 * session du serveur, lue dans le cache que la racine a rempli.
 */
export async function clientLoader(): Promise<null> {
  const session = await clientRequetes.ensureQueryData(requeteSession);

  if (session !== null) {
    await clientRequetes.prefetchQuery(requeteTableauDeBord(session.role));
  }
  return null;
}

function TableauDeBordDu({ role }: { role: RoleUtilisateur }) {
  const tableau = useQuery(requeteTableauDeBord(role));

  if (tableau.data === undefined) {
    return null;
  }

  return (
    <EcranTableauDeBord
      donnees={tableau.data}
      role={role}
      surReessai={() => {
        // `refetch` passe outre la fraîcheur : un échec vient d'être affiché, on
        // redemande vraiment.
        void tableau.refetch();
      }}
    />
  );
}

/** Sans session, la coquille affiche le refus à la place : rien à rendre ici. */
export default function PanneauAccueil() {
  const { session } = useSession();

  return session === null ? null : <TableauDeBordDu role={session.role} />;
}
