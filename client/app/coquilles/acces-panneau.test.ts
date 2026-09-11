import { describe, expect, it } from 'vitest';

import { peutAcceder, roleExigePour } from './acces-panneau';

describe('roleExigePour', () => {
  it.each(['/panneau/utilisateurs', '/panneau/categories/regimes'])(
    'réserve « %s » à l’administrateur',
    (chemin) => {
      expect(roleExigePour(chemin)).toBe('admin');
    },
  );

  it.each(['/panneau', '/panneau/recettes', '/panneau/recettes/nouvelle'])(
    'ouvre « %s » au modérateur',
    (chemin) => {
      expect(roleExigePour(chemin)).toBe('moderateur');
    },
  );
});

describe('peutAcceder', () => {
  it('laisse passer un administrateur partout : admin ⊃ modérateur', () => {
    expect(peutAcceder('admin', '/panneau/recettes')).toBe(true);
    expect(peutAcceder('admin', '/panneau/utilisateurs')).toBe(true);
  });

  it('arrête un modérateur aux pages d’administration', () => {
    expect(peutAcceder('moderateur', '/panneau/recettes')).toBe(true);
    expect(peutAcceder('moderateur', '/panneau/utilisateurs')).toBe(false);
  });

  it('ferme tout le panneau à un simple utilisateur', () => {
    expect(peutAcceder('utilisateur', '/panneau')).toBe(false);
  });
});
