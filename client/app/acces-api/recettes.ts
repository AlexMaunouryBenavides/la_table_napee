import type { Page, Recette, RecetteResume } from '@recipe/types';

import { appelerApi } from './appeler-api';

/**
 * Liste paginée du catalogue. Les critères viennent de l'URL de l'écran et partent
 * tels quels : l'API est seule juge de ce qu'elle accepte.
 */
export function listerRecettes(
  criteres: URLSearchParams,
): Promise<Page<RecetteResume>> {
  const requete = criteres.toString();

  return appelerApi<Page<RecetteResume>>(
    requete === '' ? '/recettes' : `/recettes?${requete}`,
  );
}

/** Recette complète : compositions, étapes déjà triées, avis et note moyenne. */
export function obtenirRecette(id: number): Promise<Recette> {
  return appelerApi<Recette>(`/recettes/${String(id)}`);
}

/** UC-13 — la recette part avec ses ingrédients, ses étapes et ses avis : ceux-ci
 *  n'existent pas sans elle (`ON DELETE CASCADE`). */
export function supprimerRecette(id: number): Promise<void> {
  return appelerApi<void>(`/recettes/${String(id)}`, { methode: 'DELETE' });
}

/** UC-11 et UC-12 — un seul envoi, jamais partiel. Le corps est le même dans les deux
 *  cas : seul le verbe change. */
export function creerRecette(corps: unknown): Promise<Recette> {
  return appelerApi<Recette>('/recettes', { methode: 'POST', corps });
}

export function modifierRecette(id: number, corps: unknown): Promise<Recette> {
  return appelerApi<Recette>(`/recettes/${String(id)}`, {
    methode: 'PATCH',
    corps,
  });
}
