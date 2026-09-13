import { useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';

const CLE = 'tempsMax';
const MINUTES_MIN = 10;
// Au bout de la course, « 180 min ou plus » : il n'y a plus rien à filtrer.
const MINUTES_MAX = 180;
const PAS = 5;

/** Une URL se trafique à la main : hors bornes ou illisible, c'est « peu importe ». */
function valeurCourante(parametres: URLSearchParams): number {
  const demande = Number(parametres.get(CLE));

  return parametres.has(CLE) &&
    Number.isInteger(demande) &&
    demande >= MINUTES_MIN &&
    demande < MINUTES_MAX
    ? demande
    : MINUTES_MAX;
}

export function CurseurTemps() {
  const [parametres, setParametres] = useSearchParams();
  const valeur = valeurCourante(parametres);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={CLE}
          className="text-xs font-medium tracking-bouton text-encre-70 uppercase"
        >
          Temps total maximum
        </label>
        <span aria-live="polite" className="text-sm text-ardoise">
          {valeur === MINUTES_MAX ? 'Peu importe' : `${String(valeur)} min`}
        </span>
      </div>

      <input
        id={CLE}
        type="range"
        min={MINUTES_MIN}
        max={MINUTES_MAX}
        step={PAS}
        value={valeur}
        onChange={(evenement) => {
          const choisi = Number(evenement.target.value);
          // `avecCritere` ramène en page 1 ; le maximum retire le filtre.
          setParametres(
            avecCritere(
              parametres,
              CLE,
              choisi >= MINUTES_MAX ? null : String(choisi),
            ),
          );
        }}
        className="mt-3 w-full accent-ardoise"
      />

      <div
        aria-hidden="true"
        className="mt-1 flex justify-between text-sm text-encre-55"
      >
        <span>{MINUTES_MIN} min</span>
        <span>{MINUTES_MAX} min</span>
      </div>
      <p className="mt-2 text-sm text-encre-55">préparation + cuisson</p>
    </div>
  );
}
