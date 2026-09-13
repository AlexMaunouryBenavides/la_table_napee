import { describe, expect, it } from 'vitest';

import { RESSOURCES, ressourceDepuis } from './ressources-categories';

describe('ressourceDepuis', () => {
  it('reconnaît le segment d’URL de chaque ressource', () => {
    expect(ressourceDepuis('criteres-sante')?.libelle).toBe('Critères santé');
  });

  it('refuse un segment inconnu plutôt que de rendre un écran vide', () => {
    // Sans ce refus, `/panneau/categories/nimportequoi` afficherait un tableau vide
    // qui ressemblerait à « aucune valeur » — un mensonge.
    expect(ressourceDepuis('fromages')).toBeNull();
  });
});

describe('RESSOURCES', () => {
  it('donne à chacune sa route d’API et son filtre de catalogue', () => {
    // Une seule table : quatre branches recopiées, ce sont quatre occasions de
    // diverger le jour où une ressource s'ajoute.
    expect(RESSOURCES.map((ressource) => ressource.cle)).toEqual([
      'regimes',
      'criteres-sante',
      'types-aliment',
      'nationalites',
    ]);

    expect(ressourceDepuis('types-aliment')?.filtreCatalogue).toBe(
      'typeAliment',
    );
  });
});
