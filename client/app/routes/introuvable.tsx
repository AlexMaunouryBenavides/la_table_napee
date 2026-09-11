import { Link } from 'react-router';

import { PageImpasse } from '../composants/page-impasse';

// Écran 12. Les suggestions dérivées des mots de l'URL arrivent avec l'écran de
// catalogue : sans lui, il n'y a nulle part où envoyer le visiteur.
export default function Introuvable() {
  return (
    <PageImpasse
      code={404}
      titre="Cette page n’existe pas"
      explication="Le lien est peut-être ancien, ou la recette a été retirée."
      actions={
        <>
          <Link to="/recettes" className="underline">
            Parcourir le catalogue
          </Link>
          <Link to="/" className="underline">
            Retour à l’accueil
          </Link>
        </>
      }
    />
  );
}
