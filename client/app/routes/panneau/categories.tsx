import { useQueries } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { EcranCategories } from '../../panneau/ecran-categories';
import {
  RESSOURCES,
  ressourceDepuis,
} from '../../panneau/ressources-categories';
import { requeteCategorie } from '../../requetes/categories';
import { clientRequetes } from '../../requetes/client-requetes';

import type { Route } from './+types/categories';

const INTROUVABLE = 404;

/**
 * Les QUATRE listes partent ensemble : ce sont des listes de référence courtes, que
 * l'API rend entières, et c'est ce qui donne aux onglets des compteurs qui ne mentent
 * pas.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<null> {
  if (ressourceDepuis(params.ressource) === null) {
    // Lancer une `Response` est la façon dont React Router signale un 404 depuis un
    // loader : elle est attrapée par l'`ErrorBoundary`, pas par un `catch`.
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- convention du framework
    throw new Response('Ressource inconnue', { status: INTROUVABLE });
  }

  await Promise.all(
    RESSOURCES.map((ressource) =>
      clientRequetes.prefetchQuery(requeteCategorie(ressource.cle)),
    ),
  );
  return null;
}

export default function PanneauCategories() {
  const ressource = ressourceDepuis(useParams().ressource ?? '');
  const listes = useQueries({
    queries: RESSOURCES.map((autre) => requeteCategorie(autre.cle)),
  });

  // Le loader a déjà refusé une ressource inconnue : ce cas ne s'affiche pas.
  if (ressource === null) {
    return null;
  }

  // Une liste en panne laisse son onglet sans compteur — pas à zéro.
  const compteurs: Record<string, number> = {};
  RESSOURCES.forEach((autre, rang) => {
    const liste = listes[rang]?.data;
    if (liste !== undefined) {
      compteurs[autre.cle] = liste.length;
    }
  });

  return (
    <EcranCategories
      ressource={ressource}
      valeurs={listes[RESSOURCES.indexOf(ressource)]?.data ?? []}
      compteurs={compteurs}
    />
  );
}
