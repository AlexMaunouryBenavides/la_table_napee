import { DIFFICULTES, TYPES_RECETTE } from '@recipe/types';
import { useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';
import { LIBELLES_DIFFICULTE, LIBELLES_TYPE } from '../libelles';

import type { Referentiels } from './filtres-actifs';
import { GroupeFiltre } from './groupe-filtre';
import { RechercheDebattue } from './recherche-debattue';

function enOptions(
  categories: { id: number; nom: string }[],
): { valeur: string; libelle: string }[] {
  return categories.map((categorie) => ({
    valeur: String(categorie.id),
    libelle: categorie.nom,
  }));
}

function ChoixNationalite({ referentiels }: { referentiels: Referentiels }) {
  const [parametres, setParametres] = useSearchParams();

  return (
    <div>
      <label
        htmlFor="nationalite"
        className="block text-xs tracking-etiquette text-encre-70 uppercase"
      >
        Nationalité
      </label>
      <select
        id="nationalite"
        value={parametres.get('nationalite') ?? ''}
        onChange={(evenement) => {
          setParametres(
            avecCritere(parametres, 'nationalite', evenement.target.value),
          );
        }}
        className="mt-1 h-11 w-full rounded-sm border border-trait-fort bg-craie px-3"
      >
        <option value="">Toutes</option>
        {referentiels.nationalites.map((nationalite) => (
          <option key={nationalite.id} value={nationalite.id}>
            {nationalite.nom}
          </option>
        ))}
      </select>
    </div>
  );
}

function TempsMaximum() {
  const [parametres, setParametres] = useSearchParams();

  return (
    <div>
      <label
        htmlFor="tempsMax"
        className="block text-xs tracking-etiquette text-encre-70 uppercase"
      >
        Temps total maximum
      </label>
      <input
        id="tempsMax"
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="en minutes"
        value={parametres.get('tempsMax') ?? ''}
        onChange={(evenement) => {
          setParametres(
            avecCritere(parametres, 'tempsMax', evenement.target.value),
          );
        }}
        className="mt-1 h-11 w-full rounded-sm border border-trait-fort bg-craie px-3"
      />
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
    <div className="flex flex-col gap-6">
      <RechercheDebattue />

      <GroupeFiltre
        legende="Type de plat"
        cle="type"
        choixUnique
        options={TYPES_RECETTE.map((type) => ({
          valeur: type,
          libelle: LIBELLES_TYPE[type],
        }))}
      />

      <GroupeFiltre
        legende="Difficulté"
        cle="difficulte"
        choixUnique
        options={DIFFICULTES.map((difficulte) => ({
          valeur: difficulte,
          libelle: LIBELLES_DIFFICULTE[difficulte],
        }))}
      />

      <TempsMaximum />
      <ChoixNationalite referentiels={referentiels} />

      <GroupeFiltre
        legende="Régimes"
        cle="regime"
        options={enOptions(referentiels.regimes)}
      />
      <GroupeFiltre
        legende="Critères de santé"
        cle="critereSante"
        options={enOptions(referentiels.criteresSante)}
      />
      <GroupeFiltre
        legende="Types d’aliment"
        cle="typeAliment"
        options={enOptions(referentiels.typesAliment)}
      />
    </div>
  );
}
