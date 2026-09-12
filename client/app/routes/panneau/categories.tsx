import type { Categorie } from '@recipe/types';

import { listerCategories } from '../../acces-api/categories';
import {
  executerActionCategorie,
  type ResultatCategorie,
} from '../../panneau/actions-categories';
import { EcranCategories } from '../../panneau/ecran-categories';
import {
  RESSOURCES,
  type Ressource,
  ressourceDepuis,
} from '../../panneau/ressources-categories';

import type { Route } from './+types/categories';

type DonneesCategories = {
  ressource: Ressource;
  valeurs: Categorie[];
  compteurs: Record<string, number>;
};

const INTROUVABLE = 404;

/**
 * Les QUATRE listes partent ensemble : ce sont des listes de référence courtes, que
 * l'API rend entières, et c'est ce qui donne aux onglets des compteurs qui ne mentent
 * pas. Une liste en panne laisse son onglet sans compteur — pas à zéro.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<DonneesCategories> {
  const ressource = ressourceDepuis(params.ressource);

  if (ressource === null) {
    // Lancer une `Response` est la façon dont React Router signale un 404 depuis un
    // loader : elle est attrapée par l'`ErrorBoundary`, pas par un `catch`.
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- convention du framework
    throw new Response('Ressource inconnue', { status: INTROUVABLE });
  }

  const listes = await Promise.allSettled(
    RESSOURCES.map((autre) => listerCategories(autre.cle)),
  );

  const compteurs: Record<string, number> = {};
  let valeurs: Categorie[] = [];

  RESSOURCES.forEach((autre, rang) => {
    const liste = listes[rang];

    if (liste?.status !== 'fulfilled') {
      return;
    }

    compteurs[autre.cle] = liste.value.length;

    if (autre.cle === ressource.cle) {
      valeurs = liste.value;
    }
  });

  return { ressource, valeurs, compteurs };
}

/** Une seule action pour les trois verbes et les quatre ressources : c'est
 *  `intention` qui dit lequel, et `ressource` sur laquelle. */
export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ResultatCategorie> {
  return executerActionCategorie(await request.formData());
}

export default function PanneauCategories({
  loaderData,
}: Route.ComponentProps) {
  return (
    <EcranCategories
      ressource={loaderData.ressource}
      valeurs={loaderData.valeurs}
      compteurs={loaderData.compteurs}
    />
  );
}
