import type { RecetteResume } from '@recipe/types';

import { CarteRecette } from '../composants/carte-recette';

/** Rien à proposer, rien d'affiché : un bloc vide ou tiré au hasard serait du bruit. */
export function SuggestionsRecettes({
  recettes,
}: {
  recettes: RecetteResume[];
}) {
  if (recettes.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-190 pb-16">
      <h2 className="text-center text-2xl">Peut-être cherchiez-vous</h2>
      <ul className="mt-6 grid gap-5 sm:grid-cols-3">
        {recettes.map((recette) => (
          <CarteRecette key={recette.id} recette={recette} />
        ))}
      </ul>
    </section>
  );
}
