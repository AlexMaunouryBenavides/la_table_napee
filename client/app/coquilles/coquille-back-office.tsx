import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';

import { seDeconnecter } from '../acces-api/authentification';
import { type Session } from '../acces-api/session';
import { AccesRefuse } from '../composants/acces-refuse';
import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { useSession } from '../session-courante';

import { peutAcceder, roleExigePour } from './acces-panneau';
import { sectionsPour, type SectionPanneau } from './entrees-panneau';

function Section({ section }: { section: SectionPanneau }) {
  return (
    <div className="mb-6">
      <p className="px-3 text-xs tracking-section text-nappe/55 uppercase">
        {section.titre}
      </p>
      <ul className="mt-2">
        {section.entrees.map((entree) => (
          <li key={entree.vers}>
            <NavLink
              to={entree.vers}
              end
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-sm px-3 text-nappe/82 ${
                  isActive ? 'bg-nappe/15 text-nappe' : ''
                }`
              }
            >
              {entree.libelle}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavigationLaterale({
  sections,
  connecte,
}: {
  sections: SectionPanneau[];
  connecte: boolean;
}) {
  const naviguer = useNavigate();

  return (
    <nav
      aria-label="Navigation du panneau"
      className="flex h-full w-59 shrink-0 flex-col bg-ardoise p-4"
    >
      <Link
        to="/panneau"
        className="mb-8 px-3 font-signature text-3xl text-nappe"
      >
        La Table Nappée
      </Link>

      {sections.map((section) => (
        <Section key={section.titre} section={section} />
      ))}

      <div className="mt-auto border-t border-nappe/20 px-3 pt-4 text-sm">
        <Link to="/" className="block py-2 text-nappe/82">
          Voir le site public
        </Link>
        {/* Proposer de se déconnecter à qui n'est pas connecté n'a pas de sens, et
            laisse croire qu'une session existe. */}
        {connecte && (
          <Bouton
            variante="texte"
            taille="sm"
            className="!px-0 text-nappe"
            onClick={() => {
              void seDeconnecter().then(() => naviguer('/'));
            }}
          >
            Se déconnecter
          </Bouton>
        )}
      </div>
    </nav>
  );
}

/**
 * Trois cas, dans cet ordre :
 *
 * 1. session INDISPONIBLE — on ne sait pas qui est là. Ni contenu protégé, ni refus :
 *    afficher « accès interdit » ici serait un mensonge sur la cause, et l'utilisateur
 *    essaierait de se reconnecter alors que ce n'est pas le problème.
 * 2. session connue mais insuffisante — le refus, à l'URL demandée.
 * 3. le contenu.
 */
function ContenuDuPanneau({
  session,
  sessionIndisponible,
  chemin,
}: {
  session: Session;
  sessionIndisponible: boolean;
  chemin: string;
}) {
  if (sessionIndisponible) {
    return (
      <Bandeau
        ton="alerte"
        titre="Votre session n’a pas pu être vérifiée"
        message="Le service ne répond pas. Rechargez la page dans un instant."
      />
    );
  }

  if (session === null || !peutAcceder(session.role, chemin)) {
    return (
      <AccesRefuse
        roleCourant={session?.role ?? null}
        roleExige={roleExigePour(chemin)}
      />
    );
  }

  return <Outlet />;
}

// Écrans 7 à 11, et le 403 — qui s'affiche DANS cette coquille, à l'URL demandée.
export default function CoquilleBackOffice() {
  const { session, sessionIndisponible } = useSession();
  const { pathname } = useLocation();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const sections = sectionsPour(session?.role ?? 'utilisateur');

  return (
    <div className="flex min-h-dvh bg-nappe">
      <div
        className={`fixed inset-y-0 left-0 z-10 transition-transform md:static md:translate-x-0 ${
          tiroirOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavigationLaterale sections={sections} connecte={session !== null} />
      </div>

      <div className="flex-1">
        <div className="border-b border-trait px-5 py-3 md:hidden">
          <Bouton
            variante="fantome"
            taille="sm"
            aria-expanded={tiroirOuvert}
            onClick={() => {
              setTiroirOuvert(!tiroirOuvert);
            }}
          >
            Menu
          </Bouton>
        </div>

        <main className="p-5 md:p-10">
          <ContenuDuPanneau
            session={session}
            sessionIndisponible={sessionIndisponible}
            chemin={pathname}
          />
        </main>
      </div>
    </div>
  );
}
