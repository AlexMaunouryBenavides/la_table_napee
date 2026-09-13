import { Outlet } from 'react-router';

import { useSession } from '../session-courante';

import { EnTeteSite } from './en-tete-site';
import { OngletsSite } from './onglets-site';
import { PiedDePage } from './pied-de-page';

// Écrans 1 à 6 : accueil, catalogue, détail d'une recette, mon compte.
export default function CoquillePublique() {
  const { session } = useSession();

  return (
    // En bas sur petit écran, la place des onglets : sans elle, ils masqueraient le
    // pied de page et la fin du contenu.
    <div className="flex min-h-dvh flex-col bg-nappe pb-14 lg:pb-0">
      <EnTeteSite />

      <main className="flex-1 px-5 py-10 md:px-10">
        <Outlet />
      </main>

      <PiedDePage />
      <OngletsSite connecte={session !== null} />
    </div>
  );
}
