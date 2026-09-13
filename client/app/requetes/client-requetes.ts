import { QueryClient } from '@tanstack/react-query';

const UNE_MINUTE = 60_000;

/**
 * Un seul cache pour toute l'application, au niveau du module : les `clientLoader` de
 * React Router le remplissent et les mutations l'invalident, hors de tout rendu.
 */
export const clientRequetes = new QueryClient({
  defaultOptions: {
    queries: {
      // Une donnée lue il y a moins d'une minute se réaffiche sans nouvel appel.
      staleTime: UNE_MINUTE,
      // Pas de nouvel essai automatique : un 401 ou un 404 ne changera pas en
      // insistant, et une panne s'affiche avec son bouton « Réessayer ».
      retry: false,
    },
  },
});
