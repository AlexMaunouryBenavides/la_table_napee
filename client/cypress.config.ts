import { defineConfig } from 'cypress';

// Un écran de bureau : les parcours éprouvent la mise en page large, celle où les
// trois sections d'une recette sont visibles ensemble.
const LARGEUR_ECRAN = 1280;
const HAUTEUR_ECRAN = 800;

/**
 * Les parcours tournent sur le VRAI front et la VRAIE API, branchés sur la base de
 * test : `npm run test:cypress` (à la racine) démarre les deux sur des ports à part,
 * pour ne jamais toucher à l'environnement de développement.
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: LARGEUR_ECRAN,
    viewportHeight: HAUTEUR_ECRAN,
    video: false,
    // `expose` et non `env` (retiré en Cypress 16) : une URL n'a rien de secret.
    expose: { apiUrl: 'http://localhost:3100/api' },
  },
});
