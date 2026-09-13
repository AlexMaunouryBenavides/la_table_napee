import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
// `vitest/config` étend le `defineConfig` de Vite avec la clé `test` ; la
// configuration de build reste identique.
import { defineConfig } from 'vitest/config';

// Le plugin React Router sert l'application ; en test il reste en dehors, sinon il
// réclame le contexte d'un vrai serveur de développement pour rendre un composant.
const enTest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: enTest ? [tailwindcss()] : [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/preparation.ts'],
    include: ['app/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
});
