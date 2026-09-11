import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Enregistre chaque changement d'URL : c'est ainsi qu'un test COMPTE les navigations,
 * là où une simple lecture de l'URL finale ne dirait pas combien il en a fallu.
 */
export function SondeUrl({ journal }: { journal: string[] }) {
  const { search } = useLocation();

  useEffect(() => {
    journal.push(search);
  }, [search, journal]);

  return null;
}
