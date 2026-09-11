import type { Page, RecetteResume } from '@recipe/types';

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
