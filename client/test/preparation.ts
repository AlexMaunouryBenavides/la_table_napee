// Chargé avant chaque fichier de test (voir `test.setupFiles` dans vite.config.ts).

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom garde le même document entre deux tests d'un même fichier : sans ce démontage,
// un test verrait les composants rendus par le précédent.
afterEach(() => {
  cleanup();
});
