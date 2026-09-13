import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router';

import { listerRecettes } from '../acces-api/recettes';
import { Bouton } from '../composants/bouton';
import { useClavierDeModale } from '../composants/modale-confirmation';

import { filtresActifs, type Referentiels } from './filtres-actifs';
import { CriteresDeFiltre } from './panneau-de-filtres';

const PREMIERE_PAGE = '1';

type Decompte = { cle: string; total: number };

/**
 * Combien de recettes donneraient les choix EN COURS, avant de les valider. Un appel
 * `limite=1` suffit : seul `total` compte. `null` tant qu'on ne sait pas — jamais un
 * nombre périmé affiché pour des choix qui ont changé.
 */
function useDecompte(brouillon: URLSearchParams): number | null {
  const cle = brouillon.toString();
  const [decompte, setDecompte] = useState<Decompte | null>(null);

  useEffect(() => {
    const criteres = new URLSearchParams(cle);
    criteres.delete('page');
    criteres.set('limite', '1');

    let abandonne = false;
    void listerRecettes(criteres)
      .then((page) => {
        if (!abandonne) {
          setDecompte({ cle, total: page.total });
        }
      })
      // Sans décompte, le bouton reste utilisable : il dit juste moins de choses.
      .catch(() => undefined);

    return () => {
      abandonne = true;
    };
  }, [cle]);

  return decompte !== null && decompte.cle === cle ? decompte.total : null;
}

function libelleValidation(total: number | null): string {
  if (total === null) {
    return 'Voir les recettes';
  }

  return total === 1 ? 'Voir la recette' : `Voir les ${String(total)} recettes`;
}

/** `Échap` ferme, `Tab` reste dans le tiroir, et le focus y entre à l'ouverture. */
function useClavierDuTiroir(
  panneau: React.RefObject<HTMLDivElement | null>,
  surFermeture: () => void,
) {
  // Le rappel change à chaque rendu : le garder dans une ref évite de rejouer les
  // effets — dont celui qui ramènerait le focus sur « Fermer » à chaque coche.
  const fermeture = useRef(surFermeture);

  useEffect(() => {
    fermeture.current = surFermeture;
  });

  const fermerStable = useCallback(() => {
    fermeture.current();
  }, []);

  useEffect(() => {
    panneau.current?.querySelector<HTMLElement>('button')?.focus();
  }, [panneau]);

  // `Échap` et `Tab` : la même règle que la modale de confirmation, pas une copie.
  useClavierDeModale(panneau, fermerStable);
}

/** Tout effacer, sauf le tri : trier n'est pas filtrer. */
function sansFiltres(brouillon: URLSearchParams): URLSearchParams {
  const vide = new URLSearchParams();
  const tri = brouillon.get('tri');

  if (tri !== null) {
    vide.set('tri', tri);
  }

  return vide;
}

function PiedDuTiroir({
  total,
  surEffacement,
  surValidation,
}: {
  total: number | null;
  surEffacement: () => void;
  surValidation: () => void;
}) {
  return (
    <footer className="flex gap-3 border-t border-trait bg-craie px-5 py-4">
      <Bouton variante="fantome" onClick={surEffacement}>
        Tout effacer
      </Bouton>
      <Bouton variante="primaire" className="flex-1" onClick={surValidation}>
        {libelleValidation(total)}
      </Bouton>
    </footer>
  );
}

type ProprietesPanneau = {
  referentiels: Referentiels;
  brouillon: URLSearchParams;
  surBrouillon: (suivant: URLSearchParams) => void;
  surFermeture: () => void;
  surValidation: () => void;
};

function PanneauDuTiroir({
  referentiels,
  brouillon,
  surBrouillon,
  surFermeture,
  surValidation,
}: ProprietesPanneau) {
  const panneau = useRef<HTMLDivElement>(null);
  const idTitre = useId();
  const total = useDecompte(brouillon);

  useClavierDuTiroir(panneau, surFermeture);

  return createPortal(
    <div className="fixed inset-0 z-30 flex flex-col bg-encre/40 pt-16">
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        className="mt-auto flex max-h-full flex-col rounded-t-lg bg-nappe shadow-4"
      >
        <header className="flex items-center justify-between border-b border-trait px-5 py-4">
          <h2 id={idTitre} className="text-2xl">
            Filtres
          </h2>
          <Bouton variante="texte" taille="sm" onClick={surFermeture}>
            Fermer
          </Bouton>
        </header>

        <div className="overflow-y-auto px-5 py-5">
          <CriteresDeFiltre
            referentiels={referentiels}
            controle={{ criteres: brouillon, surCriteres: surBrouillon }}
          />
        </div>

        <PiedDuTiroir
          total={total}
          surEffacement={() => {
            surBrouillon(sansFiltres(brouillon));
          }}
          surValidation={surValidation}
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Les filtres du catalogue sur un petit écran : un bouton, puis un tiroir. Les choix
 * s'y accumulent dans un BROUILLON — aucune requête à chaque coche — et ne partent
 * dans l'URL qu'à la validation. Fermer sans valider les abandonne.
 */
export function TiroirFiltres({
  referentiels,
}: {
  referentiels: Referentiels;
}) {
  const [parametres, setParametres] = useSearchParams();
  const [brouillon, setBrouillon] = useState<URLSearchParams | null>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const nombreActifs = filtresActifs(parametres, referentiels).length;

  function fermer() {
    setBrouillon(null);
    // Le focus revient d'où il est parti : sinon il retombe en haut de page.
    bouton.current?.focus();
  }

  return (
    <>
      <button
        ref={bouton}
        type="button"
        onClick={() => {
          setBrouillon(new URLSearchParams(parametres));
        }}
        className="inline-flex h-10 items-center rounded-pilule bg-ardoise px-4 text-xs tracking-bouton text-nappe uppercase"
      >
        Filtres{nombreActifs > 0 && ` · ${String(nombreActifs)}`}
      </button>

      {brouillon !== null && (
        <PanneauDuTiroir
          referentiels={referentiels}
          brouillon={brouillon}
          surBrouillon={setBrouillon}
          surFermeture={fermer}
          surValidation={() => {
            const suivants = new URLSearchParams(brouillon);
            suivants.set('page', PREMIERE_PAGE);
            setParametres(suivants);
            fermer();
          }}
        />
      )}
    </>
  );
}
