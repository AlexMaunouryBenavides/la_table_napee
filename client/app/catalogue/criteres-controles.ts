import { useSearchParams } from 'react-router';

/**
 * Des critères tenus par quelqu'un d'autre que l'URL : le tiroir mobile accumule ses
 * choix dans un brouillon, et ne les écrit dans l'URL qu'à la validation.
 */
export type ControleCriteres = {
  criteres: URLSearchParams;
  surCriteres: (suivants: URLSearchParams) => void;
};

/**
 * Les critères à lire et la façon de les changer. Sans contrôle, c'est l'URL — le
 * panneau de bureau, où chaque choix filtre aussitôt.
 */
export function useCriteres(
  controle?: ControleCriteres,
): [URLSearchParams, (suivants: URLSearchParams) => void] {
  const [parametres, setParametres] = useSearchParams();

  return controle === undefined
    ? [parametres, setParametres]
    : [controle.criteres, controle.surCriteres];
}
