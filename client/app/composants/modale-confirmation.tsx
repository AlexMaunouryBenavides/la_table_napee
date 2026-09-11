import { useEffect, useId, useRef, useState } from 'react';

import { Bouton } from './bouton';

const SELECTEUR_FOCALISABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type ProprietesModale = {
  titre: string;
  corps: string;
  /** Nomme l'action (« Supprimer la recette »), jamais « OK ». */
  libelleConfirmation: string;
  /** Mot à recopier à l'identique pour les actions irréversibles. */
  motDeConfirmation?: string;
  destructive?: boolean;
  surAnnulation: () => void;
  surConfirmation: () => void;
};

/**
 * Le focus part sur Annuler — jamais sur le bouton destructeur — et revient au
 * déclencheur à la fermeture : sinon l'utilisateur au clavier est renvoyé en haut de
 * page sans savoir pourquoi.
 */
function useFocusDeModale(
  annulation: React.RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    const declencheur = document.activeElement as HTMLElement | null;
    annulation.current?.focus();

    return () => {
      declencheur?.focus();
    };
  }, [annulation]);
}

/**
 * Le confinement du focus n'est garanti par le navigateur que pour un `<dialog>` ouvert
 * en modal, et jsdom ne l'implémente pas du tout : on le tient donc nous-mêmes, ce qui
 * a l'avantage d'être vérifiable par un test.
 */
function piegerTabulation(
  evenement: KeyboardEvent,
  panneau: HTMLDivElement | null,
) {
  const focalisables = panneau?.querySelectorAll<HTMLElement>(
    SELECTEUR_FOCALISABLE,
  );

  if (focalisables === undefined || focalisables.length === 0) {
    return;
  }

  const premier = focalisables[0];
  const dernier = focalisables[focalisables.length - 1];
  const bordAtteint = evenement.shiftKey ? premier : dernier;

  if (document.activeElement !== bordAtteint) {
    return;
  }

  evenement.preventDefault();
  (evenement.shiftKey ? dernier : premier)?.focus();
}

/**
 * Le clavier est écouté sur le document, pas sur un nœud du panneau : `Échap` doit
 * fermer même si le focus a glissé ailleurs, et un gestionnaire posé sur un élément
 * non interactif serait de toute façon un contresens d'accessibilité.
 */
function useClavierDeModale(
  panneau: React.RefObject<HTMLDivElement | null>,
  surAnnulation: () => void,
) {
  useEffect(() => {
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') {
        surAnnulation();
      } else if (evenement.key === 'Tab') {
        piegerTabulation(evenement, panneau.current);
      }
    }

    document.addEventListener('keydown', surTouche);

    return () => {
      document.removeEventListener('keydown', surTouche);
    };
  }, [panneau, surAnnulation]);
}

function EnTeteDeModale({
  idTitre,
  idCorps,
  titre,
  corps,
}: {
  idTitre: string;
  idCorps: string;
  titre: string;
  corps: string;
}) {
  return (
    <>
      <h2 id={idTitre} className="text-2xl">
        {titre}
      </h2>
      <p id={idCorps} className="mt-3 text-base text-encre-70">
        {corps}
      </p>
    </>
  );
}

function PiedDeModale({
  libelleConfirmation,
  destructive,
  confirmationBloquee,
  refAnnulation,
  surAnnulation,
  surConfirmation,
}: {
  libelleConfirmation: string;
  destructive: boolean;
  confirmationBloquee: boolean;
  refAnnulation: React.RefObject<HTMLButtonElement | null>;
  surAnnulation: () => void;
  surConfirmation: () => void;
}) {
  return (
    <div className="mt-8 flex justify-end gap-3">
      <Bouton ref={refAnnulation} variante="fantome" onClick={surAnnulation}>
        Annuler
      </Bouton>
      <Bouton
        variante={destructive ? 'danger' : 'primaire'}
        disabled={confirmationBloquee}
        onClick={surConfirmation}
      >
        {libelleConfirmation}
      </Bouton>
    </div>
  );
}

function ChampDeConfirmation({
  mot,
  saisie,
  surSaisie,
}: {
  mot: string;
  saisie: string;
  surSaisie: (valeur: string) => void;
}) {
  const id = useId();

  return (
    <div className="mt-5">
      <label
        htmlFor={id}
        className="block text-xs tracking-etiquette text-encre-70 uppercase"
      >
        Tapez {mot} pour confirmer
      </label>
      <input
        id={id}
        value={saisie}
        onChange={(evenement) => {
          surSaisie(evenement.target.value);
        }}
        className="mt-1 h-11 w-full rounded-sm border border-trait-fort bg-nappe px-3"
      />
    </div>
  );
}

/** Le panneau lui-même : c'est lui qui porte le rôle et les liens d'accessibilité. */
type ProprietesPanneau = {
  proprietes: ProprietesModale;
  refPanneau: React.RefObject<HTMLDivElement | null>;
  refAnnulation: React.RefObject<HTMLButtonElement | null>;
  saisie: string;
  surSaisie: (valeur: string) => void;
};

function PanneauDeModale({
  proprietes,
  refPanneau,
  refAnnulation,
  saisie,
  surSaisie,
}: ProprietesPanneau) {
  const idTitre = useId();
  const idCorps = useId();
  const { motDeConfirmation } = proprietes;
  const motExige = motDeConfirmation !== undefined;
  // Comparaison à l'identique : « supprimer » ne vaut pas « SUPPRIMER ».
  const motRecopie = motExige && saisie === motDeConfirmation;

  return (
    <div
      ref={refPanneau}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      aria-describedby={idCorps}
      className="w-full max-w-120 rounded-lg bg-craie p-8 shadow-4"
    >
      <EnTeteDeModale
        idTitre={idTitre}
        idCorps={idCorps}
        titre={proprietes.titre}
        corps={proprietes.corps}
      />

      {motExige && (
        <ChampDeConfirmation
          mot={motDeConfirmation}
          saisie={saisie}
          surSaisie={surSaisie}
        />
      )}

      <PiedDeModale
        libelleConfirmation={proprietes.libelleConfirmation}
        destructive={proprietes.destructive ?? false}
        confirmationBloquee={motExige && !motRecopie}
        refAnnulation={refAnnulation}
        surAnnulation={proprietes.surAnnulation}
        surConfirmation={proprietes.surConfirmation}
      />
    </div>
  );
}

export function ModaleConfirmation(proprietes: ProprietesModale) {
  const annulation = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const [saisie, setSaisie] = useState('');

  useFocusDeModale(annulation);
  useClavierDeModale(panneau, proprietes.surAnnulation);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-encre/40">
      <PanneauDeModale
        proprietes={proprietes}
        refPanneau={panneau}
        refAnnulation={annulation}
        saisie={saisie}
        surSaisie={setSaisie}
      />
    </div>
  );
}
