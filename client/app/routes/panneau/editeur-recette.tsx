import { redirect, useNavigation } from 'react-router';

import {
  listerCriteresSante,
  listerNationalites,
  listerRegimes,
  listerTypesAliment,
} from '../../acces-api/categories';
import { ErreurApi } from '../../acces-api/erreur-api';
import {
  creerRecette,
  modifierRecette,
  obtenirRecette,
} from '../../acces-api/recettes';
import {
  type BrouillonRecette,
  brouillonDepuis,
  brouillonVide,
  type CorpsRecette,
} from '../../panneau/brouillon-recette';
import {
  EcranEditeurRecette,
  type Referentiels,
  type RetourEnregistrement,
} from '../../panneau/editeur-recette';

import type { Route } from './+types/editeur-recette';

type DonneesEditeur = {
  brouillon: BrouillonRecette;
  referentiels: Referentiels;
  recetteId: number | null;
};

const REQUETE_INVALIDE = 400;

const valeurOuVide = <T,>(resultat: PromiseSettledResult<T[]>): T[] =>
  resultat.status === 'fulfilled' ? resultat.value : [];

/**
 * En CRÉATION il n'y a rien à attendre : le formulaire est vide et immédiatement
 * utilisable, les quatre référentiels arrivent à côté et n'empêchent pas la saisie.
 * En MODIFICATION, la recette part avec eux — aucun ne dépend de l'autre.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<DonneesEditeur> {
  const recetteId = params.id === undefined ? null : Number(params.id);

  const [recette, regimes, criteresSante, typesAliment, nationalites] =
    await Promise.allSettled([
      recetteId === null ? Promise.resolve(null) : obtenirRecette(recetteId),
      listerRegimes(),
      listerCriteresSante(),
      listerTypesAliment(),
      listerNationalites(),
    ]);

  if (recetteId !== null && recette.status === 'rejected') {
    throw recette.reason;
  }

  return {
    brouillon:
      recette.status === 'fulfilled' && recette.value !== null
        ? brouillonDepuis(recette.value)
        : brouillonVide(),
    referentiels: {
      regimes: valeurOuVide(regimes),
      criteresSante: valeurOuVide(criteresSante),
      typesAliment: valeurOuVide(typesAliment),
      nationalites: valeurOuVide(nationalites),
    },
    recetteId,
  };
}

/** `details[]` porte le « pourquoi » d'un 400 : chaque message est préfixé du nom de
 *  son champ, ce qui permet de l'afficher au bon endroit plutôt qu'en vrac. */
function champsDepuis(erreur: ErreurApi): Record<string, string> | undefined {
  if (erreur.statut !== REQUETE_INVALIDE || erreur.details === undefined) {
    return undefined;
  }

  const champs: Record<string, string> = {};

  for (const detail of erreur.details) {
    const [nom] = detail.split(' ');

    if (nom !== undefined && nom !== '') {
      champs[nom] ??= detail;
    }
  }

  return Object.keys(champs).length === 0 ? undefined : champs;
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs): Promise<RetourEnregistrement | Response> {
  const corps = (await request.json()) as CorpsRecette;

  try {
    // En MODIFICATION on reste sur place : sans redirection, le bandeau de succès a
    // une chance d'être lu. En CRÉATION l'URL doit changer — la recette a un id.
    if (params.id !== undefined) {
      await modifierRecette(Number(params.id), corps);

      return { succes: true };
    }

    const creee = await creerRecette(corps);

    return redirect(`/panneau/recettes/${String(creee.id)}/modifier`);
  } catch (leve) {
    if (!(leve instanceof ErreurApi)) {
      throw leve;
    }

    return { succes: false, message: leve.message, champs: champsDepuis(leve) };
  }
}

export default function EditeurRecette({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation();

  return (
    <EcranEditeurRecette
      // Remonter un brouillon rechargé exige de remonter l'état interne : la clé
      // change avec la recette éditée, jamais pendant la saisie.
      key={loaderData.recetteId ?? 'nouvelle'}
      brouillonInitial={loaderData.brouillon}
      referentiels={loaderData.referentiels}
      retour={actionData ?? null}
      envoiEnCours={navigation.state === 'submitting'}
      recetteId={loaderData.recetteId}
    />
  );
}
