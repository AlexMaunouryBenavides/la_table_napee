import type { Composition, Recette } from '@recipe/types';

import { obtenirRecette } from '../acces-api/recettes';
import { Etoiles } from '../composants/etoiles';
import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';
import { executerActionAvis, type EchecAvis } from '../recette/action-avis';
import { Etapes, VideoDeLaRecette } from '../recette/preparation';
import { formaterQuantite, libelleUnite } from '../recette/quantites';
import { ZoneAvis } from '../recette/zone-avis';
import { useSession } from '../session-courante';

import type { Route } from './+types/detail-recette';

/**
 * Les avis arrivent DANS la réponse : `GET /recettes/:id` les porte déjà, avec leurs
 * auteurs. Un second appel à `/recettes/:id/avis` ne ferait qu'ajouter un
 * aller-retour pour la même donnée.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<Recette> {
  return obtenirRecette(Number(params.id));
}

/**
 * Dépôt, modification et suppression d'un avis. Après une action, React Router
 * rejoue le loader tout seul : la recette et sa note moyenne se rafraîchissent sans
 * qu'on ait à recopier l'état à la main.
 */
export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<EchecAvis | null> {
  return executerActionAvis(Number(params.id), await request.formData());
}

function Meta({ recette }: { recette: Recette }) {
  const total = recette.tempsPreparation + recette.tempsCuisson;

  return (
    <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-trait py-4 text-sm">
      {[
        ['Type', LIBELLES_TYPE[recette.typeRecette]],
        ['Difficulté', LIBELLES_DIFFICULTE[recette.difficulte]],
        ['Préparation', `${String(recette.tempsPreparation)} min`],
        ['Cuisson', `${String(recette.tempsCuisson)} min`],
        ['Total', `${String(total)} min`],
        ['Portions', String(recette.portions)],
        ['Origine', recette.nationalite.nom],
      ].map(([intitule, valeur]) => (
        <div key={intitule}>
          <dt className="text-xs tracking-etiquette text-encre-55 uppercase">
            {intitule}
          </dt>
          <dd className="mt-1 text-base">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Ingredients({ compositions }: { compositions: Composition[] }) {
  return (
    <table className="w-full rounded-md bg-craie text-base">
      <caption className="sr-only">Ingrédients de la recette</caption>
      <tbody>
        {compositions.map((composition) => (
          <tr
            key={composition.id}
            className="border-b border-trait last:border-0"
          >
            <td className="px-4 py-3">{composition.ingredient.nom}</td>
            {/* Alignée à droite : l'œil compare les quantités en colonne. */}
            <td className="px-4 py-3 text-right whitespace-nowrap text-encre-70">
              {formaterQuantite(composition.quantite)}{' '}
              {composition.quantite === null
                ? ''
                : libelleUnite(composition.unite)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Categories({ recette }: { recette: Recette }) {
  const toutes = [
    ...recette.regimes,
    ...recette.criteresSante,
    ...recette.typesAliment,
  ];

  if (toutes.length === 0) {
    return null;
  }

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {toutes.map((categorie) => (
        <li
          key={`${categorie.id}-${categorie.nom}`}
          className="rounded-pilule border border-trait-fort px-3 py-1 text-sm text-encre-70"
        >
          {categorie.nom}
        </li>
      ))}
    </ul>
  );
}

function EnTeteRecette({ recette }: { recette: Recette }) {
  return (
    <header className="md:flex md:gap-10">
      <div className="md:flex-1">
        <h1 className="font-titre text-4xl">{recette.titre}</h1>
        <div className="mt-3">
          <Etoiles
            note={recette.noteMoyenne}
            nombreAvis={recette.avis.length}
          />
        </div>
        <p className="mt-4 text-lg text-encre-70">{recette.description}</p>
        <Categories recette={recette} />
      </div>

      {/* Aplat 4:3 en attendant les vraies photos : le ratio est tenu pour que
          l'arrivée des images ne décale rien. */}
      <div className="mt-6 flex aspect-4/3 items-center justify-center rounded-md bg-lavande text-sm text-ardoise-clair md:mt-0 md:w-100 md:shrink-0">
        {LIBELLES_TYPE[recette.typeRecette]}
      </div>
    </header>
  );
}

export default function DetailRecette({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const recette = loaderData;
  const { session } = useSession();

  return (
    <article className="mx-auto max-w-250">
      <EnTeteRecette recette={recette} />

      <Meta recette={recette} />

      <div className="mt-10 md:flex md:gap-10">
        <section className="md:w-82 md:shrink-0">
          <h2 className="font-titre text-3xl">Ingrédients</h2>
          <div className="mt-4">
            <Ingredients compositions={recette.compositions} />
          </div>
        </section>

        <section className="mt-10 md:mt-0 md:flex-1">
          <h2 className="font-titre text-3xl">Préparation</h2>
          <div className="mt-4">
            <Etapes etapes={recette.etapes} />
          </div>

          <div className="mt-8">
            <VideoDeLaRecette video={recette.video} />
          </div>
        </section>
      </div>

      <ZoneAvis
        recetteId={recette.id}
        avis={recette.avis}
        session={session}
        echec={actionData ?? null}
      />
    </article>
  );
}
