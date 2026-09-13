import type { RecetteResume } from '@recipe/types';

import { LienBouton } from '../composants/lien-bouton';
import { PageImpasse } from '../composants/page-impasse';

import { SuggestionsRecettes } from './suggestions-recettes';

/**
 * Écran 12, sans son chargement : la route 404 lui passe ses suggestions, et le filet
 * d'erreur de la racine l'affiche sans — il n'a pas de données à lui donner.
 */
export function PageIntrouvable({
  suggestions,
}: {
  suggestions: RecetteResume[];
}) {
  return (
    <>
      <PageImpasse
        code={404}
        titre="Cette page n’existe pas — ou plus"
        explication="L’adresse est peut-être mal recopiée, ou la recette a été retirée du catalogue. Les autres sont toujours là."
        actions={
          <>
            <LienBouton vers="/recettes" variante="primaire">
              Parcourir le catalogue
            </LienBouton>
            <LienBouton vers="/" variante="fantome">
              Retour à l’accueil
            </LienBouton>
          </>
        }
      />
      <SuggestionsRecettes recettes={suggestions} />
    </>
  );
}
