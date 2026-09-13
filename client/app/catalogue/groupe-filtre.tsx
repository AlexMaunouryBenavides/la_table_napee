import { useId } from 'react';

import { avecCritere } from '../acces-api/criteres-url';

import { type ControleCriteres, useCriteres } from './criteres-controles';

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

type ProprietesChoix = {
  actif: boolean;
  choixUnique: boolean;
  libelle: string;
  nom: string;
  surChoix: () => void;
};

// Le vrai contrôle est masqué : son focus se reporte sur ce qu'on voit, sinon la
// navigation au clavier devient aveugle.
const FOCUS_REPORTE =
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ardoise';

function ControleMasque({
  actif,
  choixUnique,
  nom,
  surChoix,
}: Omit<ProprietesChoix, 'libelle'>) {
  return (
    <input
      // Radio quand l'API n'accepte qu'une valeur, case quand elle les cumule :
      // la forme du contrôle dit la vérité sur ce qui est possible.
      type={choixUnique ? 'radio' : 'checkbox'}
      name={nom}
      checked={actif}
      onChange={surChoix}
      className="sr-only"
    />
  );
}

function Pastille({ libelle, ...controle }: ProprietesChoix) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-pilule border px-3.5 text-sm md:min-h-8 ${FOCUS_REPORTE} ${
        controle.actif
          ? 'border-ardoise bg-ardoise text-nappe'
          : 'border-trait-fort bg-craie text-encre-70'
      }`}
    >
      <ControleMasque {...controle} />
      {libelle}
      {controle.actif && !controle.choixUnique && (
        <span aria-hidden="true" className="opacity-70">
          ×
        </span>
      )}
    </label>
  );
}

function Case({ libelle, ...controle }: ProprietesChoix) {
  return (
    <label
      className={`flex min-h-6 cursor-pointer items-center gap-2.5 rounded-xs text-sm ${FOCUS_REPORTE}`}
    >
      <ControleMasque {...controle} />
      <span
        aria-hidden="true"
        className={`grid size-4.5 shrink-0 place-items-center rounded-xs border text-xs ${
          controle.actif
            ? 'border-ardoise bg-ardoise text-nappe'
            : 'border-trait-fort bg-craie'
        }`}
      >
        {controle.actif && '✓'}
      </span>
      {libelle}
    </label>
  );
}

/**
 * `choixUnique` n'est pas un détail de présentation : `difficulte` et `type` sont
 * validés par `@IsIn` côté API, sans `each`. Deux valeurs dans l'URL, et la réponse
 * est un 400. L'interface ne doit pas laisser construire une requête qu'elle sait
 * invalide.
 *
 * `apparence`, lui, EST un détail de présentation : pastilles ou cases, le contrat
 * reste le même.
 */
type ProprietesGroupe = {
  legende: string;
  cle: string;
  options: Option[];
  choixUnique?: boolean;
  apparence?: 'pastilles' | 'cases';
  /** Sans contrôle, le groupe lit et écrit l'URL. */
  controle?: ControleCriteres;
};

function useChoix(
  cle: string,
  choixUnique: boolean,
  controle: ControleCriteres | undefined,
) {
  const [parametres, setParametres] = useCriteres(controle);
  // Le même groupe peut vivre deux fois dans la page (panneau et tiroir) : un nom de
  // radios partagé ferait qu'en cocher un décoche l'autre.
  const nom = `${cle}-${useId()}`;

  return {
    nom,
    actives: parametres.getAll(cle),
    choisir: (valeur: string) => {
      setParametres(
        choixUnique
          ? avecCritere(parametres, cle, valeur)
          : avecValeurBasculee(parametres, cle, valeur),
      );
    },
  };
}

function ListeDeChoix({
  cle,
  options,
  choixUnique,
  apparence,
  controle,
}: Omit<ProprietesGroupe, 'legende' | 'choixUnique' | 'apparence'> & {
  choixUnique: boolean;
  apparence: 'pastilles' | 'cases';
}) {
  const { nom, actives, choisir } = useChoix(cle, choixUnique, controle);
  const Choix = apparence === 'cases' ? Case : Pastille;

  return (
    <div
      className={
        apparence === 'cases' ? 'mt-3 grid gap-2' : 'mt-3 flex flex-wrap gap-2'
      }
    >
      {choixUnique && (
        // Un groupe de radios ne se décoche pas : sans cette sortie, un critère
        // choisi par erreur ne se retire plus depuis le panneau.
        <Choix
          actif={actives.length === 0}
          choixUnique
          libelle="Peu importe"
          nom={nom}
          surChoix={() => {
            choisir('');
          }}
        />
      )}

      {options.map((option) => (
        <Choix
          key={option.valeur}
          actif={actives.includes(option.valeur)}
          choixUnique={choixUnique}
          libelle={option.libelle}
          nom={nom}
          surChoix={() => {
            choisir(option.valeur);
          }}
        />
      ))}
    </div>
  );
}

export function GroupeFiltre({
  legende,
  choixUnique = false,
  apparence = 'pastilles',
  ...reste
}: ProprietesGroupe) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-xs font-medium tracking-bouton text-encre-70 uppercase">
        {legende}
      </legend>
      <ListeDeChoix
        {...reste}
        choixUnique={choixUnique}
        apparence={apparence}
      />
    </fieldset>
  );
}
