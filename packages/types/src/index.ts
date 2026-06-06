// packages/types/src/index.ts
//
// SOURCE UNIQUE DE VÉRITÉ du modèle de données.
// Le front (React) ET le back (NestJS) importent ces types.
// Une modification ici se propage partout → principe DRY.

// ===================================================================
//  ZONE 1 — Types unions figés (valeurs fermées, connues d'avance)
//  Pas d'identifiant : ce sont des VALEURS, pas des entités en base.
// ===================================================================

// Le type union : ce champ ne peut valoir QUE l'une de ces chaînes.
// TypeScript refusera "Facile" (majuscule) ou "trop dur" → sécurité.
export type Difficulte = "facile" | "moyen" | "difficile";

export type TypeRecette =
	| "entree"
	| "plat"
	| "dessert"
	| "glace"
	| "boisson"
	| "sauce";

// Le rôle vit aussi en union figée : tu ne laisses pas tes admins
// inventer de nouveaux rôles depuis le panel (ce serait risqué).
export type RoleUtilisateur = "admin" | "moderateur" | "utilisateur";

// ===================================================================
//  ZONE 2 — Entités stockées en base (elles ont toutes un `id`)
// ===================================================================

// Un ingrédient appartient à UNE recette (relation 1—N).
// Pas besoin d'id propre ici : un ingrédient n'existe que DANS sa recette
// et n'est jamais partagé ni référencé ailleurs.
export interface Ingredient {
	nom: string; // ex : "farine"
	quantite: number; // ex : 250
	unite: string; // ex : "g", "ml", "cuillère à soupe"
}

// Les trois catégories gérées par les admins en base.
// Elles partagent exactement la même forme (id + nom), donc on factorise
// avec une interface de base plutôt que de répéter trois fois la structure.
export interface Categorie {
	id: string;
	nom: string;
}
// Ces alias donnent un NOM MÉTIER clair à chaque catégorie, tout en
// réutilisant la même forme. Le code devient auto-documenté.
export type Regime = Categorie; // ex : végan, sans gluten
export type CritereSante = Categorie; // ex : faible en sel, diabète
export type TypeAliment = Categorie; // ex : viande rouge, poisson
export type Nationalite = Categorie; // ex : française, italienne, thaïe

// L'utilisateur. On NE met JAMAIS le mot de passe dans ce type partagé :
// le front ne doit jamais le voir. Il restera côté back uniquement.
export interface Utilisateur {
	id: string;
	pseudo: string;
	email: string;
	role: RoleUtilisateur;
}

// Un avis relie un utilisateur à une recette.
// Il porte son propre id car c'est une entité à part entière.
export interface Avis {
	id: string;
	auteur: Utilisateur; // qui a écrit l'avis
	note: number; // étoiles, de 1 à 5
	commentaire: string;
	date: string; // date ISO, ex : "2026-05-23"
}

// ===================================================================
//  ZONE 3 — La recette, qui rassemble tout
// ===================================================================

export interface Recette {
	id: string;
	titre: string;
	description: string;
	image: string; // URL de la photo du plat
	video?: string; // URL YouTube. Le `?` = FACULTATIF :
	// une recette peut exister sans vidéo.

	ingredients: Ingredient[]; // liste (1—N)
	etapes: string[]; // liste ordonnée d'instructions

	difficulte: Difficulte; // une seule valeur (union figée)
	typeRecette: TypeRecette; // une seule valeur (union figée)
	nationalite: Nationalite; // référence vers l'entité (relation N—1) :
	// plusieurs recettes peuvent être françaises,
	// mais chaque recette n'a QU'UNE nationalité

	tempsPreparation: number; // en minutes
	tempsCuisson: number; // en minutes
	portions: number;

	// Relations N—N : une recette cumule plusieurs catégories.
	// Côté code on manipule de simples listes ; l'ORM gérera en coulisses
	// les tables de jonction dont on a parlé.
	regimes: Regime[];
	criteresSante: CritereSante[];
	typesAliment: TypeAliment[];

	avis: Avis[]; // tous les avis sur cette recette

	// PAS de champ "note moyenne" stocké : on la CALCULE à partir des avis.
	// Stocker une moyenne qu'on peut recalculer = duplication = risque
	// d'incohérence. (cf. principe DRY)
	auteur: Utilisateur; // qui a publié la recette (un admin/modo)
	dateCreation: string;
}
