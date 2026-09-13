import {
  requeteRecettesAccueil,
  useRecettesAccueil,
} from '../accueil/recettes-accueil';
import { Vitrine } from '../accueil/vitrine';
import { clientRequetes } from '../requetes/client-requetes';

/** Remplit le cache avant l'affichage ; `prefetchQuery` ne lève jamais, une panne
 *  reste dans la requête et l'écran l'affiche. */
export async function clientLoader(): Promise<null> {
  await clientRequetes.prefetchQuery(requeteRecettesAccueil);
  return null;
}

export default function Accueil() {
  const { recettes, total, echec } = useRecettesAccueil();

  return <Vitrine recettes={recettes} total={total} echec={echec} />;
}
