import { Outlet, useLocation } from 'react-router';

import { type Session } from '../acces-api/session';
import { AccesRefuse } from '../composants/acces-refuse';
import { Bandeau } from '../composants/bandeau';
import { useEcranLarge } from '../composants/use-ecran-large';
import { useSession } from '../session-courante';

import { peutAcceder, roleExigePour } from './acces-panneau';
import { sectionsPour } from './entrees-panneau';
import { NavigationLaterale } from './navigation-laterale';
import { NavigationMobilePanneau } from './navigation-mobile-panneau';

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
  const large = useEcranLarge();
  const sections = sectionsPour(session?.role ?? 'utilisateur');

  return (
    <div className="flex min-h-dvh flex-col bg-nappe lg:flex-row">
      {/* Grand écran : la barre latérale. Petit écran : en-tête, tiroir et onglets. */}
      {large && <NavigationLaterale sections={sections} session={session} />}
      <NavigationMobilePanneau sections={sections} session={session} />

      {/* `min-w-0` : un enfant flex ne rétrécit pas sous sa largeur de contenu. Sans
          lui, un tableau large élargit la colonne, et c'est la PAGE qui défile en
          largeur au lieu du seul cadre du tableau. */}
      <div className="min-w-0 flex-1">
        {/* La colonne est bornée : tableaux et formulaires étalés sur 1900 px se
            lisent mal. En bas, la place des onglets mobiles. */}
        <main className="mx-auto max-w-320 p-5 pb-24 lg:p-10">
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
