import { type Ingredient, UNITES } from '@recipe/types';
import { useEffect, useState } from 'react';

import { chercherIngredients } from '../acces-api/ingredients';
import { Bouton } from '../composants/bouton';
import { BoutonIcone } from '../composants/bouton-icone';

import type { LigneIngredient } from './brouillon-recette';

const DELAI_SUGGESTION_MS = 200;
const LONGUEUR_MINIMALE = 2;

const assezLong = (terme: string): boolean =>
  terme.trim().length >= LONGUEUR_MINIMALE;

/**
 * Cherche dans le référentiel, une fois la frappe calmée. Une panne du référentiel ne
 * casse rien : on n'a alors aucune suggestion, et le nom saisi reste valable — il sera
 * créé avec la recette.
 */
type Reponse = { terme: string; trouves: Ingredient[] };

/** `null` = on ne sait pas encore. Ce n'est PAS « aucun résultat » : annoncer un
 *  ingrédient absent avant d'avoir la réponse serait un mensonge d'un dixième de
 *  seconde, et il clignoterait. */
function useSuggestions(terme: string): Ingredient[] | null {
  const [reponse, setReponse] = useState<Reponse | null>(null);

  useEffect(() => {
    if (!assezLong(terme)) {
      return undefined;
    }

    let abandonne = false;
    const minuterie = setTimeout(() => {
      void chercherIngredients(terme)
        .then((trouves) => {
          if (!abandonne) {
            setReponse({ terme, trouves });
          }
        })
        // Une panne du référentiel ne bloque personne : sans suggestion, le nom
        // saisi reste valable.
        .catch(() => {
          setReponse({ terme, trouves: [] });
        });
    }, DELAI_SUGGESTION_MS);

    return () => {
      abandonne = true;
      clearTimeout(minuterie);
    };
  }, [terme]);

  // Comparé au rendu plutôt que remis à zéro dans l'effet : un `setState` synchrone
  // dans un effet déclenche un rendu en cascade pour rien.
  return reponse !== null && reponse.terme === terme ? reponse.trouves : null;
}

function Suggestions({
  terme,
  suggestions,
  surChoix,
}: {
  terme: string;
  suggestions: Ingredient[] | null;
  surChoix: (nom: string) => void;
}) {
  if (!assezLong(terme) || suggestions === null) {
    return null;
  }

  // On ne propose jamais ce qui est DÉJÀ écrit : après un choix, ou sur un formulaire
  // prérempli, la suggestion ne serait que du bruit.
  const autres = suggestions.filter(
    ({ nom }) => nom.toLowerCase() !== terme.trim().toLowerCase(),
  );

  if (suggestions.length === 0) {
    // Jamais de création par simple frappe : le nom part tel quel, et l'API tranche
    // (trouver ou créer) au moment d'enregistrer la recette.
    return (
      <p className="mt-1 text-sm text-encre-55">
        Aucun ingrédient « {terme} » dans le référentiel : il sera créé avec la
        recette.
      </p>
    );
  }

  if (autres.length === 0) {
    return null;
  }

  // Un groupe de boutons, pas une liste : les seuls `listitem` de cet écran sont les
  // étapes, dont l'ordre est porteur de sens.
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {autres.map((ingredient) => (
        <Bouton
          key={ingredient.id}
          variante="fantome"
          taille="sm"
          className="!tracking-normal !normal-case"
          onClick={() => {
            surChoix(ingredient.nom);
          }}
        >
          {ingredient.nom}
        </Bouton>
      ))}
    </div>
  );
}

type ChampsProprietes = {
  ligne: LigneIngredient;
  rang: number;
  idNom: string;
  erreur?: string;
  surChangement: (ligne: LigneIngredient) => void;
};

function ChampNom({ ligne, rang, idNom, surChangement }: ChampsProprietes) {
  return (
    <div className="min-w-48 flex-1">
      <label htmlFor={idNom} className="sr-only">
        Ingrédient {rang}
      </label>
      <input
        id={idNom}
        value={ligne.nom}
        placeholder="Rechercher un ingrédient…"
        onChange={(evenement) => {
          surChangement({ ...ligne, nom: evenement.target.value });
        }}
        className="h-11 w-full rounded-sm border border-trait-fort bg-craie px-3.5 text-sm"
      />
    </div>
  );
}

function ChampQuantite({
  ligne,
  rang,
  idNom,
  erreur,
  surChangement,
}: ChampsProprietes) {
  return (
    <div>
      <label htmlFor={`${idNom}-quantite`} className="sr-only">
        Quantité de l’ingrédient {rang}
      </label>
      <input
        id={`${idNom}-quantite`}
        type="number"
        min="0"
        step="0.01"
        value={ligne.quantite}
        placeholder="à volonté"
        aria-invalid={erreur === undefined ? undefined : true}
        onChange={(evenement) => {
          surChangement({ ...ligne, quantite: evenement.target.value });
        }}
        className="h-11 w-24 rounded-sm border border-trait-fort bg-craie px-3.5 text-sm"
      />
    </div>
  );
}

function ChampUnite({ ligne, rang, idNom, surChangement }: ChampsProprietes) {
  return (
    <div>
      <label htmlFor={`${idNom}-unite`} className="sr-only">
        Unité de l’ingrédient {rang}
      </label>
      <select
        id={`${idNom}-unite`}
        value={ligne.unite}
        onChange={(evenement) => {
          surChangement({
            ...ligne,
            unite: evenement.target.value as LigneIngredient['unite'],
          });
        }}
        className="h-11 w-42 rounded-sm border border-trait-fort bg-craie px-3 text-sm"
      >
        {UNITES.map((unite) => (
          <option key={unite} value={unite}>
            {unite}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LigneIngredientSaisie({
  ligne,
  rang,
  erreur,
  surChangement,
  surRetrait,
}: {
  ligne: LigneIngredient;
  rang: number;
  erreur?: string;
  surChangement: (ligne: LigneIngredient) => void;
  surRetrait: () => void;
}) {
  const suggestions = useSuggestions(ligne.nom);
  const champs = {
    ligne,
    rang,
    idNom: `ingredient-${String(rang)}`,
    erreur,
    surChangement,
  };

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <ChampNom {...champs} />
        <ChampQuantite {...champs} />
        <ChampUnite {...champs} />

        <BoutonIcone
          libelle={`Retirer l’ingrédient ${String(rang)}`}
          danger
          onClick={surRetrait}
        >
          ×
        </BoutonIcone>
      </div>

      {erreur !== undefined && (
        <p role="alert" className="mt-1 text-sm text-erreur">
          {erreur}
        </p>
      )}

      <Suggestions
        terme={ligne.nom}
        suggestions={suggestions}
        surChoix={(nom) => {
          surChangement({ ...ligne, nom });
        }}
      />
    </div>
  );
}
