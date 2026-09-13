import { NavLink } from 'react-router';

export type Onglet = {
  libelle: string;
  vers: string;
  /** Actif sur ce chemin EXACT seulement : « Accueil » ne s'allume pas partout. */
  exact?: boolean;
};

/**
 * La barre d'onglets du bas, sur petit écran. Des liens, pas des boutons : chaque
 * onglet est une page, qu'on doit pouvoir ouvrir dans un nouvel onglet ou partager.
 */
export function BarreOnglets({
  libelle,
  onglets,
}: {
  libelle: string;
  onglets: Onglet[];
}) {
  return (
    <nav
      aria-label={libelle}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-trait bg-craie"
    >
      <ul className="flex">
        {onglets.map((onglet) => (
          <li key={onglet.vers} className="flex-1">
            <NavLink
              to={onglet.vers}
              end={onglet.exact === true}
              className={({ isActive }) =>
                `flex min-h-14 items-center justify-center text-xs tracking-section hover:no-underline ${
                  isActive ? 'font-medium text-ardoise' : 'text-encre-55'
                }`
              }
            >
              {onglet.libelle}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
