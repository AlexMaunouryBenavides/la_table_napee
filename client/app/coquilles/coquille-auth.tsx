import { Link, Outlet } from 'react-router';

// Écrans 4 et 5. Aucune navigation : sur un écran d'authentification, tout lien
// supplémentaire est une occasion de partir sans avoir fini.
export default function CoquilleAuth() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ardoise p-12 md:flex">
        <Link to="/" className="font-signature text-5xl text-nappe">
          La Table Nappée
        </Link>
        {/* 82 % d'opacité sur l'ardoise : 7,1:1, bien au-delà du seuil AA. */}
        <p className="max-w-100 text-lg text-nappe/82">
          Des recettes choisies, présentées comme elles le méritent.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-nappe p-6 md:p-12">
        <div className="w-full max-w-100">
          <Link
            to="/"
            className="font-signature text-4xl text-ardoise md:hidden"
          >
            La Table Nappée
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
