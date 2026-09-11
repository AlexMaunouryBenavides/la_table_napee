import { describe, expect, it } from 'vitest';

import { avecCritere, avecPage, lirePage } from './criteres-url';

describe('lirePage', () => {
  it('rend la première page quand l’URL n’en nomme aucune', () => {
    expect(lirePage(new URLSearchParams(''))).toBe(1);
  });

  it('rend la page demandée', () => {
    expect(lirePage(new URLSearchParams('page=4'))).toBe(4);
  });

  it.each(['page=0', 'page=-3', 'page=abc', 'page='])(
    'retombe sur la première page quand l’URL dit « %s »',
    (requete) => {
      // Une URL se trafique à la main : elle ne doit jamais produire une requête absurde.
      expect(lirePage(new URLSearchParams(requete))).toBe(1);
    },
  );
});

describe('avecCritere', () => {
  it('pose la valeur et ramène à la première page', () => {
    const depart = new URLSearchParams('difficulte=facile&page=7');

    const resultat = avecCritere(depart, 'difficulte', 'difficile');

    expect(resultat.get('difficulte')).toBe('difficile');
    expect(resultat.get('page')).toBe('1');
  });

  it('retire le critère quand la valeur est nulle, et ramène à la première page', () => {
    const depart = new URLSearchParams('difficulte=facile&page=7');

    const resultat = avecCritere(depart, 'difficulte', null);

    expect(resultat.has('difficulte')).toBe(false);
    expect(resultat.get('page')).toBe('1');
  });

  it('ne touche pas aux autres critères', () => {
    const depart = new URLSearchParams('recherche=tarte&tri=note&page=2');

    const resultat = avecCritere(depart, 'difficulte', 'facile');

    expect(resultat.get('recherche')).toBe('tarte');
    expect(resultat.get('tri')).toBe('note');
  });
});

describe('avecPage', () => {
  it('change la page sans toucher aux critères', () => {
    // C'est toute la différence entre paginer et filtrer : paginer conserve le filtre.
    const depart = new URLSearchParams(
      'recherche=tarte&difficulte=facile&page=1',
    );

    const resultat = avecPage(depart, 3);

    expect(resultat.get('page')).toBe('3');
    expect(resultat.get('recherche')).toBe('tarte');
    expect(resultat.get('difficulte')).toBe('facile');
  });
});

describe('immuabilité', () => {
  it('rend une copie, sans jamais modifier les paramètres reçus', () => {
    const depart = new URLSearchParams('difficulte=facile&page=7');

    avecCritere(depart, 'difficulte', 'difficile');
    avecPage(depart, 3);

    expect(depart.toString()).toBe('difficulte=facile&page=7');
  });
});
