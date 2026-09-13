import { useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';

type Option = { valeur: string; libelle: string };

const PREMIERE_PAGE = '1';

/** Bascule UNE valeur d'un critère répétable, sans toucher aux autres. */
function avecValeurBasculee(
  parametres: URLSearchParams,
  cle: string,
  valeur: string,
): URLSearchParams {
  const dejaActive = parametres.getAll(cle).includes(valeur);
  const suivants = new URLSearchParams();

  for (const [c, v] of parametres.entries()) {
    if (!(dejaActive && c === cle && v === valeur)) {
      suivants.append(c, v);
    }
  }

  if (!dejaActive) {
    suivants.append(cle, valeur);
  }

  // Changer de critère remet en page 1 : rester page 4 montrerait un vide qui n'en
  // est pas un.
  suivants.set('page', PREMIERE_PAGE);

  return suivants;
}

function Pastille({
  actif,
  choixUnique,
  libelle,
  nom,
  surChoix,
}: {
  actif: boolean;
  choixUnique: boolean;
  libelle: string;
  nom: string;
  surChoix: () => void;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center rounded-pilule px-4 text-sm md:min-h-8 ${
        actif
          ? 'bg-ardoise text-nappe'
          : 'border border-trait-fort text-encre-70'
      }`}
    >
      <input
        // Radio quand l'API n'accepte qu'une valeur, case quand elle les cumule :
        // la forme du contrôle dit la vérité sur ce qui est possible.
        type={choixUnique ? 'radio' : 'checkbox'}
        name={nom}
        checked={actif}
        onChange={surChoix}
        className="sr-only"
      />
      {libelle}
    </label>
  );
}

/**
 * `choixUnique` n'est pas un détail de présentation : `difficulte` et `type` sont
 * validés par `@IsIn` côté API, sans `each`. Deux valeurs dans l'URL, et la réponse
 * est un 400. L'interface ne doit pas laisser construire une requête qu'elle sait
 * invalide.
 */
type ProprietesGroupe = {
  legende: string;
  cle: string;
  options: Option[];
  choixUnique?: boolean;
};

export function GroupeFiltre({
  legende,
  cle,
  options,
  choixUnique = false,
}: ProprietesGroupe) {
  const [parametres, setParametres] = useSearchParams();
  const actives = parametres.getAll(cle);

  function choisir(valeur: string) {
    setParametres(
      choixUnique
        ? avecCritere(parametres, cle, valeur)
        : avecValeurBasculee(parametres, cle, valeur),
    );
  }

  return (
    <fieldset className="border-0 p-0">
      <legend className="text-xs tracking-etiquette text-encre-70 uppercase">
        {legende}
      </legend>

      <div className="mt-2 flex flex-wrap gap-2">
        {choixUnique && (
          // Un groupe de radios ne se décoche pas : sans cette sortie, un critère
          // choisi par erreur ne se retire plus depuis le panneau.
          <Pastille
            actif={actives.length === 0}
            choixUnique
            libelle="Peu importe"
            nom={cle}
            surChoix={() => {
              choisir('');
            }}
          />
        )}

        {options.map((option) => (
          <Pastille
            key={option.valeur}
            actif={actives.includes(option.valeur)}
            choixUnique={choixUnique}
            libelle={option.libelle}
            nom={cle}
            surChoix={() => {
              choisir(option.valeur);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
