import { Link } from 'react-router';

import { EtatVide } from '../composants/etat-vide';

/**
 * Deux vides, deux causes, deux sorties. Proposer « le catalogue ouvre bientôt » à
 * quelqu'un qui a simplement filtré trop fin ne l'aide en rien — et l'inverse non plus.
 */
export function CatalogueVide({ aDesFiltres }: { aDesFiltres: boolean }) {
  if (!aDesFiltres) {
    return (
      <EtatVide
        titre="Le catalogue ouvre bientôt"
        explication="Aucune recette n’a encore été publiée."
        glyphe="✦"
      />
    );
  }

  return (
    <EtatVide
      titre="Aucune recette ne répond à ces critères"
      explication="Vos filtres sont peut-être un peu trop serrés."
      glyphe="⌕"
      action={
        <Link to="/recettes" className="underline">
          Retirer tous les filtres
        </Link>
      }
    />
  );
}
