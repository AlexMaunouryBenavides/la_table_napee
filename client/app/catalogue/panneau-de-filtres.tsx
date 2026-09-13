import { DIFFICULTES, TYPES_RECETTE } from '@recipe/types';
import { type ReactNode, useId } from 'react';
import { Link } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';
import { RechercheDebattue } from '../composants/recherche-debattue';

import { type ControleCriteres, useCriteres } from './criteres-controles';
import { CurseurTemps } from './curseur-temps';
import type { Referentiels } from './filtres-actifs';
import { GroupeFiltre } from './groupe-filtre';

const INTITULE =
  'block text-xs font-medium tracking-bouton text-encre-70 uppercase';
const CONTROLE =
  'mt-3 h-11 w-full rounded-sm border border-trait-fort bg-craie px-3.5 text-sm';

type AvecControle = { controle?: ControleCriteres };

function enOptions(
  categories: { id: number; nom: string }[],
): { valeur: string; libelle: string }[] {
  return categories.map((categorie) => ({
    valeur: String(categorie.id),
    libelle: categorie.nom,
  }));
}

/** Les valeurs d'énumération s'affichent telles que l'API les renvoie. */
function enumEnOptions(
  valeurs: readonly string[],
): { valeur: string; libelle: string }[] {
  return valeurs.map((valeur) => ({ valeur, libelle: valeur }));
}

/** Un groupe du panneau, séparé du suivant par un filet. */
function Bloc({ children }: { children: ReactNode }) {
  return <div className="py-5 first:pt-0 last:pb-0">{children}</div>;
}

function ChampTitre() {
  return (
    <Bloc>
      <p aria-hidden="true" className={INTITULE}>
        Titre
      </p>
      <div className="mt-3">
        <RechercheDebattue
          libelle="Rechercher dans le catalogue"
          invite="Un titre, un mot…"
          className="rounded-sm"
        />
      </div>
    </Bloc>
  );
}

function ChoixNationalite({
  referentiels,
  controle,
}: AvecControle & { referentiels: Referentiels }) {
  const [parametres, setParametres] = useCriteres(controle);
  const id = useId();

  return (
    <Bloc>
      <label htmlFor={id} className={INTITULE}>
        Nationalité
      </label>
      <select
        id={id}
        value={parametres.get('nationalite') ?? ''}
        onChange={(evenement) => {
          setParametres(
            avecCritere(parametres, 'nationalite', evenement.target.value),
          );
        }}
        className={CONTROLE}
      >
        <option value="">Toutes les nationalités</option>
        {referentiels.nationalites.map((nationalite) => (
          <option key={nationalite.id} value={nationalite.id}>
            {nationalite.nom}
          </option>
        ))}
      </select>
    </Bloc>
  );
}

/** Les critères portés par la recette elle-même : énumérations et durée. */
function CriteresDeRecette({ controle }: AvecControle) {
  return (
    <>
      <Bloc>
        <GroupeFiltre
          legende="Type de recette"
          cle="type"
          choixUnique
          options={enumEnOptions(TYPES_RECETTE)}
          controle={controle}
        />
      </Bloc>
      <Bloc>
        <GroupeFiltre
          legende="Difficulté"
          cle="difficulte"
          choixUnique
          options={enumEnOptions(DIFFICULTES)}
          controle={controle}
        />
      </Bloc>
      <Bloc>
        <CurseurTemps controle={controle} />
      </Bloc>
    </>
  );
}

/** Les critères issus des référentiels : ils arrivent de l'API, ou restent vides. */
function CriteresDeCategories({
  referentiels,
  controle,
}: AvecControle & { referentiels: Referentiels }) {
  return (
    <>
      <Bloc>
        <GroupeFiltre
          legende="Régimes"
          cle="regime"
          apparence="cases"
          options={enOptions(referentiels.regimes)}
          controle={controle}
        />
      </Bloc>
      <Bloc>
        <GroupeFiltre
          legende="Critères santé"
          cle="critereSante"
          apparence="cases"
          options={enOptions(referentiels.criteresSante)}
          controle={controle}
        />
      </Bloc>
      <Bloc>
        <GroupeFiltre
          legende="Types d’aliment"
          cle="typeAliment"
          options={enOptions(referentiels.typesAliment)}
          controle={controle}
        />
      </Bloc>
      <ChoixNationalite referentiels={referentiels} controle={controle} />
    </>
  );
}

/**
 * Les critères de filtre, sans leur habillage. Le panneau de bureau les branche sur
 * l'URL ; le tiroir mobile sur un brouillon, avec son propre titre et ses boutons.
 * La recherche par titre reste hors du tiroir : elle vit dans la barre mobile.
 */
export function CriteresDeFiltre({
  referentiels,
  controle,
}: AvecControle & { referentiels: Referentiels }) {
  return (
    <div className="flex flex-col divide-y divide-trait">
      <CriteresDeRecette controle={controle} />
      <CriteresDeCategories referentiels={referentiels} controle={controle} />
    </div>
  );
}

/**
 * Huit des neuf critères du contrat. Le neuvième — l'ingrédient — attend
 * `ChampAutocompletion` : l'API le veut par identifiant, pas par nom.
 */
export function PanneauDeFiltres({
  referentiels,
}: {
  referentiels: Referentiels;
}) {
  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-2xl">Filtres</h2>
        <Link to="/recettes" className="text-xs tracking-section uppercase">
          Tout effacer
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-trait">
        <ChampTitre />
        <div className="py-5 last:pb-0">
          <CriteresDeFiltre referentiels={referentiels} />
        </div>
      </div>
    </div>
  );
}
