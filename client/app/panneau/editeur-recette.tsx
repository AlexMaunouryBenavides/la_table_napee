import type { Categorie } from '@recipe/types';
import { type ReactNode, useState } from 'react';
import { Link, useSubmit } from 'react-router';

import { Bandeau } from '../composants/bandeau';
import { Bouton } from '../composants/bouton';
import { EnTetePanneau } from '../composants/en-tete-panneau';
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

function PastilleCategorie({
  option,
  actif,
  surBascule,
}: {
  option: Categorie;
  actif: boolean;
  surBascule: () => void;
}) {
  return (
    <label
      className={`flex min-h-8 cursor-pointer items-center gap-2 rounded-pilule border px-3.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ardoise ${
        actif
          ? 'border-ardoise bg-ardoise text-nappe'
          : 'border-trait-fort bg-craie text-encre-70'
      }`}
    >
      {/* La vraie case, masquée : cochée ou non, c'est elle qui fait foi. */}
      <input
        type="checkbox"
        checked={actif}
        onChange={surBascule}
        className="sr-only"
      />
      {option.nom}
    </label>
  );
}

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
    <fieldset className="border-0 p-0 py-4 first:pt-0 last:pb-0">
      <legend className="float-left mb-3 w-full text-xs font-medium tracking-bouton text-encre-70 uppercase">
        {LIBELLES_CATEGORIE[cle]}
      </legend>
      <div className="clear-left flex flex-wrap gap-2">
        {options.length === 0 && (
          <p className="text-sm text-encre-55">Liste en cours de chargement…</p>
        )}
        {options.map((option) => (
          <PastilleCategorie
            key={option.id}
            option={option}
            actif={choisis.includes(option.id)}
            surBascule={() => {
              surBascule(option.id);
            }}
          />
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
  const categories =
    brouillon.regimes.length +
    brouillon.criteresSante.length +
    brouillon.typesAliment.length;

  return (
    <div
      role="group"
      aria-label="Récapitulatif"
      className="grid gap-1 text-sm text-encre-70"
    >
      {/* Ce que le formulaire contient MAINTENANT, jamais ce qui a été chargé. */}
      <span>Temps total · {minutes} min</span>
      <span>
        {ingredients} ingrédient{ingredients > 1 ? 's' : ''}
      </span>
      <span>
        {etapes} étape{etapes > 1 ? 's' : ''}
      </span>
      <span>
        {categories} catégorie{categories > 1 ? 's' : ''}
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
      explication="Sélection multiple. Les listes viennent de la base : une valeur qui manque se crée dans l’écran des catégories, pas ici."
    >
      <div className="flex flex-col divide-y divide-trait">
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
    <div>
      {/* Les intitulés de colonnes, pour l'œil : chaque champ a déjà son libellé. */}
      <div
        aria-hidden="true"
        className="flex gap-2.5 pb-1 text-xs font-medium tracking-bouton text-encre-55 uppercase"
      >
        <span className="min-w-48 flex-1">Ingrédient</span>
        <span className="w-24">Quantité</span>
        <span className="w-42">Unité</span>
        <span className="w-10" />
      </div>

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
    </div>
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

      <div>
        <Bouton
          variante="fantome"
          taille="sm"
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

      <div>
        <Bouton
          variante="fantome"
          taille="sm"
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
      <InformationsRecette
        brouillon={brouillon}
        nationalites={nationalites}
        champs={champs}
        modifier={modifier}
      />
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
  const creation = recetteId === null;

  return (
    <>
      <EnTetePanneau
        fil={`Panneau · Recettes · ${creation ? 'Nouvelle' : 'Modifier'}`}
        titre={creation ? 'Nouvelle recette' : 'Modifier la recette'}
      />

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

function BlocLateral({
  titre,
  children,
}: {
  titre: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-trait bg-craie px-5 py-4.5">
      <h2 className="text-xl">{titre}</h2>
      {children}
    </section>
  );
}

function Publication({
  envoiEnCours,
  recetteId,
  surEnregistrement,
}: {
  envoiEnCours: boolean;
  recetteId: number | null;
  surEnregistrement: () => void;
}) {
  return (
    <BlocLateral titre="Publication">
      <p className="text-sm leading-relaxed text-encre-55">
        L’enregistrement est visible aussitôt sur la page publique : l’API n’a
        pas de brouillon.
      </p>
      <Bouton
        variante="primaire"
        chargement={envoiEnCours}
        onClick={surEnregistrement}
        className="w-full"
      >
        Enregistrer
      </Bouton>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/panneau/recettes" className="underline">
          Annuler
        </Link>
        {/* Seulement en modification : une recette qui n'existe pas encore n'a pas
            de page publique à montrer. */}
        {recetteId !== null && (
          <Link to={`/recettes/${String(recetteId)}`} className="underline">
            Aperçu public
          </Link>
        )}
      </div>
    </BlocLateral>
  );
}

function ColonneLaterale({
  brouillon,
  ...publication
}: {
  brouillon: BrouillonRecette;
  envoiEnCours: boolean;
  recetteId: number | null;
  surEnregistrement: () => void;
}) {
  const image = brouillon.image.trim();

  return (
    <aside className="mt-6 grid gap-4 md:sticky md:top-6 md:mt-0 md:w-80 md:shrink-0">
      <BlocLateral titre="Image">
        <div className="grid aspect-4/3 place-items-center overflow-hidden rounded-sm border border-dashed border-trait-fort bg-nappe p-4 text-center text-sm text-encre-55">
          {image === '' ? (
            <span>Renseignez l’adresse de l’image dans les informations.</span>
          ) : (
            <img src={image} alt="" className="size-full object-cover" />
          )}
        </div>
      </BlocLateral>

      <BlocLateral titre="Récapitulatif">
        <Recapitulatif brouillon={brouillon} />
      </BlocLateral>

      <Publication {...publication} />
    </aside>
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
  const sections = { brouillon, champs, modifier };

  return (
    <div className="flex flex-col gap-6">
      <EnTeteEditeur recetteId={recetteId} retour={retour} />

      <div className="md:flex md:items-start md:gap-7.5">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SectionInformations
            {...sections}
            nationalites={referentiels.nationalites}
          />
          <SectionCategories
            brouillon={brouillon}
            referentiels={referentiels}
            modifier={modifier}
          />
          <SectionIngredients {...sections} />
          <SectionEtapes {...sections} />
        </div>

        <ColonneLaterale
          brouillon={brouillon}
          envoiEnCours={envoiEnCours}
          recetteId={recetteId}
          surEnregistrement={enregistrer}
        />
      </div>
    </div>
  );
}
