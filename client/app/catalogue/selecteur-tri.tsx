import { useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';

const CLE = 'tri';

// Les seuls tris que l'API accepte (`TRIS` côté serveur : date, titre, temps de
// préparation). Pas de tri par note : il n'existe pas, le proposer mènerait à un 400.
// Le premier est le défaut de l'API — l'URL n'a pas besoin de le porter.
const TRIS = [
  { valeur: '-dateCreation', libelle: 'Plus récentes' },
  { valeur: 'titre', libelle: 'Titre A → Z' },
  { valeur: '-titre', libelle: 'Titre Z → A' },
  { valeur: 'tempsPreparation', libelle: 'Préparation la plus courte' },
] as const;

const TRI_PAR_DEFAUT = TRIS[0].valeur;

/** Une URL se trafique à la main : un tri inconnu retombe sur le défaut. */
function triCourant(parametres: URLSearchParams): string {
  const demande = parametres.get(CLE);

  return TRIS.some(({ valeur }) => valeur === demande)
    ? (demande ?? TRI_PAR_DEFAUT)
    : TRI_PAR_DEFAUT;
}

export function SelecteurTri() {
  const [parametres, setParametres] = useSearchParams();

  return (
    <label className="flex items-center gap-3 text-sm text-encre-55">
      Trier
      <select
        value={triCourant(parametres)}
        onChange={(evenement) => {
          const valeur = evenement.target.value;
          // `avecCritere` ramène en page 1 ; le défaut n'encombre pas l'URL.
          setParametres(
            avecCritere(
              parametres,
              CLE,
              valeur === TRI_PAR_DEFAUT ? null : valeur,
            ),
          );
        }}
        className="h-10 min-w-48 rounded-sm border border-trait-fort bg-craie px-3.5 text-sm text-encre"
      >
        {TRIS.map(({ valeur, libelle }) => (
          <option key={valeur} value={valeur}>
            {libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
