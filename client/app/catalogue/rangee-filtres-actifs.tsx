import { Link, useSearchParams } from 'react-router';

import { filtresActifs, sansFiltre, type Referentiels } from './filtres-actifs';

function Compteur({ total }: { total: number | null }) {
  // `null` = la liste n'a pas répondu : on ne compte pas ce qu'on ne sait pas.
  if (total === null) {
    return null;
  }

  return (
    <span aria-live="polite" className="ml-auto text-sm text-encre-55">
      {total} résultat{total > 1 ? 's' : ''}
    </span>
  );
}

/**
 * Ce qui est filtré doit se lire d'un coup d'œil, et se retirer d'un clic. Sans cette
 * rangée, un critère posé puis oublié fait passer un catalogue pour vide.
 */
export function RangeeFiltresActifs({
  referentiels,
  total,
}: {
  referentiels: Referentiels;
  total: number | null;
}) {
  const [parametres, setParametres] = useSearchParams();
  const actifs = filtresActifs(parametres, referentiels);

  return (
    <div className="mb-5 flex min-h-8 flex-wrap items-center gap-2">
      {actifs.length > 0 && (
        <>
          <span className="text-xs tracking-bouton text-encre-55 uppercase">
            Actifs
          </span>

          {actifs.map((filtre) => (
            <button
              key={`${filtre.cle}-${filtre.valeur}`}
              type="button"
              onClick={() => {
                setParametres(sansFiltre(parametres, filtre));
              }}
              className="flex min-h-8 items-center gap-2 rounded-pilule border border-ardoise bg-ardoise px-3.5 text-sm text-nappe"
            >
              {filtre.libelle}
              <span aria-hidden="true" className="opacity-70">
                ×
              </span>
              <span className="sr-only">Retirer ce filtre</span>
            </button>
          ))}

          <Link to="/recettes" className="ml-1 text-sm">
            Tout effacer
          </Link>
        </>
      )}

      <Compteur total={total} />
    </div>
  );
}
