import { BoutonIcone } from '../composants/bouton-icone';

type ActionsDEtape = {
  surDeplacement: (index: number, sens: -1 | 1) => void;
  surRetrait: (index: number) => void;
};

/** Le glisser seul n'est pas accessible : monter, descendre et retirer sont des
 *  boutons, atteignables au clavier. */
function BoutonsDeplacement({
  index,
  dernier,
  actions,
}: {
  index: number;
  dernier: boolean;
  actions: ActionsDEtape;
}) {
  const numero = index + 1;

  return (
    <div className="flex shrink-0 gap-1">
      <BoutonIcone
        libelle={`Monter l’étape ${String(numero)}`}
        disabled={index === 0}
        onClick={() => {
          actions.surDeplacement(index, -1);
        }}
      >
        ▲
      </BoutonIcone>
      <BoutonIcone
        libelle={`Descendre l’étape ${String(numero)}`}
        disabled={dernier}
        onClick={() => {
          actions.surDeplacement(index, 1);
        }}
      >
        ▼
      </BoutonIcone>
      <BoutonIcone
        libelle={`Retirer l’étape ${String(numero)}`}
        danger
        onClick={() => {
          actions.surRetrait(index);
        }}
      >
        ×
      </BoutonIcone>
    </div>
  );
}

function LigneEtape({
  etape,
  index,
  dernier,
  actions,
  surChangement,
}: {
  etape: string;
  index: number;
  dernier: boolean;
  actions: ActionsDEtape;
  surChangement: (index: number, contenu: string) => void;
}) {
  return (
    <li className="flex items-start gap-3">
      {/* Le numéro est décoratif : il se lit dans le libellé du champ, et le répéter
          le ferait annoncer deux fois. */}
      <span
        aria-hidden="true"
        className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-lavande font-titre text-lg font-semibold text-ardoise-fonce"
      >
        {index + 1}
      </span>

      <label htmlFor={`etape-${String(index)}`} className="sr-only">
        Étape {index + 1}
      </label>
      <textarea
        id={`etape-${String(index)}`}
        value={etape}
        rows={2}
        onChange={(evenement) => {
          surChangement(index, evenement.target.value);
        }}
        className="min-w-0 flex-1 rounded-sm border border-trait-fort bg-craie px-3.5 py-2.5 text-sm leading-relaxed"
      />

      <BoutonsDeplacement index={index} dernier={dernier} actions={actions} />
    </li>
  );
}

/**
 * Les étapes, dans l'ordre. Le numéro affiché vient de la POSITION : déplacer une
 * étape renumérote tout, et aucun champ « numéro » n'existe — un numéro saisi à la
 * main finit toujours par mentir.
 */
export function EtapesRecette({
  etapes,
  erreur,
  surChangement,
  surDeplacement,
  surRetrait,
}: {
  etapes: string[];
  erreur?: string;
  surChangement: (index: number, contenu: string) => void;
} & ActionsDEtape) {
  return (
    <div>
      {erreur !== undefined && (
        <p role="alert" className="mb-3 text-sm text-erreur">
          {erreur}
        </p>
      )}

      <ol className="flex flex-col gap-3.5">
        {etapes.map((etape, index) => (
          <LigneEtape
            // Une étape non enregistrée n'a pas d'identité propre : sa position EST
            // sa clé.
            key={index}
            etape={etape}
            index={index}
            dernier={index === etapes.length - 1}
            actions={{ surDeplacement, surRetrait }}
            surChangement={surChangement}
          />
        ))}
      </ol>
    </div>
  );
}
