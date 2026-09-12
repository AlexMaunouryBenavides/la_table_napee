import { Bouton } from '../composants/bouton';

type ActionsDEtape = {
  surDeplacement: (index: number, sens: -1 | 1) => void;
  surRetrait: (index: number) => void;
};

function BoutonsDeplacement({
  index,
  dernier,
  actions,
}: {
  index: number;
  dernier: boolean;
  actions: ActionsDEtape;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <Bouton
        variante="texte"
        taille="sm"
        disabled={index === 0}
        onClick={() => {
          actions.surDeplacement(index, -1);
        }}
      >
        Monter l’étape {index + 1}
      </Bouton>
      <Bouton
        variante="texte"
        taille="sm"
        disabled={dernier}
        onClick={() => {
          actions.surDeplacement(index, 1);
        }}
      >
        Descendre l’étape {index + 1}
      </Bouton>
      <Bouton
        variante="texte"
        taille="sm"
        onClick={() => {
          actions.surRetrait(index);
        }}
      >
        Retirer l’étape {index + 1}
      </Bouton>
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
        className="mt-2 w-6 shrink-0 text-right font-titre text-xl"
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
        className="flex-1 rounded-sm border border-trait-fort bg-craie px-3 py-2"
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

      <ol className="flex flex-col gap-3">
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
