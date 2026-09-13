import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { avecCritere } from '../acces-api/criteres-url';

const DELAI_PAR_DEFAUT_MS = 300;

/**
 * Attend que la frappe se calme avant d'écrire dans l'URL.
 *
 * Sans ce délai, « tarte » lance cinq requêtes, et rien ne garantit que la réponse de
 * « tar » n'arrivera pas APRÈS celle de « tarte » — l'utilisateur verrait alors des
 * résultats qui ne correspondent pas à ce qu'il lit dans le champ.
 */
export function RechercheDebattue({
  libelle,
  invite,
  delaiMs = DELAI_PAR_DEFAUT_MS,
  className = 'rounded-pilule',
}: {
  libelle: string;
  invite: string;
  delaiMs?: number;
  /** La forme du champ : pilule dans une barre d'outils, rectangle dans un panneau. */
  className?: string;
}) {
  const [parametres, setParametres] = useSearchParams();
  const [saisie, setSaisie] = useState(parametres.get('recherche') ?? '');

  useEffect(() => {
    if (saisie === (parametres.get('recherche') ?? '')) {
      return undefined;
    }

    const minuterie = setTimeout(() => {
      setParametres(avecCritere(parametres, 'recherche', saisie));
    }, delaiMs);

    return () => {
      clearTimeout(minuterie);
    };
  }, [saisie, delaiMs, parametres, setParametres]);

  return (
    <input
      type="search"
      name="recherche"
      value={saisie}
      onChange={(evenement) => {
        setSaisie(evenement.target.value);
      }}
      aria-label={libelle}
      placeholder={invite}
      className={`h-11 w-full border border-trait-fort bg-craie px-4 text-sm ${className}`}
    />
  );
}
