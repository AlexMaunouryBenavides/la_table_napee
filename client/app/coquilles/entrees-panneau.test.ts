import { describe, expect, it } from 'vitest';

import { sectionsPour } from './entrees-panneau';

function libelles(role: Parameters<typeof sectionsPour>[0]): string[] {
  return sectionsPour(role).flatMap((section) =>
    section.entrees.map((entree) => entree.libelle),
  );
}

describe('sectionsPour', () => {
  it('ne donne aucune entrée d’administration à un modérateur', () => {
    // Elles ne sont pas « masquées en CSS » : elles ne sont pas construites du tout.
    expect(libelles('moderateur')).toEqual(['Tableau de bord', 'Recettes']);
  });

  it('donne la gestion ET l’administration à un administrateur', () => {
    expect(libelles('admin')).toEqual([
      'Tableau de bord',
      'Recettes',
      'Utilisateurs',
      'Catégories',
    ]);
  });

  it('ne donne rien à un simple utilisateur', () => {
    expect(sectionsPour('utilisateur')).toEqual([]);
  });
});
