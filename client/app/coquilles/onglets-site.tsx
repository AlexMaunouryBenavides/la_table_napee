import { BarreOnglets } from '../composants/barre-onglets';
import { useEcranLarge } from '../composants/use-ecran-large';

/**
 * Les onglets du site public sur petit écran. « Compte » mène là où l'on peut agir :
 * sa page si l'on est connecté, la connexion sinon — jamais vers un écran qui ne ferait
 * que renvoyer ailleurs.
 */
export function OngletsSite({ connecte }: { connecte: boolean }) {
  const large = useEcranLarge();

  if (large) {
    return null;
  }

  return (
    <BarreOnglets
      libelle="Onglets du site"
      onglets={[
        { libelle: 'Accueil', vers: '/', exact: true },
        { libelle: 'Catalogue', vers: '/recettes' },
        { libelle: 'Compte', vers: connecte ? '/mon-compte' : '/connexion' },
      ]}
    />
  );
}
