import type { Page, RecetteResume } from '@recipe/types';
import { useNavigation } from 'react-router';

import { ErreurApi } from '../../acces-api/erreur-api';
import { listerRecettes } from '../../acces-api/recettes';
import { EcranListeRecettes } from '../../panneau/liste-recettes';
import {
  executerSuppression,
  type ResultatSuppression,
} from '../../panneau/suppression-recette';

import type { Route } from './+types/recettes';

type DonneesListe = {
  resultats: Page<RecetteResume> | null;
  echec: string | null;
};

const LIMITE_PANNEAU = '12';

/** Les critères viennent de l'URL et partent tels quels : l'API est seule juge de ce
 *  qu'elle accepte. Seule la limite est imposée ici — c'est une décision d'écran. */
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<DonneesListe> {
  const criteres = new URL(request.url).searchParams;
  criteres.set('limite', LIMITE_PANNEAU);

  try {
    return { resultats: await listerRecettes(criteres), echec: null };
  } catch (leve) {
    return {
      resultats: null,
      echec:
        leve instanceof ErreurApi
          ? leve.message
          : 'Les recettes n’ont pas pu être chargées.',
    };
  }
}

/** Une seule action pour toutes les lignes : chaque `useFetcher` porte son propre
 *  état, donc une suppression en échec ne touche que sa ligne. */
export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultatSuppression> {
  return executerSuppression(await request.formData());
}

export default function PanneauRecettes({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();

  return (
    <EcranListeRecettes
      resultats={loaderData.resultats}
      echec={loaderData.echec}
      chargement={navigation.state === 'loading'}
    />
  );
}
