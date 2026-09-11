import type { RecetteResume } from '@recipe/types';
import { Link } from 'react-router';

import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';
import { Bandeau } from '../composants/bandeau';
import { EtatVide } from '../composants/etat-vide';
import { Etoiles } from '../composants/etoiles';

import type { Route } from './+types/accueil';

const RECETTES_MISES_EN_AVANT = 3;

type DonneesAccueil = {
  recettes: RecetteResume[];
  echec: string | null;
};

/**
 * La liste est chargée indépendamment du reste : son échec affiche un bandeau et
 * laisse la vitrine debout, il ne fait pas tomber la page.
 */
export async function clientLoader(): Promise<DonneesAccueil> {
  try {
    const page = await listerRecettes(
      new URLSearchParams({ limite: String(RECETTES_MISES_EN_AVANT) }),
    );

    return { recettes: page.donnees, echec: null };
  } catch (erreur) {
    return {
      recettes: [],
      echec:
        erreur instanceof ErreurApi
          ? erreur.message
          : 'Les recettes n’ont pas pu être chargées.',
    };
  }
}

function CarteRecette({ recette }: { recette: RecetteResume }) {
  return (
    <li className="rounded-md bg-craie p-5 shadow-1">
      <Etoiles note={recette.noteMoyenne} />
      <h3 className="mt-2 font-titre text-xl">
        <Link to={`/recettes/${String(recette.id)}`}>{recette.titre}</Link>
      </h3>
      <p className="mt-1 text-sm text-encre-55">
        {recette.nationalite} · {recette.difficulte} ·{' '}
        {recette.tempsPreparation + recette.tempsCuisson} min
      </p>
    </li>
  );
}

export default function Accueil({ loaderData }: Route.ComponentProps) {
  const { recettes, echec } = loaderData;

  return (
    <section className="mx-auto max-w-250">
      <h1 className="font-titre text-5xl">
        Des recettes choisies,{' '}
        <em className="text-ardoise">présentées comme elles le méritent</em>.
      </h1>

      <h2 className="mt-12 text-3xl">Les dernières publiées</h2>

      {echec !== null && (
        <Bandeau ton="erreur" message={echec} className="mt-6" />
      )}

      {echec === null && recettes.length === 0 && (
        <EtatVide
          titre="Le catalogue ouvre bientôt"
          explication="Aucune recette n’a encore été publiée."
          action={
            <Link to="/recettes" className="underline">
              Parcourir le catalogue
            </Link>
          }
          glyphe="✦"
        />
      )}

      {recettes.length > 0 && (
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {recettes.map((recette) => (
            <CarteRecette key={recette.id} recette={recette} />
          ))}
        </ul>
      )}
    </section>
  );
}
