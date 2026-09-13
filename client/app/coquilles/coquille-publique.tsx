import { Outlet } from 'react-router';

import { EnTeteSite } from './en-tete-site';
import { PiedDePage } from './pied-de-page';

// Écrans 1 à 6 : accueil, catalogue, détail d'une recette, mon compte.
export default function CoquillePublique() {
  return (
    <div className="flex min-h-dvh flex-col bg-nappe">
      <EnTeteSite />

      <main className="flex-1 px-5 py-10 md:px-10">
        <Outlet />
      </main>

      <PiedDePage />
    </div>
  );
}
