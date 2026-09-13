import { useSyncExternalStore } from 'react';

// Le point de rupture du handoff : au-dessus, panneaux latéraux ; en dessous, tiroirs.
const REQUETE = '(min-width: 1024px)';

const mesurable = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function abonner(rappel: () => void): () => void {
  if (!mesurable()) {
    return () => undefined;
  }

  const media = window.matchMedia(REQUETE);
  media.addEventListener('change', rappel);

  return () => {
    media.removeEventListener('change', rappel);
  };
}

// Sans `matchMedia` (jsdom), on se comporte en bureau : c'est la mise en page par
// défaut, celle que les tests existants décrivent.
const lire = (): boolean =>
  mesurable() ? window.matchMedia(REQUETE).matches : true;

/**
 * `true` sur un écran large. Sert quand CACHER en CSS ne suffit pas : deux champs de
 * recherche montés en même temps se renverraient la valeur de l'URL, et le caché
 * écraserait la saisie du visible.
 */
export function useEcranLarge(): boolean {
  return useSyncExternalStore(abonner, lire, () => true);
}
