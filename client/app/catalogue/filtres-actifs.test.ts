import { describe, expect, it } from 'vitest';

import { filtresActifs, sansFiltre, type Referentiels } from './filtres-actifs';

const REFERENTIELS: Referentiels = {
  regimes: [
    { id: 1, nom: 'Végan' },
    { id: 2, nom: 'Sans gluten' },
  ],
  criteresSante: [{ id: 7, nom: 'Faible en sel' }],
  typesAliment: [{ id: 4, nom: 'Poisson' }],
  nationalites: [{ id: 3, nom: 'Italienne' }],
};

function libelles(requete: string): string[] {
  return filtresActifs(new URLSearchParams(requete), REFERENTIELS).map(
    (filtre) => filtre.libelle,
  );
}

describe('filtresActifs', () => {
  it('ne voit aucun filtre dans une URL nue', () => {
    expect(libelles('')).toEqual([]);
  });

  it('nomme un critère à valeur fermée', () => {
    expect(libelles('difficulte=facile')).toEqual(['Facile']);
  });

  it('rend un filtre PAR valeur d’un critère répétable', () => {
    // `?regime=1&regime=2` veut dire « végan ET sans gluten » : deux filtres, donc
    // deux retraits possibles.
    expect(libelles('regime=1&regime=2')).toEqual(['Végan', 'Sans gluten']);
  });

  it('ignore un identifiant absent du référentiel', () => {
    // Afficher « undefined » serait pire que de ne rien afficher.
    expect(libelles('regime=1&regime=999')).toEqual(['Végan']);
  });

  it('ne compte ni la page, ni la limite, ni le tri', () => {
    // On ne propose pas de « retirer » une pagination : ce n'est pas un filtre.
    expect(libelles('page=3&limite=20&tri=-dateCreation')).toEqual([]);
  });
});

describe('sansFiltre', () => {
  it('retire la bonne valeur et ramène à la première page', () => {
    const depart = new URLSearchParams('regime=1&regime=2&page=4');
    const vegan = filtresActifs(depart, REFERENTIELS)[0];

    expect(vegan).toBeDefined();
    const resultat = sansFiltre(depart, vegan!);

    expect(resultat.getAll('regime')).toEqual(['2']);
    expect(resultat.get('page')).toBe('1');
  });
});
