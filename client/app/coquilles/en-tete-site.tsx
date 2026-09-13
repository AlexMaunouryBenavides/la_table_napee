import { Form, Link } from 'react-router';

import { Bouton } from '../composants/bouton';
import { useDeconnexion, useSession } from '../session-courante';

function RechercheRapide() {
  return (
    // Une recherche est une LECTURE : method="get", donc l'URL porte le résultat et
    // le lien se partage.
    <Form action="/recettes" method="get" role="search">
      <input
        type="search"
        name="recherche"
        aria-label="Rechercher une recette"
        placeholder="Rechercher…"
        className="h-11 w-56 rounded-pilule border border-trait-fort bg-craie px-4"
      />
    </Form>
  );
}

function AccesVisiteur() {
  return (
    <>
      <Link to="/connexion">Connexion</Link>
      <Link to="/inscription" className="text-ardoise underline">
        Inscription
      </Link>
    </>
  );
}

function AccesConnecte({ pseudo }: { pseudo: string | null }) {
  const seDeconnecterEtRevalider = useDeconnexion();

  return (
    <>
      {/* `pseudo` est facultatif en base : jamais « Bonjour, null », et surtout pas
          l'e-mail en remplacement — ce serait exposer une donnée personnelle. */}
      <Link to="/mon-compte">{pseudo ?? 'Mon compte'}</Link>
      <Bouton variante="texte" taille="sm" onClick={seDeconnecterEtRevalider}>
        Se déconnecter
      </Bouton>
    </>
  );
}

export function EnTeteSite() {
  const { session } = useSession();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-trait bg-craie px-5 py-4 md:px-10">
      <Link to="/" className="font-signature text-4xl text-ardoise">
        La Table Nappée
      </Link>

      <nav
        aria-label="Navigation principale"
        className="flex flex-wrap items-center gap-6 text-base"
      >
        <Link to="/recettes">Catalogue</Link>
        <RechercheRapide />
        {session === null ? (
          <AccesVisiteur />
        ) : (
          <AccesConnecte pseudo={session.pseudo} />
        )}
      </nav>
    </header>
  );
}
