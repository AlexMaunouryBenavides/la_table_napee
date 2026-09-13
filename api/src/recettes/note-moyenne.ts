import { type Avis } from '../avis/entities/avis.entity';

const DECIMALES = 1;

// La moyenne n'est PAS stockée : la recalculer évite qu'elle diverge des avis.
// Sans aucun avis elle vaut `null`, jamais 0 — 0 signifierait « très mal notée ».
export function calculerNoteMoyenne(avis: Avis[]): number | null {
  if (avis.length === 0) {
    return null;
  }
  const somme = avis.reduce((total, un) => total + un.note, 0);
  return Number((somme / avis.length).toFixed(DECIMALES));
}
