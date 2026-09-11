import type { RecetteResume } from '@recipe/types';
import { Link } from 'react-router';

import { LIBELLES_TYPE } from '../libelles';

import { Etoiles } from './etoiles';

export function CarteRecette({ recette }: { recette: RecetteResume }) {
  const typeLisible = LIBELLES_TYPE[recette.typeRecette];

  return (
    <li className="overflow-hidden rounded-md bg-craie shadow-1">
      {/* Aplat en attendant les vraies photos : on garde le ratio 4:3 pour que
          l'arrivée des images ne décale rien. */}
      <div className="flex aspect-4/3 items-center justify-center bg-lavande text-sm text-ardoise-clair">
        {typeLisible}
      </div>

      <div className="p-5">
        <Etoiles note={recette.noteMoyenne} />
        <h3 className="mt-2 font-titre text-xl">
          <Link to={`/recettes/${String(recette.id)}`}>{recette.titre}</Link>
        </h3>
        <p className="mt-1 text-sm text-encre-55">
          {recette.nationalite} · {recette.difficulte} ·{' '}
          {recette.tempsPreparation + recette.tempsCuisson} min
        </p>
      </div>
    </li>
  );
}
