import type { Page, RecetteResume } from '@recipe/types';
import { useSearchParams } from 'react-router';

import { CatalogueVide } from '../catalogue/catalogue-vide';
import { filtresActifs, type Referentiels } from '../catalogue/filtres-actifs';
import { PanneauDeFiltres } from '../catalogue/panneau-de-filtres';
import { RangeeFiltresActifs } from '../catalogue/rangee-filtres-actifs';
import {
  prechargerCatalogue,
  useCatalogue,
  type DonneesCatalogue,
} from '../catalogue/requetes-catalogue';
import { SelecteurTri } from '../catalogue/selecteur-tri';
import { TiroirFiltres } from '../catalogue/tiroir-filtres';
import { TitreCatalogue } from '../catalogue/titre-catalogue';
import { Bandeau } from '../composants/bandeau';
import { CarteRecette } from '../composants/carte-recette';
import { Pagination } from '../composants/pagination';
import { RechercheDebattue } from '../composants/recherche-debattue';
import { useEcranLarge } from '../composants/use-ecran-large';

import type { Route } from './+types/catalogue';

/** Remplit le cache avant l'affichage ; une panne reste dans sa requête et l'écran
 *  l'affiche à sa place. */
export async function clientLoader({
  request,
}: Route.ClientLoaderArgs): Promise<null> {
  await prechargerCatalogue(new URL(request.url).searchParams);
  return null;
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
  referentiels,
}: {
  total: number | null;
  aDesFiltres: boolean;
  referentiels: Referentiels;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-6 border-b border-trait pb-4">
      <div>
        {/* Avec des filtres, `total` compte les RÉSULTATS, pas le catalogue :
          l'annoncer comme la taille du catalogue serait faux. */}
        {total !== null && !aDesFiltres && (
          <p className="text-xs font-medium tracking-bouton text-ardoise uppercase">
            {total} recettes au catalogue
          </p>
        )}
        <TitreCatalogue referentiels={referentiels} />
      </div>
      <SelecteurTri />
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

/**
 * Un seul des deux est MONTÉ, pas seulement affiché : les deux portent une recherche
 * liée à l'URL, et deux champs vivants se renverraient la valeur l'un à l'autre.
 */
function ZoneFiltres({ referentiels }: { referentiels: Referentiels }) {
  const large = useEcranLarge();

  if (!large) {
    return (
      <div className="mb-5 flex flex-col gap-3">
        <RechercheDebattue
          libelle="Rechercher dans le catalogue"
          invite="Un titre, un mot…"
          className="rounded-sm"
        />
        <div>
          <TiroirFiltres referentiels={referentiels} />
        </div>
      </div>
    );
  }

  return (
    // 268 px = w-67 sur l'échelle de 4 px : le panneau du handoff, sans valeur
    // arbitraire.
    <aside className="lg:sticky lg:top-6 lg:w-67 lg:shrink-0 lg:self-start">
      <PanneauDeFiltres referentiels={referentiels} />
    </aside>
  );
}

export default function Catalogue() {
  const [parametres] = useSearchParams();
  const { resultats, referentiels, echecListe, echecReferentiels } =
    useCatalogue(parametres);
  const aDesFiltres = filtresActifs(parametres, referentiels).length > 0;
  const total = resultats?.total ?? null;

  return (
    <div className="mx-auto max-w-300 lg:flex lg:gap-9">
      <ZoneFiltres referentiels={referentiels} />

      <section className="lg:flex-1">
        <EnTeteCatalogue
          total={total}
          aDesFiltres={aDesFiltres}
          referentiels={referentiels}
        />

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
