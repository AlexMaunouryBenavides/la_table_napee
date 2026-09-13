import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach } from 'vitest';

import { clientRequetes } from '../app/requetes/client-requetes';

// Le cache vit au niveau du module, comme en production : on le vide entre deux tests
// pour qu'aucun ne profite des données d'un autre.
afterEach(() => {
  clientRequetes.clear();
});

export function AvecRequetes({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={clientRequetes}>
      {children}
    </QueryClientProvider>
  );
}
