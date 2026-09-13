import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BrouillonRecette } from './brouillon-recette';

type EtatBrouillons = {
  /** Les brouillons EN COURS, par recette : une recette sans entrée n'a pas été
   *  touchée, l'éditeur montre alors ce que le serveur a enregistré. */
  brouillons: Record<string, BrouillonRecette>;
  garder: (cle: string, brouillon: BrouillonRecette) => void;
  /** Applique une saisie au brouillon, ou à `depart` s'il n'y en a pas encore. */
  modifier: (
    cle: string,
    depart: BrouillonRecette,
    valeurs: Partial<BrouillonRecette>,
  ) => void;
  oublier: (cle: string) => void;
};

/** `nouvelle` pour la création, l'identifiant sinon : un brouillon par recette. */
export function cleBrouillon(recetteId: number | null): string {
  return recetteId === null ? 'nouvelle' : String(recetteId);
}

/**
 * Le seul état CLIENT de l'application qui mérite un store : une recette en cours
 * d'écriture, qu'on ne veut pas perdre en quittant l'éditeur par erreur. Il est gardé
 * dans la session du navigateur — il survit à un rechargement, pas à la fermeture de
 * l'onglet, et ne quitte jamais cet appareil.
 */
export const useBrouillons = create<EtatBrouillons>()(
  persist(
    (set) => ({
      brouillons: {},
      garder: (cle, brouillon) => {
        set((etat) => ({
          brouillons: { ...etat.brouillons, [cle]: brouillon },
        }));
      },
      modifier: (cle, depart, valeurs) => {
        set((etat) => ({
          brouillons: {
            ...etat.brouillons,
            [cle]: { ...(etat.brouillons[cle] ?? depart), ...valeurs },
          },
        }));
      },
      oublier: (cle) => {
        set((etat) => {
          const restants = { ...etat.brouillons };
          Reflect.deleteProperty(restants, cle);
          return { brouillons: restants };
        });
      },
    }),
    {
      name: 'brouillons-recettes',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
