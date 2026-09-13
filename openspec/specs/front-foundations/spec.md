# front-foundations Specification

## Purpose

TBD - created by archiving change setup-front. Update Purpose after archive.

## Requirements

### Requirement: Tokens visuels, et rien que des tokens

Les couleurs, tailles de texte, espacements, rayons et ombres du handoff SHALL être
déclarés une fois dans `@theme` (Tailwind v4). Le code des écrans NE DOIT PAS utiliser
de valeur arbitraire (`p-[13px]`, `text-[#333]`, couleur en dur dans un style inline).

#### Scenario: Un composant a besoin de la couleur d'accent

- **WHEN** un bouton primaire doit utiliser `ardoise`
- **THEN** il utilise la classe issue du token, pas `#2f4f4f`

#### Scenario: Recherche de valeurs arbitraires

- **WHEN** on cherche le motif `-[` dans les classes de `client/app`
- **THEN** aucune occurrence de valeur arbitraire n'existe

#### Scenario: Changement d'une couleur de marque

- **WHEN** `ardoise` change de valeur
- **THEN** une seule déclaration est modifiée et tout le site suit

### Requirement: Composants partagés écrits une seule fois

Un élément d'interface utilisé par au moins deux écrans SHALL exister comme composant
partagé unique. Les écrans NE DOIVENT PAS redéfinir localement un bouton, un champ, une
pagination ou une modale de confirmation.

#### Scenario: Pagination

- **WHEN** le catalogue, le panneau des recettes et le panneau des utilisateurs
  paginent
- **THEN** ils utilisent le même composant `Pagination`, qui lit l'enveloppe
  `{ donnees, total, page, limite }` et écrit `?page=` dans l'URL

#### Scenario: Suppression

- **WHEN** un écran propose une suppression
- **THEN** elle passe par `ModaleConfirmation`, dont le bouton nomme l'action
  (« Supprimer la recette »), jamais « OK »

#### Scenario: Erreur de formulaire

- **WHEN** une soumission échoue
- **THEN** un `Bandeau` reçoit le focus et affiche `message` plus, s'il existe, chaque
  entrée de `details[]`

### Requirement: Note absente n'est pas une note nulle

Quand `noteMoyenne` vaut `null`, l'interface SHALL afficher « Pas encore notée ». Elle
NE DOIT PAS afficher cinq étoiles vides, ni `0`, ni une chaîne vide.

#### Scenario: Recette sans avis

- **WHEN** une carte de recette reçoit `noteMoyenne: null`
- **THEN** elle affiche « Pas encore notée » en lieu et place des étoiles

#### Scenario: Recette notée

- **WHEN** `noteMoyenne` vaut `3.4` avec 27 avis
- **THEN** les étoiles portent `role="img"` et un `aria-label` qui écrit la note et le
  nombre d'avis

### Requirement: Trois coquilles, une par famille d'écrans

Les écrans SHALL se ranger sous trois coquilles : publique (`EnTeteSite`),
authentification (`CoquilleAuth`) et back-office (`CoquilleBackOffice`). Un écran NE
DOIT PAS recomposer sa propre navigation.

#### Scenario: Écran public

- **WHEN** un visiteur ouvre l'accueil, le catalogue ou le détail d'une recette
- **THEN** l'en-tête de site affiche soit l'avatar, soit les boutons Connexion /
  Inscription, selon la session

#### Scenario: Accès refusé

- **WHEN** un modérateur ouvre une URL réservée à l'administrateur
- **THEN** le `403` s'affiche **dans la coquille du back-office**, à l'URL demandée,
  sans redirection

### Requirement: Écrans système par ErrorBoundary de segment

Les impasses 404, 403 et erreur inattendue SHALL être rendues par des `ErrorBoundary`
de segment s'appuyant sur `isRouteErrorResponse`. Une erreur dans un segment NE DOIT
PAS blanchir toute l'application.

#### Scenario: Recette inconnue

- **WHEN** l'API répond `404` sur `GET /recettes/:id`
- **THEN** l'écran 404 s'affiche dans la coquille courante, la navigation reste
  utilisable

#### Scenario: Erreur inattendue

- **WHEN** une erreur `5xx` survient
- **THEN** l'écran montre une référence d'incident copiable
- **AND** il n'affiche ni pile d'appels, ni requête, ni jeton

#### Scenario: Code chiffré décoratif

- **WHEN** l'écran affiche « 404 » en grand
- **THEN** ce chiffre est `aria-hidden` et l'information vit dans le `h1`

### Requirement: Ossature de routes pour les 14 écrans

`app/routes.ts` SHALL déclarer l'arborescence des 14 écrans de `design/ecrans.md`, en
français, groupée par coquille. Le template par défaut de React Router (`app/welcome/`,
`routes/home.tsx`) SHALL être supprimé.

#### Scenario: Lecture de l'arborescence

- **WHEN** on ouvre `app/routes.ts`
- **THEN** on retrouve les écrans de `design/ecrans.md`, et aucune route qui ne
  corresponde à un écran conçu

#### Scenario: Template résiduel

- **WHEN** on cherche `welcome` dans `client/app`
- **THEN** il n'y a plus rien

### Requirement: Accessibilité de base non négociable

Tout contrôle interactif SHALL mesurer au moins 44 px de haut (32 px toléré en ligne de
tableau), porter un libellé visible, et rester utilisable au clavier. La couleur NE
DOIT JAMAIS être le seul porteur d'information.

#### Scenario: Rôle affiché

- **WHEN** une étiquette de rôle est affichée
- **THEN** le mot est écrit, pas seulement signalé par une couleur

#### Scenario: Modale ouverte

- **WHEN** une modale de confirmation s'ouvre
- **THEN** le focus est piégé, posé sur Annuler, `Échap` ferme, et le focus revient au
  déclencheur

#### Scenario: Mouvement réduit

- **WHEN** le système demande `prefers-reduced-motion`
- **THEN** les animations de squelette, de tiroir et de modale sont neutralisées
