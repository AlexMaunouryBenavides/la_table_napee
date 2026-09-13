import type { RecetteResume } from '@recipe/types';

import { ErreurApi } from '../acces-api/erreur-api';
import { listerRecettes } from '../acces-api/recettes';
import { Vitrine } from '../accueil/vitrine';

import type { Route } from './+types/accueil';

const RECETTES_MISES_EN_AVANT = 3;

type DonneesAccueil = {
  recettes: RecetteResume[];
  /** `null` = l'API n'a pas répondu. Ce n'est pas zéro. */
  total: number | null;
  echec: string | null;
};

/**
 * La liste est chargée indépendamment du reste : son échec affiche un bandeau et
 * laisse la vitrine debout, il ne fait pas tomber la page.
 *
 * Le tri par défaut est `-dateCreation` : l'API n'accepte pas de tri par note, la
 * vitrine montre donc les dernières publiées.
 */
export async function clientLoader(): Promise<DonneesAccueil> {
  try {
    const page = await listerRecettes(
      new URLSearchParams({ limite: String(RECETTES_MISES_EN_AVANT) }),
    );

    return { recettes: page.donnees, total: page.total, echec: null };
  } catch (erreur) {
    return {
      recettes: [],
      total: null,
      echec:
        erreur instanceof ErreurApi
          ? erreur.message
          : 'Les recettes n’ont pas pu être chargées.',
    };
  }
}

export default function Accueil({ loaderData }: Route.ComponentProps) {
  return (
    <Vitrine
      recettes={loaderData.recettes}
      total={loaderData.total}
      echec={loaderData.echec}
    />
  );
}
