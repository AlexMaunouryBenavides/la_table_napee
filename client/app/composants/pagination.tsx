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
};

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

function LienDePage({
  numero,
  courante,
  libelle,
}: {
  numero: number;
  courante: boolean;
  libelle?: string;
}) {
  const [parametres] = useSearchParams();

  return (
    <Link
      to={{ search: avecPage(parametres, numero).toString() }}
      aria-current={courante ? 'page' : undefined}
      className={`flex h-11 min-w-11 items-center justify-center rounded-sm px-3 ${
        courante ? 'bg-ardoise text-nappe' : 'text-ardoise'
      }`}
    >
      {libelle ?? numero}
    </Link>
  );
}

/** Flèche inerte : rendue, mais désactivée. La retirer ferait sauter la hauteur. */
function FlecheInerte({ libelle }: { libelle: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex h-11 min-w-11 items-center justify-center rounded-sm px-3 text-encre-35"
    >
      {libelle}
    </button>
  );
}

export function Pagination({ total, page, limite }: ProprietesPagination) {
  const nombrePages = Math.max(PREMIERE_PAGE, Math.ceil(total / limite));

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {page > PREMIERE_PAGE ? (
        <LienDePage numero={page - 1} courante={false} libelle="‹ Précédent" />
      ) : (
        <FlecheInerte libelle="‹ Précédent" />
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
        <LienDePage numero={page + 1} courante={false} libelle="Suivant ›" />
      ) : (
        <FlecheInerte libelle="Suivant ›" />
      )}
    </nav>
  );
}
