import type { Unite } from '@recipe/types';

const LIBELLES_UNITE: Record<Unite, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'l',
  piece: 'pièce',
  cuillere_a_soupe: 'cuillère à soupe',
  cuillere_a_cafe: 'cuillère à café',
  pincee: 'pincée',
};

export function libelleUnite(unite: Unite): string {
  return LIBELLES_UNITE[unite];
}

/**
 * `quantite` arrive en chaîne parce que le pilote MySQL rend les `decimal` ainsi :
 * « 200.00 ». Et `null` ne veut pas dire zéro — il veut dire sel, poivre, à l'œil.
 */
export function formaterQuantite(quantite: string | null): string {
  if (quantite === null) {
    return 'à volonté';
  }

  const nombre = Number(quantite);

  if (Number.isNaN(nombre)) {
    return quantite;
  }

  // `Number` mange les zéros de fin ; la virgule est celle du français.
  return String(nombre).replace('.', ',');
}
