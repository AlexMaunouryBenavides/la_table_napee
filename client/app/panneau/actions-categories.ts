import {
  creerCategorie,
  renommerCategorie,
  supprimerCategorie,
} from '../acces-api/categories';
import { ErreurApi } from '../acces-api/erreur-api';

import { ressourceDepuis } from './ressources-categories';

/** La cible du retour : l'identifiant de la ligne, ou `creation` pour le formulaire
 *  d'ajout. C'est elle qui dit OÙ afficher le message. */
export const CIBLE_CREATION = 'creation';

export type ResultatCategorie = {
  cible: string;
  succes: boolean;
  /** Ce qui n'appartient à aucun champ : un refus métier. */
  message?: string;
  /** Un nom déjà pris se dit SUR le champ, pas en bandeau. */
  champNom?: string;
  /** La saisie refusée, pour ne pas la faire retaper. */
  saisie?: string;
  /** Les recettes qui retiennent la catégorie — le chemin de sortie du refus. */
  versRecettes?: string;
};

const INTROUVABLE = 404;
const CONFLIT = 409;

function texte(donnees: FormData, champ: string): string {
  const valeur = donnees.get(champ);

  return typeof valeur === 'string' ? valeur.trim() : '';
}

function erreurApi(erreur: unknown): ErreurApi {
  if (!(erreur instanceof ErreurApi)) {
    throw erreur;
  }

  return erreur;
}

/** Le seul lien utile face à « encore utilisée » : le catalogue, filtré sur elle. */
function versRecettes(ressource: string, id: string): string | undefined {
  const filtre = ressourceDepuis(ressource)?.filtreCatalogue;

  return filtre === undefined ? undefined : `/recettes?${filtre}=${id}`;
}

async function ecrireLeNom(
  cible: string,
  saisie: string,
  ecriture: () => Promise<unknown>,
): Promise<ResultatCategorie> {
  try {
    await ecriture();

    return { cible, succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Le seul refus possible ici est le doublon de nom, et il appartient au champ.
    return erreur.statut === CONFLIT
      ? { cible, succes: false, champNom: erreur.message, saisie }
      : { cible, succes: false, message: erreur.message, saisie };
  }
}

async function executerSuppression(
  ressource: string,
  id: string,
): Promise<ResultatCategorie> {
  try {
    await supprimerCategorie(ressource, Number(id));

    return { cible: id, succes: true };
  } catch (leve) {
    const erreur = erreurApi(leve);

    // Un 404 n'est pas un échec : la catégorie n'est plus là, c'est le but.
    if (erreur.statut === INTROUVABLE) {
      return { cible: id, succes: true };
    }

    return {
      cible: id,
      succes: false,
      message: erreur.message,
      ...(erreur.statut === CONFLIT
        ? { versRecettes: versRecettes(ressource, id) }
        : {}),
    };
  }
}

export function executerActionCategorie(
  donnees: FormData,
): Promise<ResultatCategorie> {
  const ressource = texte(donnees, 'ressource');
  const nom = texte(donnees, 'nom');
  const id = texte(donnees, 'id');

  switch (texte(donnees, 'intention')) {
    case 'creation':
      return ecrireLeNom(CIBLE_CREATION, nom, () =>
        creerCategorie(ressource, nom),
      );
    case 'renommage':
      return ecrireLeNom(id, nom, () =>
        renommerCategorie(ressource, Number(id), nom),
      );
    default:
      return executerSuppression(ressource, id);
  }
}
