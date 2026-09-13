import type { RoleUtilisateur } from '@recipe/types';

import { chargerSession } from '../../acces-api/session';
import {
  chargerTableauDeBord,
  type TableauDeBord,
} from '../../panneau/chargement-tableau-de-bord';
import { EcranTableauDeBord } from '../../panneau/tableau-de-bord';

import type { Route } from './+types/accueil';

type DonneesPanneau = { donnees: TableauDeBord; role: RoleUtilisateur };

/**
 * Le rôle décide des statistiques qu'on a le DROIT de demander, il vient donc du
 * serveur. Les `clientLoader` de cette version de React Router ne reçoivent pas les
 * données du loader racine : on relit la session plutôt que de la supposer — un appel
 * de plus, aucune devinette sur les droits.
 *
 * Sans session il n'y a rien à charger : la coquille affiche le refus à la place du
 * contenu, et ce composant n'est alors jamais rendu.
 */
export async function clientLoader(): Promise<DonneesPanneau | null> {
  const session = await chargerSession();

  if (session === null) {
    return null;
  }

  return {
    donnees: await chargerTableauDeBord(session.role),
    role: session.role,
  };
}

export default function PanneauAccueil({ loaderData }: Route.ComponentProps) {
  if (loaderData === null) {
    return null;
  }

  return (
    <EcranTableauDeBord donnees={loaderData.donnees} role={loaderData.role} />
  );
}
