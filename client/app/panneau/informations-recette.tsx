import {
  type Categorie,
  DIFFICULTES,
  type Difficulte,
  TYPES_RECETTE,
  type TypeRecette,
} from '@recipe/types';

import { Champ } from '../composants/champ';
import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';

import type { BrouillonRecette } from './brouillon-recette';

type Modification = (champs: Partial<BrouillonRecette>) => void;

function Liste({
  nom,
  libelle,
  valeur,
  options,
  surChangement,
}: {
  nom: string;
  libelle: string;
  valeur: string;
  options: { valeur: string; texte: string }[];
  surChangement: (valeur: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={nom}
        className="block text-xs font-medium tracking-bouton text-encre-70 uppercase"
      >
        {libelle}
      </label>
      <select
        id={nom}
        value={valeur}
        onChange={(evenement) => {
          surChangement(evenement.target.value);
        }}
        className="mt-2 h-12 w-full rounded-sm border border-trait-fort bg-craie px-3.5 text-sm"
      >
        {/* La liste peut encore être vide : le formulaire reste saisissable pendant
            que les référentiels arrivent. */}
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.valeur} value={option.valeur}>
            {option.texte}
          </option>
        ))}
      </select>
    </div>
  );
}

const enOptions = (
  valeurs: readonly string[],
  libelles: Record<string, string>,
): { valeur: string; texte: string }[] =>
  valeurs.map((valeur) => ({ valeur, texte: libelles[valeur] ?? valeur }));

const nationalitesEnOptions = (
  nationalites: Categorie[],
): { valeur: string; texte: string }[] =>
  nationalites.map(({ id, nom }) => ({ valeur: String(id), texte: nom }));

type SectionProprietes = {
  brouillon: BrouillonRecette;
  champs: Record<string, string>;
  modifier: Modification;
};

function Identite({ brouillon, champs, modifier }: SectionProprietes) {
  return (
    <>
      <Champ
        nom="titre"
        libelle="Titre"
        required
        value={brouillon.titre}
        erreur={champs.titre}
        onChange={(evenement) => {
          modifier({ titre: evenement.target.value });
        }}
      />

      <div>
        <label
          htmlFor="description"
          className="block text-xs font-medium tracking-bouton text-encre-70 uppercase"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={brouillon.description}
          onChange={(evenement) => {
            modifier({ description: evenement.target.value });
          }}
          className="mt-2 w-full rounded-sm border border-trait-fort bg-craie px-3.5 py-3 text-sm leading-relaxed"
        />
      </div>
    </>
  );
}

function Classement({
  brouillon,
  nationalites,
  modifier,
}: SectionProprietes & { nationalites: Categorie[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Liste
        nom="typeRecette"
        libelle="Type de recette"
        valeur={brouillon.typeRecette}
        options={enOptions(TYPES_RECETTE, LIBELLES_TYPE)}
        surChangement={(valeur) => {
          modifier({ typeRecette: valeur as TypeRecette });
        }}
      />
      <Liste
        nom="difficulte"
        libelle="Difficulté"
        valeur={brouillon.difficulte}
        options={enOptions(DIFFICULTES, LIBELLES_DIFFICULTE)}
        surChangement={(valeur) => {
          modifier({ difficulte: valeur as Difficulte });
        }}
      />
      <Liste
        nom="nationaliteId"
        libelle="Nationalité"
        valeur={brouillon.nationaliteId}
        options={nationalitesEnOptions(nationalites)}
        surChangement={(nationaliteId) => {
          modifier({ nationaliteId });
        }}
      />
    </div>
  );
}

function Mesures({ brouillon, champs, modifier }: SectionProprietes) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Champ
        nom="tempsPreparation"
        type="number"
        min="0"
        libelle="Temps de préparation (min)"
        value={brouillon.tempsPreparation}
        erreur={champs.tempsPreparation}
        onChange={(evenement) => {
          modifier({ tempsPreparation: evenement.target.value });
        }}
      />
      <Champ
        nom="tempsCuisson"
        type="number"
        min="0"
        libelle="Temps de cuisson (min)"
        value={brouillon.tempsCuisson}
        erreur={champs.tempsCuisson}
        onChange={(evenement) => {
          modifier({ tempsCuisson: evenement.target.value });
        }}
      />
      <Champ
        nom="portions"
        type="number"
        min="1"
        libelle="Portions"
        value={brouillon.portions}
        erreur={champs.portions}
        onChange={(evenement) => {
          modifier({ portions: evenement.target.value });
        }}
      />
    </div>
  );
}

function Medias({ brouillon, champs, modifier }: SectionProprietes) {
  return (
    <>
      <Champ
        nom="image"
        type="url"
        libelle="Image (URL)"
        aide="L’API attend une adresse : il n’existe pas de téléversement."
        required
        value={brouillon.image}
        erreur={champs.image}
        onChange={(evenement) => {
          modifier({ image: evenement.target.value });
        }}
      />

      <Champ
        nom="video"
        type="url"
        libelle="Vidéo"
        optionnel
        aide="Laissée vide, la section vidéo n’apparaît pas sur la page publique."
        value={brouillon.video}
        erreur={champs.video}
        onChange={(evenement) => {
          modifier({ video: evenement.target.value });
        }}
      />
    </>
  );
}

export function InformationsRecette({
  brouillon,
  nationalites,
  champs,
  modifier,
}: SectionProprietes & { nationalites: Categorie[] }) {
  const sections = { brouillon, champs, modifier };

  return (
    <div className="flex flex-col gap-4">
      <Identite {...sections} />
      <Classement {...sections} nationalites={nationalites} />
      <Mesures {...sections} />
      <Medias {...sections} />
    </div>
  );
}
