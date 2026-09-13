import { Link, NavLink } from 'react-router';

import { type Session } from '../acces-api/session';
import { EtiquetteRole } from '../composants/etiquette-role';
import { useDeconnexion } from '../session-courante';

import { type SectionPanneau } from './entrees-panneau';

// Hors de `sectionsPour` : le site public est ouvert à tous, cette section ne dépend
// d'aucun rôle.
const SITE: SectionPanneau = {
  titre: 'Site',
  entrees: [{ libelle: 'Voir le site public', vers: '/' }],
};

function Section({
  section,
  surNavigation,
}: {
  section: SectionPanneau;
  surNavigation?: () => void;
}) {
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
              onClick={surNavigation}
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

/**
 * La barre latérale du panneau : colonne fixe sur grand écran, contenu du tiroir sur
 * petit écran. `surNavigation` ferme le tiroir quand on choisit une entrée.
 */
export function NavigationLaterale({
  sections,
  session,
  surNavigation,
}: {
  sections: SectionPanneau[];
  session: Session;
  surNavigation?: () => void;
}) {
  return (
    <nav
      aria-label="Navigation du panneau"
      className="flex h-full min-h-dvh w-59 shrink-0 flex-col gap-6 bg-ardoise px-4 py-6"
    >
      <Link
        to="/panneau"
        aria-label="La Table Nappée"
        onClick={surNavigation}
        className="px-3 font-signature text-2xl whitespace-nowrap text-nappe hover:text-nappe hover:no-underline"
      >
        La Table Nappée
      </Link>

      {[...sections, SITE].map((section) => (
        <Section
          key={section.titre}
          section={section}
          surNavigation={surNavigation}
        />
      ))}

      {/* Proposer de se déconnecter à qui n'est pas connecté n'a pas de sens, et
          laisse croire qu'une session existe. */}
      {session !== null && <CompteConnecte session={session} />}
    </nav>
  );
}
