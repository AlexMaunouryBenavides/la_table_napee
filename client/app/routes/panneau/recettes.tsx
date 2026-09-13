import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { EcranListeRecettes } from '../../panneau/liste-recettes';
import {
  messageDEchec,
  requeteRecettesPanneau,
} from '../../panneau/requetes-panneau';
import { clientRequetes } from '../../requetes/client-requetes';

import type { Route } from './+types/recettes';

export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<null> {
  await clientRequetes.prefetchQuery(
    requeteRecettesPanneau(new URL(request.url).searchParams),
  );
  return null;
}

export default function PanneauRecettes() {
  const [parametres] = useSearchParams();
  // La page précédente reste affichée pendant que la suivante arrive.
  const liste = useQuery({
    ...requeteRecettesPanneau(parametres),
    placeholderData: keepPreviousData,
  });

  return (
    <EcranListeRecettes
      resultats={liste.data ?? null}
      echec={messageDEchec(
        liste.error,
        'Les recettes n’ont pas pu être chargées.',
      )}
      chargement={liste.isPending}
    />
  );
}
