import { useSearchParams } from 'react-router';

import { filtresActifs, sansFiltre, type Referentiels } from './filtres-actifs';

/**
 * Ce qui est filtré doit se lire d'un coup d'œil, et se retirer d'un clic. Sans cette
 * rangée, un critère posé puis oublié fait passer un catalogue pour vide.
 */
export function RangeeFiltresActifs({
  referentiels,
}: {
  referentiels: Referentiels;
}) {
  const [parametres, setParametres] = useSearchParams();
  const actifs = filtresActifs(parametres, referentiels);

  if (actifs.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs tracking-etiquette text-encre-55 uppercase">
        Filtres actifs
      </span>

      {actifs.map((filtre) => (
        <button
          key={`${filtre.cle}-${filtre.valeur}`}
          type="button"
          onClick={() => {
            setParametres(sansFiltre(parametres, filtre));
          }}
          className="flex min-h-8 items-center gap-2 rounded-pilule bg-ardoise px-3 text-sm text-nappe"
        >
          {filtre.libelle}
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Retirer ce filtre</span>
        </button>
      ))}

      <a href="/recettes" className="text-sm underline">
        Tout retirer
      </a>
    </div>
  );
}
