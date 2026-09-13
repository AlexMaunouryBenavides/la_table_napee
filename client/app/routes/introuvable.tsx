import { LienBouton } from '../composants/lien-bouton';
import { PageImpasse } from '../composants/page-impasse';

// Écran 12. Les suggestions dérivées des mots de l'URL restent à écrire : c'est un
// comportement (un appel à l'API), il viendra avec ses tests.
export default function Introuvable() {
  return (
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
  );
}
