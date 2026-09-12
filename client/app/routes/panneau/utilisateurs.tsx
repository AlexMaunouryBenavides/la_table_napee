import type { Page, Utilisateur } from '@recipe/types';

import { ErreurApi } from '../../acces-api/erreur-api';
import { chargerSession } from '../../acces-api/session';
import { listerUtilisateurs } from '../../acces-api/utilisateurs';
import {
  executerActionUtilisateur,
  type ResultatAdministration,
} from '../../panneau/administration-utilisateurs';
import { EcranListeUtilisateurs } from '../../panneau/liste-utilisateurs';

import type { Route } from './+types/utilisateurs';

type DonneesComptes = {
  resultats: Page<Utilisateur> | null;
  echec: string | null;
  session: Utilisateur | null;
};

/**
 * La session sert à reconnaître SA propre ligne — le seul cas que le client peut
 * prévenir. Les clientLoaders de cette version de React Router ne reçoivent pas les
 * données du loader racine : on la relit plutôt que de la supposer.
 */
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<DonneesComptes> {
  const criteres = new URL(request.url).searchParams;

  const [session, comptes] = await Promise.all([
    chargerSession(),
    listerUtilisateurs(criteres).catch((leve: unknown) => leve),
  ]);

  if (comptes instanceof Error) {
    return {
      resultats: null,
      echec:
        comptes instanceof ErreurApi
          ? comptes.message
          : 'Les comptes n’ont pas pu être chargés.',
      session,
    };
  }

  return { resultats: comptes as Page<Utilisateur>, echec: null, session };
}

/** Une seule action pour toutes les lignes : chaque `useFetcher` porte son propre
 *  état, donc un refus ne touche que sa ligne. */
export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultatAdministration> {
  return executerActionUtilisateur(await request.formData());
}

export default function PanneauUtilisateurs({
  loaderData,
}: Route.ComponentProps) {
  // La coquille n'affiche ce contenu qu'à un administrateur : sans session, elle a
  // déjà rendu le refus à la place.
  if (loaderData.session === null) {
    return null;
  }

  return (
    <EcranListeUtilisateurs
      resultats={loaderData.resultats}
      echec={loaderData.echec}
      session={loaderData.session}
    />
  );
}
