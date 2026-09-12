import type { Recette } from '@recipe/types';
import { describe, expect, it } from 'vitest';

import {
  brouillonDepuis,
  brouillonVide,
  corpsDepuis,
  deplacerEtape,
} from './brouillon-recette';

const TARTE: Recette = {
  id: 42,
  titre: 'Tarte fine aux tomates confites',
  description: 'Une pâte sablée au parmesan.',
  image: 'https://exemple.test/tarte.jpg',
  video: null,
  difficulte: 'moyen',
  typeRecette: 'plat',
  nationalite: { id: 3, nom: 'Française' },
  tempsPreparation: 45,
  tempsCuisson: 25,
  portions: 4,
  compositions: [
    {
      id: 1,
      quantite: '500.00',
      unite: 'g',
      ingredient: { id: 7, nom: 'Tomates cerises' },
    },
    {
      id: 2,
      quantite: null,
      unite: 'pincee',
      ingredient: { id: 9, nom: 'Fleur de sel' },
    },
  ],
  etapes: [
    { id: 1, numero: 1, contenu: 'Préchauffer le four.' },
    { id: 2, numero: 2, contenu: 'Enfourner deux heures.' },
  ],
  avis: [],
  regimes: [{ id: 2, nom: 'Végétarien' }],
  criteresSante: [],
  typesAliment: [{ id: 5, nom: 'Légume' }],
  auteur: null,
  dateCreation: '2026-03-04T12:00:00.000Z',
  noteMoyenne: 4.8,
};

describe('brouillonDepuis / corpsDepuis — l’aller-retour', () => {
  it('recharge une recette existante sans rien perdre ni rien inventer', () => {
    const { corps } = corpsDepuis(brouillonDepuis(TARTE));

    expect(corps).toEqual({
      titre: 'Tarte fine aux tomates confites',
      description: 'Une pâte sablée au parmesan.',
      image: 'https://exemple.test/tarte.jpg',
      difficulte: 'moyen',
      typeRecette: 'plat',
      nationaliteId: 3,
      tempsPreparation: 45,
      tempsCuisson: 25,
      portions: 4,
      ingredients: [
        { nom: 'Tomates cerises', quantite: 500, unite: 'g' },
        { nom: 'Fleur de sel', unite: 'pincee' },
      ],
      etapes: ['Préchauffer le four.', 'Enfourner deux heures.'],
      regimes: [2],
      criteresSante: [],
      typesAliment: [5],
    });
  });

  it('produit le même corps en création qu’en modification', () => {
    // Un seul formulaire, deux verbes : le corps ne dépend pas de la route.
    const depuisRien = brouillonVide();
    const rempli = { ...depuisRien, ...brouillonDepuis(TARTE) };

    expect(corpsDepuis(rempli).corps).toEqual(
      corpsDepuis(brouillonDepuis(TARTE)).corps,
    );
  });
});

describe('corpsDepuis — les quantités', () => {
  it('omet une quantité vide plutôt que d’envoyer zéro', () => {
    // Absente veut dire « à volonté » (sel, poivre). Zéro voudrait dire « aucun ».
    const { corps } = corpsDepuis(brouillonDepuis(TARTE));

    expect(corps?.ingredients[1]).toEqual({
      nom: 'Fleur de sel',
      unite: 'pincee',
    });
    expect(corps?.ingredients[1]).not.toHaveProperty('quantite');
  });

  it('refuse une quantité nulle ou négative avant l’envoi', () => {
    // L'API exige un nombre POSITIF : l'envoyer quand même vaudrait un 400.
    const brouillon = brouillonDepuis(TARTE);
    brouillon.ingredients[0] = { nom: 'Tomates', quantite: '0', unite: 'g' };

    const { corps, erreurs } = corpsDepuis(brouillon);

    expect(corps).toBeNull();
    expect(Object.keys(erreurs)).not.toHaveLength(0);
  });
});

describe('corpsDepuis — ce qu’on n’envoie pas', () => {
  it('ignore une ligne d’ingrédient jamais remplie', () => {
    // Une ligne vide est offerte d'emblée : elle ne doit pas bloquer l'enregistrement.
    const brouillon = brouillonDepuis(TARTE);
    brouillon.ingredients.push({ nom: '  ', quantite: '', unite: 'g' });

    expect(corpsDepuis(brouillon).corps?.ingredients).toHaveLength(2);
  });

  it('omet la vidéo laissée vide au lieu d’envoyer une chaîne vide', () => {
    const { corps } = corpsDepuis(brouillonDepuis(TARTE));

    expect(corps).not.toHaveProperty('video');
  });

  it('exige au moins un ingrédient et une étape', () => {
    const { corps, erreurs } = corpsDepuis(brouillonVide());

    expect(corps).toBeNull();
    expect(erreurs.ingredients).toBeDefined();
    expect(erreurs.etapes).toBeDefined();
  });
});

describe('deplacerEtape', () => {
  it('renumérote par la position : le contenu bouge, pas un champ « numéro »', () => {
    const etapes = ['Préchauffer.', 'Enfourner.', 'Servir.'];

    expect(deplacerEtape(etapes, 2, -1)).toEqual([
      'Préchauffer.',
      'Servir.',
      'Enfourner.',
    ]);
  });

  it('ne fait rien aux bords, plutôt que de faire disparaître une étape', () => {
    const etapes = ['Préchauffer.', 'Enfourner.'];

    expect(deplacerEtape(etapes, 0, -1)).toEqual(etapes);
    expect(deplacerEtape(etapes, 1, 1)).toEqual(etapes);
  });
});
