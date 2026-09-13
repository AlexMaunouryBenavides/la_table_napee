import { describe, expect, it } from 'vitest';

import { formaterQuantite, libelleUnite } from './quantites';

describe('formaterQuantite', () => {
  it('dit « à volonté » quand il n’y a pas de quantité', () => {
    // `null` ne veut pas dire zéro : il veut dire sel, poivre, à l'œil.
    expect(formaterQuantite(null)).toBe('à volonté');
  });

  it('ne traîne pas les décimales du pilote MySQL', () => {
    // Un `decimal(6,2)` revient en « 200.00 » : l'afficher tel quel est laid et faux
    // de sens — personne n'écrit « 200,00 g de farine ».
    expect(formaterQuantite('200.00')).toBe('200');
  });

  it('écrit les décimales réelles à la française', () => {
    expect(formaterQuantite('0.50')).toBe('0,5');
  });
});

describe('libelleUnite', () => {
  it('écrit l’unité en toutes lettres', () => {
    expect(libelleUnite('cuillere_a_soupe')).toBe('cuillère à soupe');
  });
});
