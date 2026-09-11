import type { Page, RecetteResume } from '@recipe/types';
import { useSearchParams } from 'react-router';

import {
  listerCriteresSante,
  listerNationalites,
  listerRegimes,
  listerTypesAliment,
} from '../acces-api/categories';
import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';
import { CatalogueVide } from '../catalogue/catalogue-vide';
import { filtresActifs, type Referentiels } from '../catalogue/filtres-actifs';
import { PanneauDeFiltres } from '../catalogue/panneau-de-filtres';
import { RangeeFiltresActifs } from '../catalogue/rangee-filtres-actifs';
import { Bandeau } from '../composants/bandeau';
import { CarteRecette } from '../composants/carte-recette';
import { Pagination } from '../composants/pagination';

import type { Route } from './+types/catalogue';

type DonneesCatalogue = {
  resultats: Page<RecetteResume> | null;
  referentiels: Referentiels;
  echecListe: { message: string; details?: string[] } | null;
  echecReferentiels: boolean;
};

/**
 * La liste et les quatre référentiels partent ENSEMBLE : aucun ne dépend de l'autre,
 * les enchaîner ajouterait quatre allers-retours pour rien.
 *
 * Et ils échouent séparément : un référentiel en panne désactive son filtre, il ne
 * fait pas tomber le catalogue.
 */
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<DonneesCatalogue> {
  const criteres = new URL(request.url).searchParams;

  const [liste, regimes, criteresSante, typesAliment, nationalites] =
    await Promise.allSettled([
      listerRecettes(criteres),
      listerRegimes(),
      listerCriteresSante(),
      listerTypesAliment(),
      listerNationalites(),
    ]);

  const valeurOuVide = <T,>(resultat: PromiseSettledResult<T[]>): T[] =>
    resultat.status === 'fulfilled' ? resultat.value : [];

  return {
    resultats: liste.status === 'fulfilled' ? liste.value : null,
    referentiels: {
      regimes: valeurOuVide(regimes),
      criteresSante: valeurOuVide(criteresSante),
      typesAliment: valeurOuVide(typesAliment),
      nationalites: valeurOuVide(nationalites),
    },
    echecListe: liste.status === 'rejected' ? echecDe(liste.reason) : null,
    echecReferentiels: [
      regimes,
      criteresSante,
      typesAliment,
      nationalites,
    ].some((resultat) => resultat.status === 'rejected'),
  };
}

/** `details[]` porte le « pourquoi » d'un 400 : le perdre laisse l'utilisateur devant
 *  un « requête invalide » qu'il ne peut pas corriger. */
function echecDe(raison: unknown): { message: string; details?: string[] } {
  return raison instanceof ErreurApi
    ? { message: raison.message, details: raison.details }
    : { message: 'Les recettes n’ont pas pu être chargées.' };
}

function Resultats({ resultats }: { resultats: Page<RecetteResume> }) {
  return (
    <>
      <p className="text-sm text-encre-55">
        {resultats.total} recette{resultats.total > 1 ? 's' : ''}
      </p>

      <ul className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {resultats.donnees.map((recette) => (
          <CarteRecette key={recette.id} recette={recette} />
        ))}
      </ul>

      <div className="mt-10 flex justify-center">
        <Pagination
          total={resultats.total}
          page={resultats.page}
          limite={resultats.limite}
        />
      </div>
    </>
  );
}

export default function Catalogue({ loaderData }: Route.ComponentProps) {
  const { resultats, referentiels, echecListe, echecReferentiels } = loaderData;
  const [parametres] = useSearchParams();
  const aDesFiltres = filtresActifs(parametres, referentiels).length > 0;

  return (
    <div className="mx-auto max-w-300">
      <h1 className="font-titre text-4xl">Le catalogue</h1>

      <div className="mt-8 md:flex md:gap-10">
        {/* 268 px = w-67 sur l'échelle de 4 px : le panneau du handoff, sans valeur
            arbitraire. */}
        <aside className="mb-8 md:sticky md:top-6 md:mb-0 md:w-67 md:shrink-0 md:self-start">
          <PanneauDeFiltres referentiels={referentiels} />
        </aside>

        <section className="md:flex-1">
          {echecReferentiels && (
            <Bandeau
              ton="alerte"
              message="Certains filtres n’ont pas pu être chargés. Les autres fonctionnent."
              className="mb-6"
            />
          )}

          <RangeeFiltresActifs referentiels={referentiels} />

          <div className="mt-6">
            {echecListe !== null && (
              <Bandeau
                ton="erreur"
                message={echecListe.message}
                details={echecListe.details}
              />
            )}

            {resultats !== null && resultats.donnees.length === 0 && (
              <CatalogueVide aDesFiltres={aDesFiltres} />
            )}

            {resultats !== null && resultats.donnees.length > 0 && (
              <Resultats resultats={resultats} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
