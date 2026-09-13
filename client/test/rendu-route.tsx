import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { clientRequetes } from '../app/requetes/client-requetes';
import { requeteSession } from '../app/requetes/session';

import { AvecRequetes } from './requetes';

/**
 * Rend des écrans de route comme l'application : session préchargée dans le cache
 * (ce que fait le loader racine), routeur et fournisseur de requêtes autour.
 */
export async function rendreRoutes(
  url: string,
  routes: Record<string, ReactElement>,
) {
  await clientRequetes.prefetchQuery(requeteSession);
  render(
    <MemoryRouter initialEntries={[url]}>
      <AvecRequetes>
        <Routes>
          {Object.entries(routes).map(([chemin, element]) => (
            <Route key={chemin} path={chemin} element={element} />
          ))}
        </Routes>
      </AvecRequetes>
    </MemoryRouter>,
  );
}
