// L'URL est la source de vérité des critères de liste : recherche, filtres, tri, page.
// Recharger, partager un lien ou revenir en arrière fonctionne donc sans état client.

const PREMIERE_PAGE = 1;
const CLE_PAGE = 'page';

/**
 * Numéro de page demandé par l'URL. Une URL se trafique à la main : `page=0`,
 * `page=-3` ou `page=abc` retombent sur la première page plutôt que de produire une
 * requête absurde.
 */
export function lirePage(parametres: URLSearchParams): number {
  const brut = Number(parametres.get(CLE_PAGE));

  if (!Number.isInteger(brut) || brut < PREMIERE_PAGE) {
    return PREMIERE_PAGE;
  }

  return brut;
}

/**
 * Pose (ou retire, avec `null`) un critère et **ramène à la première page** : rester
 * page 7 après avoir changé de filtre montrerait un vide qui n'en est pas un.
 */
export function avecCritere(
  parametres: URLSearchParams,
  cle: string,
  valeur: string | null,
): URLSearchParams {
  const suivants = new URLSearchParams(parametres);

  if (valeur === null || valeur === '') {
    suivants.delete(cle);
  } else {
    suivants.set(cle, valeur);
  }

  suivants.set(CLE_PAGE, String(PREMIERE_PAGE));

  return suivants;
}

/** Change de page en conservant les critères : paginer n'est pas filtrer. */
export function avecPage(
  parametres: URLSearchParams,
  page: number,
): URLSearchParams {
  const suivants = new URLSearchParams(parametres);
  suivants.set(CLE_PAGE, String(page));

  return suivants;
}
