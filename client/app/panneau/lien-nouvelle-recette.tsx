import { Link } from 'react-router';

import { CREATION_RECETTE } from './raccourcis';

/** Un lien (on change de page) habillé en bouton primaire de petite taille. */
export function LienNouvelleRecette() {
  return (
    <Link
      to={CREATION_RECETTE}
      className="inline-flex h-8 items-center rounded-pilule bg-ardoise px-4 text-xs tracking-bouton text-nappe uppercase hover:bg-ardoise-fonce hover:text-nappe hover:no-underline"
    >
      Nouvelle recette
    </Link>
  );
}
