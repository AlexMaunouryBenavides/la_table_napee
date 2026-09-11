import type { Avis } from '@recipe/types';

import { appelerApi } from './appeler-api';

type CorpsAvis = { note: number; commentaire: string | null };

/** Un seul avis par personne et par recette : un second dépôt vaut un 409. */
export function deposerAvis(
  recetteId: number,
  corps: CorpsAvis,
): Promise<Avis> {
  return appelerApi<Avis>(`/recettes/${String(recetteId)}/avis`, {
    methode: 'POST',
    corps,
  });
}

export function modifierAvis(id: number, corps: CorpsAvis): Promise<Avis> {
  return appelerApi<Avis>(`/avis/${String(id)}`, {
    methode: 'PATCH',
    corps,
  });
}

export function supprimerAvis(id: number): Promise<void> {
  return appelerApi<void>(`/avis/${String(id)}`, { methode: 'DELETE' });
}
