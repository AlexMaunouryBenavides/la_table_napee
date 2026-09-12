type CleRessource =
  | 'regimes'
  | 'criteres-sante'
  | 'types-aliment'
  | 'nationalites';

export type Ressource = {
  /** Le segment d'URL, ici comme dans l'API : les deux sont volontairement les mêmes. */
  cle: CleRessource;
  libelle: string;
  /** « un régime » — pour « Ajouter un régime ». */
  unSingulier: string;
  /** « le régime » — pour « Supprimer le régime ». */
  leSingulier: string;
  /** « Aucun régime » — le genre et le pluriel du français ne se dérivent pas d'un
   *  `replace()` : « Critères santé » ne donne pas « critère santé » tout seul. */
  aucun: string;
  /** Le nom du critère correspondant dans le catalogue, pour renvoyer vers les
   *  recettes qui retiennent une valeur qu'on essaie de supprimer. */
  filtreCatalogue: string;
};

/**
 * Les quatre ressources partagent EXACTEMENT le même contrat. Une table plutôt que
 * quatre branches : le jour où une cinquième arrive, il y a une ligne à écrire.
 */
export const RESSOURCES: Ressource[] = [
  {
    cle: 'regimes',
    libelle: 'Régimes',
    unSingulier: 'un régime',
    leSingulier: 'le régime',
    aucun: 'Aucun régime',
    filtreCatalogue: 'regime',
  },
  {
    cle: 'criteres-sante',
    libelle: 'Critères santé',
    unSingulier: 'un critère santé',
    leSingulier: 'le critère santé',
    aucun: 'Aucun critère santé',
    filtreCatalogue: 'critereSante',
  },
  {
    cle: 'types-aliment',
    libelle: 'Types d’aliment',
    unSingulier: 'un type d’aliment',
    leSingulier: 'le type d’aliment',
    aucun: 'Aucun type d’aliment',
    filtreCatalogue: 'typeAliment',
  },
  {
    cle: 'nationalites',
    libelle: 'Nationalités',
    unSingulier: 'une nationalité',
    leSingulier: 'la nationalité',
    aucun: 'Aucune nationalité',
    filtreCatalogue: 'nationalite',
  },
];

/** `null` pour un segment inconnu : sans ce refus, une URL trafiquée afficherait un
 *  tableau vide qui se lirait « aucune valeur ». */
export function ressourceDepuis(segment: string): Ressource | null {
  return RESSOURCES.find((ressource) => ressource.cle === segment) ?? null;
}
