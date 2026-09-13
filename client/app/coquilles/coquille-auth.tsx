import type { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

type Vitrine = { accroche: ReactNode; corps: ReactNode; note: string };

// 82 % d'opacité sur l'ardoise : 7,1:1, bien au-delà du seuil AA. L'acier reste
// réservé aux fragments en italique, qui sont décoratifs.
const VITRINES: Record<'connexion' | 'inscription', Vitrine> = {
  connexion: {
    accroche: (
      <>
        Retrouvez vos avis et <em className="text-acier">vos recettes</em>
      </>
    ),
    corps: (
      <p>
        Un compte suffit pour donner son avis. La modération et la publication
        restent réservées à l’équipe.
      </p>
    ),
    note: 'Aucun jeton n’est stocké dans votre navigateur : votre session est un cookie sécurisé.',
  },
  inscription: {
    accroche: (
      <>
        Un compte, pour <em className="text-acier">donner votre avis</em>
      </>
    ),
    corps: (
      <ul className="list-disc space-y-1 pl-5">
        <li>Une note et un commentaire par recette</li>
        <li>Modifiable et supprimable à tout moment</li>
        <li>Un pseudo, sinon rien : aucun nom réel demandé</li>
      </ul>
    ),
    note: 'Nous ne demandons ni nom, ni téléphone, ni date de naissance.',
  },
};

function ColonneVitrine({ vitrine }: { vitrine: Vitrine }) {
  return (
    <aside className="hidden flex-col justify-between bg-ardoise p-10 md:flex">
      <Link
        to="/"
        aria-label="La Table Nappée"
        className="font-signature text-3xl text-nappe hover:text-nappe hover:no-underline"
      >
        La Table Nappée
      </Link>

      <div className="max-w-130 text-nappe">
        <h2 className="text-3xl leading-tight">{vitrine.accroche}</h2>
        <div className="mt-4 text-sm leading-relaxed text-nappe/82">
          {vitrine.corps}
        </div>
      </div>

      <p className="text-xs text-nappe/70">{vitrine.note}</p>
    </aside>
  );
}

// Écrans 4 et 5. Aucune navigation : sur un écran d'authentification, tout lien
// supplémentaire est une occasion de partir sans avoir fini.
export default function CoquilleAuth() {
  const { pathname } = useLocation();
  const vitrine =
    VITRINES[pathname.startsWith('/inscription') ? 'inscription' : 'connexion'];

  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <ColonneVitrine vitrine={vitrine} />

      <main className="flex items-center justify-center bg-nappe p-6 md:p-14">
        <div className="w-full max-w-132">
          <Link
            to="/"
            aria-label="La Table Nappée"
            className="mb-8 block font-signature text-3xl text-ardoise md:hidden"
          >
            La Table Nappée
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
