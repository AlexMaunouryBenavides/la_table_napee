import { Form, Link, NavLink } from 'react-router';

import { useSession } from '../session-courante';

// Les boutons de l'en-tête sont des LIENS (ils changent de page) habillés en boutons :
// même rendu que `Bouton` en taille sm, sans en détourner la sémantique.
const BOUTON_SM =
  'inline-flex h-8 items-center rounded-pilule px-4 text-xs tracking-bouton uppercase hover:no-underline';
const FANTOME = `${BOUTON_SM} border border-ardoise text-ardoise hover:bg-ardoise hover:text-nappe`;
const PRIMAIRE = `${BOUTON_SM} bg-ardoise text-nappe hover:bg-ardoise-fonce hover:text-nappe`;

function classeLien({ isActive }: { isActive: boolean }): string {
  return isActive
    ? 'relative text-sm font-medium text-ardoise after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:bg-ardoise'
    : 'text-sm text-encre';
}

function RechercheRapide() {
  return (
    // Une recherche est une LECTURE : method="get", donc l'URL porte le résultat et
    // le lien se partage.
    <Form
      action="/recettes"
      method="get"
      role="search"
      className="hidden md:block"
    >
      <input
        type="search"
        name="recherche"
        aria-label="Rechercher une recette"
        placeholder="Rechercher une recette…"
        className="h-10 w-52 rounded-pilule border border-trait-fort bg-craie px-4 text-sm"
      />
    </Form>
  );
}

function AccesVisiteur() {
  return (
    <>
      <Link to="/connexion" className={FANTOME}>
        Connexion
      </Link>
      <Link to="/inscription" className={PRIMAIRE}>
        Inscription
      </Link>
    </>
  );
}

function Avatar({ pseudo }: { pseudo: string | null }) {
  // `pseudo` est facultatif en base : sans lui, un « ? » neutre — surtout pas
  // l'initiale de l'e-mail, qui exposerait une donnée personnelle.
  const initiale = pseudo === null ? '?' : pseudo.charAt(0).toUpperCase();

  return (
    <Link
      to="/mon-compte"
      aria-label={pseudo === null ? 'Mon compte' : `Mon compte — ${pseudo}`}
      className="grid size-9.5 place-items-center rounded-full bg-lavande font-titre text-base font-semibold text-ardoise hover:no-underline"
    >
      <span aria-hidden="true">{initiale}</span>
    </Link>
  );
}

export function EnTeteSite() {
  const { session } = useSession();

  return (
    <header className="flex flex-wrap items-center gap-6 border-b border-trait bg-nappe px-5 py-4 md:px-10">
      <Link
        to="/"
        aria-label="La Table Nappée"
        className="font-signature text-3xl text-encre hover:no-underline"
      >
        La Table Nappée
      </Link>

      <nav aria-label="Navigation principale" className="flex gap-6">
        <NavLink to="/" end className={classeLien}>
          Accueil
        </NavLink>
        <NavLink to="/recettes" className={classeLien}>
          Catalogue
        </NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-6">
        <RechercheRapide />
        {session === null ? (
          <AccesVisiteur />
        ) : (
          <Avatar pseudo={session.pseudo} />
        )}
      </div>
    </header>
  );
}
