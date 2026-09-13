import { useMutation } from '@tanstack/react-query';

import {
  creerCategorie,
  renommerCategorie,
  supprimerCategorie,
} from '../acces-api/categories';
import { ErreurApi } from '../acces-api/erreur-api';
import { clientRequetes } from '../requetes/client-requetes';

import { ressourceDepuis } from './ressources-categories';

export type ResultatCategorie = {
  succes: boolean;
  /** Ce qui n'appartient à aucun champ : un refus métier. */
  message?: string;
  /** Un nom déjà pris se dit SUR le champ, pas en bandeau. */
  champNom?: string;
  /** Les recettes qui retiennent la catégorie — le chemin de sortie du refus. */
  versRecettes?: string;
};

const INTROUVABLE = 404;
const CONFLIT = 409;

function erreurApi(erreur: unknown): ErreurApi {
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return erreur;
}

/** Le seul lien utile face à « encore utilisée » : le catalogue, filtré sur elle. */
function versRecettes(ressource: string, id: number): string | undefined {
  const filtre = ressourceDepuis(ressource)?.filtreCatalogue;

  return filtre === undefined ? undefined : `/recettes?${filtre}=${String(id)}`;
}

async function ecrireLeNom(
  ecriture: () => Promise<unknown>,
): Promise<ResultatCategorie> {
  try {
    await ecriture();

    return { succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Le seul refus possible ici est le doublon de nom, et il appartient au champ.
    return erreur.statut === CONFLIT
      ? { succes: false, champNom: erreur.message }
      : { succes: false, message: erreur.message };
  }
}

export function executerCreation(
  ressource: string,
  nom: string,
): Promise<ResultatCategorie> {
  return ecrireLeNom(() => creerCategorie(ressource, nom.trim()));
}

export function executerRenommage(
  ressource: string,
  id: number,
  nom: string,
): Promise<ResultatCategorie> {
  return ecrireLeNom(() => renommerCategorie(ressource, id, nom.trim()));
}

export async function executerSuppressionCategorie(
  ressource: string,
  id: number,
): Promise<ResultatCategorie> {
  try {
    await supprimerCategorie(ressource, id);

    return { succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Un 404 n'est pas un échec : la catégorie n'est plus là, c'est le but.
    if (erreur.statut === INTROUVABLE) {
      return { succes: true };
    }

    return {
      succes: false,
      message: erreur.message,
      ...(erreur.statut === CONFLIT
        ? { versRecettes: versRecettes(ressource, id) }
        : {}),
    };
  }
}

/**
 * Une écriture par formulaire ou par ligne : son attente et son refus ne touchent
 * qu'elle. Un succès relit TOUTES les catégories — cet écran comme les filtres du
 * catalogue et l'éditeur, qui lisent les mêmes requêtes.
 */
export function useEcritureCategorie() {
  return useMutation({
    mutationFn: (ecrire: () => Promise<ResultatCategorie>) => ecrire(),
    onSuccess: async (resultat) => {
      if (resultat.succes) {
        await clientRequetes.invalidateQueries({ queryKey: ['categories'] });
      }
    },
  });
}

export type EcritureCategorie = ReturnType<typeof useEcritureCategorie>;
