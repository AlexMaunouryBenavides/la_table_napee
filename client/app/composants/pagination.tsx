import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

import { avecPage } from '../acces-api/criteres-url';

const PREMIERE_PAGE = 1;
const PAGES_SANS_ELLIPSE = 5;
const ELLIPSE = '…';

type ProprietesPagination = {
  /** Les trois viennent de l'enveloppe de liste renvoyée par l'API. */
  total: number;
  page: number;
  limite: number;
  /** Ce qu'on compte : affiche le résumé à droite. Les deux formes sont données, car
   *  retirer un « s » ne marche pas en français (« avis »). */
  elements?: { singulier: string; pluriel: string };
};

const CASE =
  'flex h-11 min-w-11 items-center justify-center rounded-sm border px-3 text-sm';

/**
 * Les pages à afficher : la première, la dernière, la courante et ses voisines.
 * `null` marque une coupure, rendue par une ellipse.
 */
function pagesVisibles(page: number, nombrePages: number): (number | null)[] {
  if (nombrePages <= PAGES_SANS_ELLIPSE) {
    return Array.from({ length: nombrePages }, (_, index) => index + 1);
  }

  const retenues = [
    PREMIERE_PAGE,
    page - 1,
    page,
    page + 1,
    nombrePages,
  ].filter((numero) => numero >= PREMIERE_PAGE && numero <= nombrePages);

  const triees = [...new Set(retenues)].sort((a, b) => a - b);

  return triees.flatMap((numero, index) => {
    const precedente = triees[index - 1];

    return precedente !== undefined && numero - precedente > 1
      ? [null, numero]
      : [numero];
  });
}

/** La flèche se voit, le mot s'entend : « ‹ » seul ne dit rien à un lecteur d'écran. */
function Fleche({ glyphe, mot }: { glyphe: string; mot: string }) {
  return (
    <>
      <span aria-hidden="true">{glyphe}</span>
      <span className="sr-only">{mot}</span>
    </>
  );
}

function LienDePage({
  numero,
  courante,
  children,
}: {
  numero: number;
  courante: boolean;
  children?: ReactNode;
}) {
  const [parametres] = useSearchParams();

  return (
    <Link
      to={{ search: avecPage(parametres, numero).toString() }}
      aria-current={courante ? 'page' : undefined}
      className={`${CASE} hover:no-underline ${
        courante
          ? 'border-ardoise bg-ardoise font-medium text-nappe hover:text-nappe'
          : 'border-trait-fort bg-craie text-encre-70'
      }`}
    >
      {children ?? numero}
    </Link>
  );
}

/** Flèche inerte : rendue, mais désactivée. La retirer ferait sauter la hauteur. */
function FlecheInerte({ glyphe, mot }: { glyphe: string; mot: string }) {
  return (
    <button
      type="button"
      disabled
      className={`${CASE} cursor-not-allowed border-trait-fort bg-nappe text-encre-35`}
    >
      <Fleche glyphe={glyphe} mot={mot} />
    </button>
  );
}

export function Pagination({
  total,
  page,
  limite,
  elements,
}: ProprietesPagination) {
  const nombrePages = Math.max(PREMIERE_PAGE, Math.ceil(total / limite));

  return (
    <nav
      aria-label="Pagination"
      className="flex w-full flex-wrap items-center gap-2"
    >
      {page > PREMIERE_PAGE ? (
        <LienDePage numero={page - 1} courante={false}>
          <Fleche glyphe="‹" mot="Précédent" />
        </LienDePage>
      ) : (
        <FlecheInerte glyphe="‹" mot="Précédent" />
      )}

      {pagesVisibles(page, nombrePages).map((numero, index) =>
        numero === null ? (
          <span
            // Une coupure n'a pas d'identité propre ; sa position en est une.
            key={`coupure-${String(index)}`}
            aria-hidden="true"
            className="px-2 text-encre-55"
          >
            {ELLIPSE}
          </span>
        ) : (
          <LienDePage key={numero} numero={numero} courante={numero === page} />
        ),
      )}

      {page < nombrePages ? (
        <LienDePage numero={page + 1} courante={false}>
          <Fleche glyphe="›" mot="Suivant" />
        </LienDePage>
      ) : (
        <FlecheInerte glyphe="›" mot="Suivant" />
      )}

      {elements !== undefined && (
        <p className="ml-auto text-sm text-encre-55">
          {total} {total > 1 ? elements.pluriel : elements.singulier} · page{' '}
          {page} sur {nombrePages} · {limite} par page
        </p>
      )}
    </nav>
  );
}
