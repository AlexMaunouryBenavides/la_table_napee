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
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {resultats.donnees.map((recette) => (
          <CarteRecette key={recette.id} recette={recette} />
        ))}
      </ul>

      <div className="mt-6">
        <Pagination
          total={resultats.total}
          page={resultats.page}
          limite={resultats.limite}
          elements={{ singulier: 'recette', pluriel: 'recettes' }}
        />
      </div>
    </>
  );
}

function EnTeteCatalogue({
  total,
  aDesFiltres,
}: {
  total: number | null;
  aDesFiltres: boolean;
}) {
  return (
    <header className="mb-5 border-b border-trait pb-4">
      {/* Avec des filtres, `total` compte les RÉSULTATS, pas le catalogue :
          l'annoncer comme la taille du catalogue serait faux. */}
      {total !== null && !aDesFiltres && (
        <p className="text-xs font-medium tracking-bouton text-ardoise uppercase">
          {total} recettes au catalogue
        </p>
      )}
      <h1 className="mt-2 text-3xl leading-none">Le catalogue</h1>
    </header>
  );
}

function ListeOuEtat({
  resultats,
  echecListe,
  aDesFiltres,
}: Pick<DonneesCatalogue, 'resultats' | 'echecListe'> & {
  aDesFiltres: boolean;
}) {
  if (echecListe !== null) {
    return (
      <Bandeau
        ton="erreur"
        message={echecListe.message}
        details={echecListe.details}
      />
    );
  }

  if (resultats === null) {
    return null;
  }

  return resultats.donnees.length === 0 ? (
    <CatalogueVide aDesFiltres={aDesFiltres} />
  ) : (
    <Resultats resultats={resultats} />
  );
}

export default function Catalogue({ loaderData }: Route.ComponentProps) {
  const { resultats, referentiels, echecListe, echecReferentiels } = loaderData;
  const [parametres] = useSearchParams();
  const aDesFiltres = filtresActifs(parametres, referentiels).length > 0;
  const total = resultats?.total ?? null;

  return (
    <div className="mx-auto max-w-300 md:flex md:gap-9">
      {/* 268 px = w-67 sur l'échelle de 4 px : le panneau du handoff, sans valeur
          arbitraire. */}
      <aside className="mb-8 md:sticky md:top-6 md:mb-0 md:w-67 md:shrink-0 md:self-start">
        <PanneauDeFiltres referentiels={referentiels} />
      </aside>

      <section className="md:flex-1">
        <EnTeteCatalogue total={total} aDesFiltres={aDesFiltres} />

        {echecReferentiels && (
          <Bandeau
            ton="alerte"
            message="Certains filtres n’ont pas pu être chargés. Les autres fonctionnent."
            className="mb-6"
          />
        )}

        <RangeeFiltresActifs referentiels={referentiels} total={total} />

        <ListeOuEtat
          resultats={resultats}
          echecListe={echecListe}
          aDesFiltres={aDesFiltres}
        />
      </section>
    </div>
  );
}
