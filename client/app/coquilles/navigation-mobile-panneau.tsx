import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';

import { type Session } from '../acces-api/session';
import { BarreOnglets } from '../composants/barre-onglets';
import { useClavierDeModale } from '../composants/modale-confirmation';
import { useEcranLarge } from '../composants/use-ecran-large';

import { ongletsPanneau, type SectionPanneau } from './entrees-panneau';
import { NavigationLaterale } from './navigation-laterale';

type ProprietesNavigation = {
  sections: SectionPanneau[];
  session: Session;
};

function TiroirNavigation({
  sections,
  session,
  surFermeture,
}: ProprietesNavigation & { surFermeture: () => void }) {
  const panneau = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panneau.current?.querySelector<HTMLElement>('a, button')?.focus();
  }, [panneau]);

  useClavierDeModale(panneau, surFermeture);

  return createPortal(
    <div className="fixed inset-0 z-30 flex bg-encre/40">
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation du panneau"
        className="relative h-full overflow-y-auto shadow-4"
      >
        <NavigationLaterale
          sections={sections}
          session={session}
          surNavigation={surFermeture}
        />
        <button
          type="button"
          onClick={surFermeture}
          className="absolute top-5 right-3 grid size-10 place-items-center text-2xl text-nappe"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Fermer le menu</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

function EnTeteMobilePanneau({
  bouton,
  ouvert,
  surOuverture,
}: {
  bouton: React.RefObject<HTMLButtonElement | null>;
  ouvert: boolean;
  surOuverture: () => void;
}) {
  return (
    <header className="flex items-center gap-3 bg-ardoise px-5 py-3.5">
      <button
        ref={bouton}
        type="button"
        aria-expanded={ouvert}
        onClick={surOuverture}
        className="grid size-10 place-items-center text-2xl text-nappe"
      >
        <span aria-hidden="true">☰</span>
        <span className="sr-only">Ouvrir le menu</span>
      </button>
      <Link
        to="/panneau"
        aria-label="La Table Nappée"
        className="font-signature text-2xl text-nappe hover:text-nappe hover:no-underline"
      >
        La Table Nappée
      </Link>
    </header>
  );
}

/**
 * Le panneau sur petit écran : un en-tête ardoise avec le menu, le tiroir de
 * navigation, et les onglets du bas. Rien de tout cela sur grand écran, où la barre
 * latérale reste en place.
 */
export function NavigationMobilePanneau({
  sections,
  session,
}: ProprietesNavigation) {
  const large = useEcranLarge();
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);

  if (large) {
    return null;
  }

  function fermer() {
    setOuvert(false);
    // Le focus revient d'où il est parti : sinon il retombe en haut de page.
    bouton.current?.focus();
  }

  return (
    <>
      <EnTeteMobilePanneau
        bouton={bouton}
        ouvert={ouvert}
        surOuverture={() => {
          setOuvert(true);
        }}
      />

      {ouvert && (
        <TiroirNavigation
          sections={sections}
          session={session}
          surFermeture={fermer}
        />
      )}

      {session !== null && (
        <BarreOnglets
          libelle="Onglets du panneau"
          onglets={ongletsPanneau(session.role).map((onglet) => ({
            ...onglet,
            exact: onglet.vers === '/panneau',
          }))}
        />
      )}
    </>
  );
}
