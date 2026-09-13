import {
  index,
  layout,
  route,
  type RouteConfig,
} from '@react-router/dev/routes';

// Les 14 écrans de `design/ecrans.md`, groupés par coquille. Le français est la langue
// de l'URL comme du reste. Aucune route qui ne corresponde à un écran conçu, aucun
// écran conçu sans sa route.
//
// Les écrans 13 (403) et 14 (erreur inattendue) n'apparaissent pas ici : ce ne sont pas
// des destinations mais des états d'erreur, rendus par les `ErrorBoundary` de segment.
export default [
  // Écrans 1 à 3 et 6 — en-tête de site public.
  layout('coquilles/coquille-publique.tsx', [
    index('routes/accueil.tsx'),
    route('recettes', 'routes/catalogue.tsx'),
    route('recettes/:id', 'routes/detail-recette.tsx'),
    route('mon-compte', 'routes/mon-compte.tsx'),
    // Écran 12 — toute URL inconnue, AVEC l'en-tête et le pied de page : une impasse
    // sans navigation est une impasse dont on ne sort pas.
    route('*', 'routes/introuvable.tsx'),
  ]),

  // Écrans 4 et 5 — coquille d'authentification, sans navigation qui distraie.
  layout('coquilles/coquille-auth.tsx', [
    route('connexion', 'routes/connexion.tsx'),
    route('inscription', 'routes/inscription.tsx'),
  ]),

  // Écrans 7 à 11 — back-office.
  layout('coquilles/coquille-back-office.tsx', [
    route('panneau', 'routes/panneau/accueil.tsx'),
    route('panneau/recettes', 'routes/panneau/recettes.tsx'),
    // Création et modification sont le MÊME écran : deux chemins, un seul fichier.
    route('panneau/recettes/nouvelle', 'routes/panneau/editeur-recette.tsx', {
      id: 'creation-recette',
    }),
    route(
      'panneau/recettes/:id/modifier',
      'routes/panneau/editeur-recette.tsx',
      { id: 'modification-recette' },
    ),
    route('panneau/utilisateurs', 'routes/panneau/utilisateurs.tsx'),
    // L'onglet vit dans l'URL : un lien vers « les régimes » se partage.
    route('panneau/categories/:ressource', 'routes/panneau/categories.tsx'),
  ]),
] satisfies RouteConfig;
