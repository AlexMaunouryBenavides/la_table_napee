import type { Page, RecetteResume } from '@recipe/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listerRecettes } from '../acces-api/recettes';

import { chargerSuggestions, termeDeRecherche } from './suggestions';

vi.mock('../acces-api/recettes');

function recette(id: number): RecetteResume {
  return {
    id,
    titre: `Tarte n°${String(id)}`,
    image: '',
    difficulte: 'facile',
    typeRecette: 'plat',
    tempsPreparation: 10,
    tempsCuisson: 20,
    portions: 4,
    nationalite: 'Française',
    noteMoyenne: null,
  };
}

function page(donnees: RecetteResume[]): Page<RecetteResume> {
  return { donnees, total: donnees.length, page: 1, limite: 3 };
}

beforeEach(() => {
  vi.mocked(listerRecettes).mockReset();
});

describe('termeDeRecherche', () => {
  it('retient le mot le plus long de l’adresse', () => {
    // Le plus long est le plus spécifique : « tomate » trie mieux que « tarte ».
    expect(termeDeRecherche('/recettes/tarte-fine-tomate')).toBe('tomate');
  });

  it('ignore les mots de navigation, les nombres et les mots trop courts', () => {
    expect(termeDeRecherche('/panneau/categories/12/ab-soupe')).toBe('soupe');
    expect(termeDeRecherche('/mon-compte/recettes')).toBeNull();
  });

  it('décode les accents et passe en minuscules', () => {
    expect(termeDeRecherche('/Cr%C3%A8me-Br%C3%BBl%C3%A9e')).toBe('brûlée');
  });

  it('rend null quand aucun mot n’est exploitable', () => {
    expect(termeDeRecherche('/recettes/42')).toBeNull();
    expect(termeDeRecherche('/x')).toBeNull();
  });
});

describe('chargerSuggestions', () => {
  it('n’appelle pas l’API sans mot exploitable', async () => {
    await expect(chargerSuggestions('/recettes/42')).resolves.toEqual([]);

    expect(listerRecettes).not.toHaveBeenCalled();
  });

  it('cherche le mot retenu, trois résultats au plus', async () => {
    vi.mocked(listerRecettes).mockResolvedValue(page([recette(1)]));

    await expect(chargerSuggestions('/recettes/tarte-tomate')).resolves.toEqual(
      [recette(1)],
    );

    const criteres = vi.mocked(listerRecettes).mock.calls[0]?.[0];
    expect(criteres?.get('recherche')).toBe('tomate');
    expect(criteres?.get('limite')).toBe('3');
  });

  it('se tait quand l’API échoue : la 404 reste une 404', async () => {
    vi.mocked(listerRecettes).mockRejectedValue(new Error('panne'));

    await expect(chargerSuggestions('/recettes/tomate')).resolves.toEqual([]);
  });
});
