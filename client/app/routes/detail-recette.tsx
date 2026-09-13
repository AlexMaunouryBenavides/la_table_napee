import type { Composition, Recette } from '@recipe/types';
import { data, Link } from 'react-router';

import { ErreurApi } from '../acces-api/erreur-api';
import { Etoiles } from '../composants/etoiles';
import { executerActionAvis, type EchecAvis } from '../recette/action-avis';
import { Etapes, VideoDeLaRecette } from '../recette/preparation';
import { formaterQuantite, libelleUnite } from '../recette/quantites';
import {
  recettesOntChange,
  requeteRecette,
  useRecette,
} from '../recette/requete-recette';
import { SectionsRecette, TitreDeSection } from '../recette/sections-recette';
import { ZoneAvis } from '../recette/zone-avis';
import { clientRequetes } from '../requetes/client-requetes';
import { useSession } from '../session-courante';

import type { Route } from './+types/detail-recette';

const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

const INTROUVABLE = 404;

/**
 * Remplit le cache avant l'affichage. Une recette absente devient un 404 du routeur,
 * que l'`ErrorBoundary` affiche en page introuvable — pas en panne inattendue.
 */
export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<null> {
  try {
    await clientRequetes.ensureQueryData(requeteRecette(Number(params.id)));
  } catch (erreur) {
    if (erreur instanceof ErreurApi && erreur.statut === INTROUVABLE) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- la forme que React Router attend pour un statut HTTP
      throw data('Recette introuvable', { status: INTROUVABLE });
    }
    throw erreur;
  }
  return null;
}

/**
 * Dépôt, modification et suppression d'un avis. Après un succès, les recettes en
 * cache sont relues : la note moyenne se rafraîchit sans recopier l'état à la main.
 */
export async function clientAction({
  params,
  request,
}: Route.ClientActionArgs): Promise<EchecAvis | null> {
  const echec = await executerActionAvis(
    Number(params.id),
    await request.formData(),
  );
  if (echec === null) {
    await recettesOntChange();
  }
  return echec;
}

function FilDAriane({ recette }: { recette: Recette }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-encre-55">
      <Link to="/recettes" className="text-encre-55">
        Catalogue
      </Link>
      {' · '}
      <Link
        to={`/recettes?type=${recette.typeRecette}`}
        className="text-encre-55"
      >
        {recette.typeRecette}
      </Link>
      {' · '}
      <span aria-current="page">{recette.titre}</span>
    </nav>
  );
}

function Note({ recette }: { recette: Recette }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <Etoiles note={recette.noteMoyenne} nombreAvis={recette.avis.length} />
      {/* Déjà dit par l'étiquette des étoiles : ici, seulement pour l'œil. */}
      {recette.noteMoyenne !== null && (
        <span aria-hidden="true" className="text-sm text-encre-70">
          {recette.noteMoyenne.toFixed(1).replace('.', ',')} ·{' '}
          {recette.avis.length} avis
        </span>
      )}
    </div>
  );
}

/** Pas de trou dans la ligne quand l'auteur a disparu : la date reste. */
function Auteur({ recette }: { recette: Recette }) {
  const pseudo = recette.auteur?.pseudo ?? null;

  return (
    <p className="mt-4 text-sm text-encre-55">
      {pseudo === null ? <em>auteur anonyme</em> : `Par ${pseudo}`} · publiée le{' '}
      {FORMAT_DATE.format(new Date(recette.dateCreation))}
    </p>
  );
}

function Meta({ recette }: { recette: Recette }) {
  const valeurs: [string, string][] = [
    ['Préparation', `${String(recette.tempsPreparation)} min`],
    [
      'Cuisson',
      recette.tempsCuisson === 0
        ? 'sans'
        : `${String(recette.tempsCuisson)} min`,
    ],
    ['Portions', String(recette.portions)],
    ['Difficulté', recette.difficulte],
  ];

  return (
    <dl className="mt-6 flex flex-wrap border-y border-trait">
      {valeurs.map(([intitule, valeur]) => (
        <div
          key={intitule}
          className="mr-5.5 grid gap-1 border-r border-trait py-3.5 pr-5.5 last:mr-0 last:border-r-0"
        >
          <dt className="text-xs tracking-bouton text-encre-55 uppercase">
            {intitule}
          </dt>
          <dd className="font-titre text-xl font-medium">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Categories({ recette }: { recette: Recette }) {
  const toutes = [
    ...recette.regimes,
    ...recette.criteresSante,
    ...recette.typesAliment,
    recette.nationalite,
  ];

  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {toutes.map((categorie, index) => (
        <li
          // Deux référentiels peuvent partager un id : la position départage.
          key={`${String(index)}-${categorie.nom}`}
          className="flex min-h-8 items-center rounded-pilule border border-trait-fort bg-craie px-3.5 text-sm text-encre-70"
        >
          {categorie.nom}
        </li>
      ))}
    </ul>
  );
}

function EnTeteRecette({ recette }: { recette: Recette }) {
  return (
    <header className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <p className="text-xs font-medium tracking-bouton text-ardoise uppercase">
          {recette.typeRecette} · {recette.nationalite.nom}
        </p>
        <h1 className="mt-2.5 text-4xl leading-none">{recette.titre}</h1>
        <Note recette={recette} />
        <p className="mt-4 text-base leading-relaxed text-encre-70">
          {recette.description}
        </p>
        <Auteur recette={recette} />
        <Meta recette={recette} />
        <Categories recette={recette} />
      </div>

      {/* Ratio 4:3 tenu par le cadre : l'arrivée de l'image ne décale rien. */}
      <div className="aspect-4/3 overflow-hidden rounded-md bg-lavande shadow-3">
        {recette.image !== '' && (
          <img src={recette.image} alt="" className="size-full object-cover" />
        )}
      </div>
    </header>
  );
}

function Ingredients({ compositions }: { compositions: Composition[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-trait bg-craie">
      <table className="w-full text-sm">
        <caption className="sr-only">Ingrédients de la recette</caption>
        <tbody>
          {compositions.map((composition) => (
            <tr
              key={composition.id}
              className="border-b border-trait last:border-0"
            >
              <td className="px-4 py-3">{composition.ingredient.nom}</td>
              {/* Alignée à droite : l'œil compare les quantités en colonne. */}
              <td className="px-4 py-3 text-right whitespace-nowrap text-ardoise">
                {formaterQuantite(composition.quantite)}{' '}
                {composition.quantite !== null && (
                  <span className="text-encre-55">
                    {libelleUnite(composition.unite)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DetailRecette({
  params,
  actionData,
}: Route.ComponentProps) {
  const recette = useRecette(Number(params.id));
  const { session } = useSession();

  return (
    <article className="mx-auto max-w-300">
      <FilDAriane recette={recette} />
      <EnTeteRecette recette={recette} />

      <SectionsRecette
        nombreAvis={recette.avis.length}
        ingredients={
          <>
            <Ingredients compositions={recette.compositions} />
            {recette.video !== null && (
              <div className="mt-10">
                <TitreDeSection>Vidéo</TitreDeSection>
                <VideoDeLaRecette video={recette.video} />
              </div>
            )}
          </>
        }
        etapes={<Etapes etapes={recette.etapes} />}
        avis={
          <ZoneAvis
            recetteId={recette.id}
            avis={recette.avis}
            session={session}
            echec={actionData ?? null}
          />
        }
      />
    </article>
  );
}
