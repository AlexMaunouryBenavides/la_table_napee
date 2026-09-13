import { type Avis } from '../avis/entities/avis.entity';

import { calculerNoteMoyenne } from './note-moyenne';

const avisNotes = (...notes: number[]): Avis[] =>
  notes.map((note) => ({ note }) as Avis);

describe('calculerNoteMoyenne', () => {
  it('renvoie null quand la recette n’a aucun avis', () => {
    // null, et surtout pas 0 : 0 se lirait « très mal notée ».
    expect(calculerNoteMoyenne([])).toBeNull();
  });

  it('calcule la moyenne des notes', () => {
    expect(calculerNoteMoyenne(avisNotes(2, 4))).toBe(3);
  });

  it('arrondit à une décimale', () => {
    expect(calculerNoteMoyenne(avisNotes(4, 5, 5))).toBe(4.7);
  });

  it('gère un avis unique', () => {
    expect(calculerNoteMoyenne(avisNotes(5))).toBe(5);
  });
});
