import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';

import {
  brouillonDepuis,
  brouillonVide,
} from '../../panneau/brouillon-recette';
import { EcranEditeurRecette } from '../../panneau/editeur-recette';
import { useEnregistrerRecette } from '../../panneau/enregistrement-recette';
import { requeteRecette } from '../../recette/requete-recette';
import {
  prechargerReferentiels,
  useReferentiels,
} from '../../requetes/categories';
import { clientRequetes } from '../../requetes/client-requetes';

import type { Route } from './+types/editeur-recette';

const idDepuis = (id: string | undefined): number | null =>
  id === undefined ? null : Number(id);

/**
 * En CRÉATION il n'y a rien à attendre : le formulaire est vide et immédiatement
 * utilisable, les quatre référentiels arrivent à côté. En MODIFICATION, la recette
 * part avec eux — aucun ne dépend de l'autre.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<null> {
  const recetteId = idDepuis(params.id);

  await Promise.all([
    prechargerReferentiels(),
    recetteId === null
      ? null
      : clientRequetes.ensureQueryData(requeteRecette(recetteId)),
  ]);
  return null;
}

function EditeurDe({ recetteId }: { recetteId: number | null }) {
  const { referentiels } = useReferentiels();
  const recette = useQuery({
    ...requeteRecette(recetteId ?? 0),
    enabled: recetteId !== null,
  });
  const enregistrement = useEnregistrerRecette(recetteId);

  if (recetteId !== null && recette.data === undefined) {
    return null;
  }

  return (
    <EcranEditeurRecette
      brouillonInitial={
        recette.data === undefined
          ? brouillonVide()
          : brouillonDepuis(recette.data)
      }
      referentiels={referentiels}
      retour={enregistrement.data ?? null}
      envoiEnCours={enregistrement.isPending}
      recetteId={recetteId}
      surEnvoi={(corps) => {
        enregistrement.mutate(corps);
      }}
    />
  );
}

export default function PanneauEditeur() {
  const recetteId = idDepuis(useParams().id);

  // Changer de recette remonte tout l'éditeur : son envoi et ses erreurs locales
  // appartiennent à la recette qu'on quitte.
  return <EditeurDe key={recetteId ?? 'nouvelle'} recetteId={recetteId} />;
}
