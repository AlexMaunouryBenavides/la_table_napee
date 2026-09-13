import type { RecetteResume } from '@recipe/types';
import { Link } from 'react-router';

import { LIBELLES_TYPE } from '../libelles';

import { Etoiles } from './etoiles';

function Illustration({ recette }: { recette: RecetteResume }) {
  return (
    // Ratio 4:3 fixé par le conteneur : l'arrivée de l'image ne décale rien.
    <div className="relative aspect-4/3 bg-lavande">
      {/* `alt` vide : le titre est juste en dessous, la photo n'ajoute rien qu'un
          lecteur d'écran doive annoncer deux fois. Sans image, l'aplat reste. */}
      {recette.image !== '' && (
        <img
          src={recette.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <span className="absolute top-2.5 left-2.5 rounded-pilule bg-nappe/94 px-2.5 py-1 text-xs font-medium tracking-section text-ardoise-fonce uppercase">
        {LIBELLES_TYPE[recette.typeRecette]}
      </span>
    </div>
  );
}

function Duree({ minutes, libelle }: { minutes: number; libelle: string }) {
  return (
    <li>
      <b className="font-normal text-encre-70">{minutes} min</b> {libelle}
    </li>
  );
}

export function CarteRecette({ recette }: { recette: RecetteResume }) {
  return (
    <li className="overflow-hidden rounded-md border border-trait bg-craie shadow-1">
      <Illustration recette={recette} />

      <div className="grid gap-2 p-4">
        <Etoiles note={recette.noteMoyenne} />
        <h3 className="text-xl leading-tight font-medium">
          <Link to={`/recettes/${String(recette.id)}`} className="text-encre">
            {recette.titre}
          </Link>
        </h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-encre-55">
          <Duree minutes={recette.tempsPreparation} libelle="préparation" />
          {recette.tempsCuisson === 0 ? (
            <li>sans cuisson</li>
          ) : (
            <Duree minutes={recette.tempsCuisson} libelle="cuisson" />
          )}
          <li>
            {recette.portions} portion{recette.portions > 1 ? 's' : ''}
          </li>
          <li>{recette.difficulte}</li>
          <li>{recette.nationalite}</li>
        </ul>
      </div>
    </li>
  );
}
