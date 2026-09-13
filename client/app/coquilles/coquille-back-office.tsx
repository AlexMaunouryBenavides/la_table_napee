import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';

import { type Session } from '../acces-api/session';
import { AccesRefuse } from '../composants/acces-refuse';
import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EtiquetteRole } from '../composants/etiquette-role';
import { useDeconnexion, useSession } from '../session-courante';

import { peutAcceder, roleExigePour } from './acces-panneau';
import { sectionsPour, type SectionPanneau } from './entrees-panneau';

// Hors de `sectionsPour` : le site public est ouvert à tous, cette section ne dépend
// d'aucun rôle.
const SITE: SectionPanneau = {
  titre: 'Site',
  entrees: [{ libelle: 'Voir le site public', vers: '/' }],
};

function Section({ section }: { section: SectionPanneau }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-xs tracking-section text-nappe/55 uppercase">
        {section.titre}
      </p>
      <ul className="grid gap-1">
        {section.entrees.map((entree) => (
          <li key={entree.vers}>
            <NavLink
              to={entree.vers}
              end
              className={({ isActive }) =>
                `flex min-h-10 items-center rounded-sm px-3 text-sm hover:text-nappe hover:no-underline ${
                  isActive ? 'bg-nappe/15 text-nappe' : 'text-nappe/82'
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

function CompteConnecte({ session }: { session: NonNullable<Session> }) {
  const seDeconnecterEtRevalider = useDeconnexion();

  return (
    <div className="mt-auto grid justify-items-start gap-1 border-t border-nappe/20 px-3 pt-4 text-sm text-nappe/70">
      {session.pseudo !== null && <span>{session.pseudo}</span>}
      <span className="break-all">{session.email}</span>
      {/* Liseré clair : l'étiquette « admin » est ardoise, comme la barre. */}
      <span className="mt-1.5 inline-flex rounded-pilule ring-1 ring-nappe/40">
        <EtiquetteRole role={session.role} />
      </span>
      <button
        type="button"
        className="py-1.5 text-nappe underline"
        onClick={seDeconnecterEtRevalider}
      >
        Se déconnecter
      </button>
    </div>
  );
}

function NavigationLaterale({
  sections,
  session,
}: {
  sections: SectionPanneau[];
  session: Session;
}) {
  return (
    <nav
      aria-label="Navigation du panneau"
      className="flex h-full w-59 shrink-0 flex-col gap-6 bg-ardoise px-4 py-6"
    >
      <Link
        to="/panneau"
        aria-label="La Table Nappée"
        className="px-3 font-signature text-2xl whitespace-nowrap text-nappe hover:text-nappe hover:no-underline"
      >
        La Table Nappée
      </Link>

      {[...sections, SITE].map((section) => (
        <Section key={section.titre} section={section} />
      ))}

      {/* Proposer de se déconnecter à qui n'est pas connecté n'a pas de sens, et
          laisse croire qu'une session existe. */}
      {session !== null && <CompteConnecte session={session} />}
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
        <NavigationLaterale sections={sections} session={session} />
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

        {/* La colonne est bornée : tableaux et formulaires étalés sur 1900 px se
            lisent mal, et rien ici ne gagne à la pleine largeur. */}
        <main className="mx-auto max-w-320 p-5 md:p-10">
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
