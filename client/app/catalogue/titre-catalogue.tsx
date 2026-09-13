import { TYPES_RECETTE, type TypeRecette } from '@recipe/types';
import { useSearchParams } from 'react-router';

import type { Referentiels } from './filtres-actifs';

const PLURIELS: Record<TypeRecette, string> = {
  entree: 'Entrées',
  plat: 'Plats',
  dessert: 'Desserts',
  glace: 'Glaces',
  boisson: 'Boissons',
  sauce: 'Sauces',
};

const TITRE_PAR_DEFAUT = 'Le catalogue';
const SEPARATEUR = ' · ';

export type TitreCompose = { base: string; precision: string | null };

/**
 * Le titre ne dit que le type et les régimes : le reste (difficulté, recherche, temps)
 * est déjà écrit dans la rangée « Actifs », et un titre qui énumère tout ne titre plus
 * rien.
 *
 * Les régimes gardent le nom qu'ils ont en base : accorder « Végan » en « végans »
 * à la volée serait une grammaire inventée, et fausse une fois sur deux.
 */
export function titreDuCatalogue(
  parametres: URLSearchParams,
  referentiels: Referentiels,
): TitreCompose {
  const type = TYPES_RECETTE.find((connu) => connu === parametres.get('type'));

  const regimes = parametres.getAll('regime').flatMap((id) => {
    const trouve = referentiels.regimes.find(
      (regime) => String(regime.id) === id,
    );
    // Absent du référentiel (supprimé, URL trafiquée) : on se tait.
    return trouve === undefined ? [] : [trouve.nom];
  });

  return {
    base: type === undefined ? TITRE_PAR_DEFAUT : PLURIELS[type],
    precision: regimes.length === 0 ? null : regimes.join(SEPARATEUR),
  };
}

export function TitreCatalogue({
  referentiels,
}: {
  referentiels: Referentiels;
}) {
  const [parametres] = useSearchParams();
  const { base, precision } = titreDuCatalogue(parametres, referentiels);

  return (
    <h1 className="mt-2 text-3xl leading-none">
      {base}
      {precision !== null && (
        <>
          {' '}
          <em className="text-ardoise">{precision}</em>
        </>
      )}
    </h1>
  );
}
