// packages/types/src/index.ts
//
// SOURCE UNIQUE DE VÉRITÉ du modèle de données.
// Le front (React) ET le back (NestJS) importent ces types.
// Une modification ici se propage partout → principe DRY.

// ===================================================================
//  ZONE 1 — Types unions figés (valeurs fermées, connues d'avance)
//  Pas d'identifiant : ce sont des VALEURS, pas des entités en base.
// ===================================================================

// Chaque énumération est une LISTE constante dont on dérive le type. La liste sert au
// runtime (validation `@IsIn`), le type sert à la compilation : une seule déclaration
// pour les deux, donc aucun risque qu'elles divergent.

export const DIFFICULTES = ['facile', 'moyen', 'difficile'] as const;
export type Difficulte = (typeof DIFFICULTES)[number];

export const TYPES_RECETTE = [
  'entree',
  'plat',
  'dessert',
  'glace',
  'boisson',
  'sauce',
] as const;
export type TypeRecette = (typeof TYPES_RECETTE)[number];

// Le rôle vit aussi en liste figée : tu ne laisses pas tes admins
// inventer de nouveaux rôles depuis le panel (ce serait risqué).
export const ROLES_UTILISATEUR = [
  'admin',
  'moderateur',
  'utilisateur',
] as const;
export type RoleUtilisateur = (typeof ROLES_UTILISATEUR)[number];

// Contenu signé de l'access token : le strict nécessaire pour autoriser une requête
// sans toucher la base. `sub` (subject) est le champ standard JWT pour l'identifiant.
export interface ChargeUtileJeton {
  sub: string;
  role: RoleUtilisateur;
}

// Unités de mesure d'un ingrédient dans une recette. Figées parce qu'une future
// agrégation (liste de courses) est impossible si l'unité est du texte libre.
export const UNITES = [
  'g',
  'kg',
  'ml',
  'cl',
  'l',
  'piece',
  'cuillere_a_soupe',
  'cuillere_a_cafe',
  'pincee',
] as const;
export type Unite = (typeof UNITES)[number];

// ===================================================================
//  ZONE 1 bis — Formes de RÉPONSE de l'API (ce que le front reçoit)
// ===================================================================

// Enveloppe de toute réponse de liste : on ne renvoie jamais un tableau nu,
// sinon le front n'a aucun moyen de savoir combien de pages restent.
export interface Page<T> {
  donnees: T[];
  total: number;
  page: number;
  limite: number;
}

// Version allégée d'une recette, pour les listes : juste de quoi afficher une carte.
// Charger les avis, étapes et ingrédients de 20 recettes serait du gaspillage.
export interface RecetteResume {
  id: number;
  titre: string;
  image: string;
  difficulte: Difficulte;
  typeRecette: TypeRecette;
  tempsPreparation: number;
  tempsCuisson: number;
  portions: number;
  nationalite: string;
  // `null` quand la recette n'a aucun avis — surtout pas 0, qui se lirait
  // « très mal notée ».
  noteMoyenne: number | null;
}

// ===================================================================
//  ZONE 2 — Entités, telles que l'API les RENVOIE
//
//  Ces formes décrivent le JSON réellement reçu par le front, pas un modèle
//  théorique : les dates sont des chaînes ISO (le JSON n'a pas de type date), les
//  décimaux des chaînes (c'est ainsi que le pilote MySQL les rend), et les relations
//  facultatives valent `null`, jamais `undefined`.
// ===================================================================

/** Identifiant de compte : un UUID, pas un entier — un entier séquentiel se devine
 *  et permettrait d'énumérer les comptes. */
export interface Utilisateur {
  id: string;
  pseudo: string | null;
  email: string;
  role: RoleUtilisateur;
  dateCreation: string;
}

/** Un ingrédient est un référentiel PARTAGÉ entre recettes : il porte son propre id
 *  et ne connaît ni quantité ni unité — celles-ci appartiennent au lien. */
export interface Ingredient {
  id: number;
  nom: string;
}

/** Les quatre catégories ont exactement la même forme. */
export interface Categorie {
  id: number;
  nom: string;
}

export type Regime = Categorie; // ex : végan, sans gluten
export type CritereSante = Categorie; // ex : faible en sel, diabète
export type TypeAliment = Categorie; // ex : viande rouge, poisson
export type Nationalite = Categorie; // ex : française, italienne, thaïe

/** Le lien recette—ingrédient, ENRICHI : il porte la quantité et l'unité, donc c'est
 *  une entité et non une simple jointure. */
export interface Composition {
  id: number;
  // Chaîne et non nombre : le pilote MySQL rend les décimaux ainsi, et `null` ne veut
  // pas dire zéro mais « à volonté » (sel, poivre).
  quantite: string | null;
  unite: Unite;
  ingredient: Ingredient;
}

/** Une étape de préparation. `numero` vient de la POSITION dans la liste : il n'est
 *  jamais saisi, et supprimer une étape renumérote les suivantes. */
export interface Etape {
  id: number;
  numero: number;
  contenu: string;
}

/** `utilisateur` est `null` quand le compte a été supprimé : l'avis reste publié mais
 *  devient anonyme. */
export interface Avis {
  id: number;
  note: number;
  commentaire: string | null;
  dateCreation: string;
  utilisateur: Utilisateur | null;
}

// ===================================================================
//  ZONE 3 — La recette détaillée, ce que rend GET /recettes/:id
// ===================================================================

export interface Recette {
  id: number;
  titre: string;
  description: string;
  image: string;
  video: string | null;

  difficulte: Difficulte;
  typeRecette: TypeRecette;
  nationalite: Nationalite;

  tempsPreparation: number; // minutes
  tempsCuisson: number; // minutes
  portions: number;

  compositions: Composition[];
  // Déjà triées par `numero` croissant par l'API.
  etapes: Etape[];
  avis: Avis[];

  regimes: Regime[];
  criteresSante: CritereSante[];
  typesAliment: TypeAliment[];

  // `null` si le compte auteur a été supprimé : la recette lui survit.
  auteur: Utilisateur | null;
  dateCreation: string;

  // Calculée à partir des avis, jamais stockée. `null` = aucun avis, surtout pas 0.
  noteMoyenne: number | null;
}

// ===================================================================
//  ZONE 4 — Règles partagées entre le front et le back
// ===================================================================

// L'héritage des rôles : admin ⊃ modérateur ⊃ utilisateur. Une seule définition, car
// l'API l'applique (guards, règles métier) et le client s'en sert pour construire une
// interface qui ne promet rien qu'elle ne puisse tenir.
const NIVEAUX_DE_ROLE: Record<RoleUtilisateur, number> = {
  utilisateur: 1,
  moderateur: 2,
  admin: 3,
};

export function aAuMoins(
  role: RoleUtilisateur,
  exige: RoleUtilisateur,
): boolean {
  return NIVEAUX_DE_ROLE[role] >= NIVEAUX_DE_ROLE[exige];
}
