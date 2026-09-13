import type { Categorie } from '@recipe/types';
import { useState } from 'react';
import { Link, useSubmit } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { ZoneReglage } from '../composants/zone-reglage';

import {
  type BrouillonRecette,
  corpsDepuis,
  deplacerEtape,
  type LigneIngredient,
  ligneVide,
} from './brouillon-recette';
import { EtapesRecette } from './etapes-recette';
import { InformationsRecette } from './informations-recette';
import { LigneIngredientSaisie } from './ligne-ingredient';

export type Referentiels = {
  nationalites: Categorie[];
  regimes: Categorie[];
  criteresSante: Categorie[];
  typesAliment: Categorie[];
};

/** Ce que l'action renvoie à l'écran. En création la réponse est une redirection —
 *  l'URL change — donc seule la MODIFICATION a besoin d'annoncer son succès. */
export type RetourEnregistrement =
  | { succes: true }
  | { succes: false; message: string; champs?: Record<string, string> };

type CleCategorie = 'regimes' | 'criteresSante' | 'typesAliment';

const LIBELLES_CATEGORIE: Record<CleCategorie, string> = {
  regimes: 'Régimes',
  criteresSante: 'Critères santé',
  typesAliment: 'Types d’aliment',
};

function GroupeCategories({
  cle,
  options,
  choisis,
  surBascule,
}: {
  cle: CleCategorie;
  options: Categorie[];
  choisis: number[];
  surBascule: (id: number) => void;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-xs tracking-etiquette text-encre-70 uppercase">
        {LIBELLES_CATEGORIE[cle]}
      </legend>
      <div className="mt-2 flex flex-wrap gap-3">
        {options.length === 0 && (
          <p className="text-sm text-encre-55">Liste en cours de chargement…</p>
        )}
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-base">
            <input
              type="checkbox"
              checked={choisis.includes(option.id)}
              onChange={() => {
                surBascule(option.id);
              }}
            />
            {option.nom}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Recapitulatif({ brouillon }: { brouillon: BrouillonRecette }) {
  const minutes =
    Number(brouillon.tempsPreparation || 0) +
    Number(brouillon.tempsCuisson || 0);
  const ingredients = brouillon.ingredients.filter(
    (ligne) => ligne.nom.trim() !== '',
  ).length;
  const etapes = brouillon.etapes.filter((etape) => etape.trim() !== '').length;

  return (
    <div
      role="group"
      aria-label="Récapitulatif"
      className="flex flex-wrap gap-6 rounded-md border border-trait bg-craie p-4 text-sm text-encre-70"
    >
      {/* Ce que le formulaire contient MAINTENANT, jamais ce qui a été chargé. */}
      <span>Temps total · {minutes} min</span>
      <span>
        {ingredients} ingrédient{ingredients > 1 ? 's' : ''}
      </span>
      <span>
        {etapes} étape{etapes > 1 ? 's' : ''}
      </span>
    </div>
  );
}

function basculer(choisis: number[], id: number): number[] {
  return choisis.includes(id)
    ? choisis.filter((autre) => autre !== id)
    : [...choisis, id];
}

type SectionProprietes = {
  brouillon: BrouillonRecette;
  champs: Record<string, string>;
  modifier: (valeurs: Partial<BrouillonRecette>) => void;
};

function SectionCategories({
  brouillon,
  referentiels,
  modifier,
}: Omit<SectionProprietes, 'champs'> & { referentiels: Referentiels }) {
  return (
    <ZoneReglage
      titre="Catégories"
      explication="Les listes viennent de la base : une valeur qui manque se crée dans l’écran des catégories, pas ici."
    >
      <div className="mt-4 flex flex-col gap-4">
        {(Object.keys(LIBELLES_CATEGORIE) as CleCategorie[]).map((cle) => (
          <GroupeCategories
            key={cle}
            cle={cle}
            options={referentiels[cle]}
            choisis={brouillon[cle]}
            surBascule={(id) => {
              modifier({ [cle]: basculer(brouillon[cle], id) });
            }}
          />
        ))}
      </div>
    </ZoneReglage>
  );
}

function LignesIngredients({ brouillon, champs, modifier }: SectionProprietes) {
  return (
    <>
      {brouillon.ingredients.map((ligne, index) => (
        <LigneIngredientSaisie
          // Une ligne non enregistrée n'a pas d'identité : sa position EST sa clé.
          key={index}
          ligne={ligne}
          rang={index + 1}
          erreur={champs[`ingredient-${String(index)}`]}
          surChangement={(modifiee: LigneIngredient) => {
            modifier({
              ingredients: brouillon.ingredients.map((autre, rang) =>
                rang === index ? modifiee : autre,
              ),
            });
          }}
          surRetrait={() => {
            modifier({
              ingredients: brouillon.ingredients.filter(
                (_, rang) => rang !== index,
              ),
            });
          }}
        />
      ))}
    </>
  );
}

function SectionIngredients({
  brouillon,
  champs,
  modifier,
}: SectionProprietes) {
  return (
    <ZoneReglage
      titre="Ingrédients"
      explication="Une ligne = un ingrédient, une quantité, une unité. Quantité vide veut dire « à volonté »."
    >
      <div className="mt-4">
        {champs.ingredients !== undefined && (
          <p role="alert" className="text-sm text-erreur">
            {champs.ingredients}
          </p>
        )}

        <LignesIngredients
          brouillon={brouillon}
          champs={champs}
          modifier={modifier}
        />

        <Bouton
          variante="fantome"
          taille="sm"
          className="mt-4"
          onClick={() => {
            modifier({
              ingredients: [...brouillon.ingredients, ligneVide()],
            });
          }}
        >
          Ajouter un ingrédient
        </Bouton>
      </div>
    </ZoneReglage>
  );
}

function SectionEtapes({ brouillon, champs, modifier }: SectionProprietes) {
  return (
    <ZoneReglage
      titre="Étapes"
      explication="Le numéro vient de la position : déplacer une étape renumérote la suite."
    >
      <div className="mt-4">
        <EtapesRecette
          etapes={brouillon.etapes}
          erreur={champs.etapes}
          surChangement={(index, contenu) => {
            modifier({
              etapes: brouillon.etapes.map((autre, rang) =>
                rang === index ? contenu : autre,
              ),
            });
          }}
          surDeplacement={(index, sens) => {
            modifier({
              etapes: deplacerEtape(brouillon.etapes, index, sens),
            });
          }}
          surRetrait={(index) => {
            modifier({
              etapes: brouillon.etapes.filter((_, rang) => rang !== index),
            });
          }}
        />

        <Bouton
          variante="fantome"
          taille="sm"
          className="mt-4"
          onClick={() => {
            modifier({ etapes: [...brouillon.etapes, ''] });
          }}
        >
          Ajouter une étape
        </Bouton>
      </div>
    </ZoneReglage>
  );
}

function SectionInformations({
  brouillon,
  champs,
  modifier,
  nationalites,
}: SectionProprietes & { nationalites: Categorie[] }) {
  return (
    <ZoneReglage
      titre="Informations de base"
      explication="Le titre est unique : deux recettes ne peuvent pas le partager."
    >
      <div className="mt-4">
        <InformationsRecette
          brouillon={brouillon}
          nationalites={nationalites}
          champs={champs}
          modifier={modifier}
        />
      </div>
    </ZoneReglage>
  );
}

function EnTeteEditeur({
  recetteId,
  retour,
}: {
  recetteId: number | null;
  retour: RetourEnregistrement | null;
}) {
  const echec = retour !== null && !retour.succes ? retour : null;

  return (
    <>
      <h1 className="font-titre text-3xl">
        {recetteId === null ? 'Nouvelle recette' : 'Modifier la recette'}
      </h1>

      {retour?.succes === true && (
        <Bandeau ton="succes" message="Les modifications sont enregistrées." />
      )}

      {/* Un refus rattaché à des champs se lit SUR ces champs : le répéter en bandeau
          ne dirait pas deux choses. */}
      {echec !== null && echec.champs === undefined && (
        <Bandeau ton="erreur" message={echec.message} />
      )}
    </>
  );
}

function BarreDActions({
  envoiEnCours,
  recetteId,
  surEnregistrement,
}: {
  envoiEnCours: boolean;
  recetteId: number | null;
  surEnregistrement: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Bouton
        variante="primaire"
        chargement={envoiEnCours}
        onClick={surEnregistrement}
      >
        Enregistrer
      </Bouton>
      <Link to="/panneau/recettes" className="underline">
        Annuler
      </Link>
      {/* Seulement en modification : une recette qui n'existe pas encore n'a pas de
          page publique à montrer. */}
      {recetteId !== null && (
        <Link to={`/recettes/${String(recetteId)}`} className="underline">
          Aperçu public
        </Link>
      )}
    </div>
  );
}

/**
 * Le brouillon vit ICI, en un seul état. Les erreurs affichées mêlent celles trouvées
 * avant l'envoi et celles renvoyées par l'API — les secondes gagnent, elles sont plus
 * récentes.
 */
function useBrouillon(
  brouillonInitial: BrouillonRecette,
  retour: RetourEnregistrement | null,
) {
  const [brouillon, setBrouillon] = useState(brouillonInitial);
  const [erreursLocales, setErreursLocales] = useState<Record<string, string>>(
    {},
  );
  const envoyer = useSubmit();

  return {
    brouillon,
    champs: {
      ...erreursLocales,
      ...(retour !== null && !retour.succes ? retour.champs : {}),
    },
    modifier: (valeurs: Partial<BrouillonRecette>) => {
      setBrouillon((precedent) => ({ ...precedent, ...valeurs }));
    },
    enregistrer: () => {
      const { corps, erreurs } = corpsDepuis(brouillon);
      setErreursLocales(erreurs);

      // Un seul envoi, jamais partiel : soit tout part, soit rien.
      if (corps !== null) {
        void envoyer(corps, { method: 'post', encType: 'application/json' });
      }
    },
  };
}

export function EcranEditeurRecette({
  brouillonInitial,
  referentiels,
  retour,
  envoiEnCours,
  recetteId,
}: {
  brouillonInitial: BrouillonRecette;
  referentiels: Referentiels;
  retour: RetourEnregistrement | null;
  envoiEnCours: boolean;
  /** `null` en création : c'est la seule différence entre les deux usages. */
  recetteId: number | null;
}) {
  const { brouillon, champs, modifier, enregistrer } = useBrouillon(
    brouillonInitial,
    retour,
  );

  return (
    <div className="flex flex-col gap-6">
      <EnTeteEditeur recetteId={recetteId} retour={retour} />

      <Recapitulatif brouillon={brouillon} />

      <SectionInformations
        brouillon={brouillon}
        champs={champs}
        modifier={modifier}
        nationalites={referentiels.nationalites}
      />

      <SectionCategories
        brouillon={brouillon}
        referentiels={referentiels}
        modifier={modifier}
      />

      <SectionIngredients
        brouillon={brouillon}
        champs={champs}
        modifier={modifier}
      />

      <SectionEtapes
        brouillon={brouillon}
        champs={champs}
        modifier={modifier}
      />

      <BarreDActions
        envoiEnCours={envoiEnCours}
        recetteId={recetteId}
        surEnregistrement={enregistrer}
      />
    </div>
  );
}
