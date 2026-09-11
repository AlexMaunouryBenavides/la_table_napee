import { Link } from 'react-router';

export function PiedDePage() {
  return (
    <footer className="mt-16 border-t border-trait bg-lin px-5 py-10 text-sm text-encre-55 md:px-10">
      <p className="font-signature text-2xl text-ardoise">La Table Nappée</p>
      <nav aria-label="Pied de page" className="mt-3 flex flex-wrap gap-6">
        <Link to="/">Accueil</Link>
        <Link to="/recettes">Catalogue</Link>
      </nav>
    </footer>
  );
}
