## ADDED Requirements

### Requirement: Inscription avec mot de passe haché

Le système SHALL permettre la création d'un compte et SHALL stocker le mot de passe
haché avec Argon2 (sel inclus dans le hash), jamais en clair. Les entrées SHALL être
validées par DTO + class-validator avant tout usage.

#### Scenario: Inscription réussie

- **WHEN** un visiteur soumet un email valide et un mot de passe conforme
- **THEN** un compte est créé avec le mot de passe haché en Argon2 et aucune valeur en clair n'est persistée

#### Scenario: Entrée invalide rejetée

- **WHEN** une donnée d'inscription ne respecte pas le DTO (email mal formé, mot de passe trop court)
- **THEN** la requête est rejetée avant tout traitement métier

### Requirement: Connexion émettant des jetons en cookie httpOnly

À la connexion, le système SHALL vérifier le mot de passe puis émettre un access
token court et un refresh token long, tous deux déposés dans des cookies
`httpOnly` + `Secure` + `SameSite=Lax`. Aucun jeton ne SHALL être exposé au
JavaScript du client.

#### Scenario: Connexion réussie

- **WHEN** un utilisateur fournit des identifiants valides
- **THEN** le système dépose un access token et un refresh token en cookies httpOnly/Secure/SameSite=Lax

#### Scenario: Identifiants invalides

- **WHEN** le mot de passe ne correspond pas
- **THEN** la connexion échoue sans révéler si l'email existe

### Requirement: Renouvellement de l'access via refresh avec rotation

Le système SHALL exposer un point de renouvellement qui, sur présentation d'un
refresh token actif et non expiré, relit l'état du compte (existence, rôle actuel),
émet un nouvel access token, marque le refresh présenté comme `UTILISÉ` et émet un
nouveau refresh token de la même famille (rotation).

#### Scenario: Refresh nominal

- **WHEN** le client présente un refresh token `ACTIF` et non expiré
- **THEN** le système émet un nouvel access token et un nouveau refresh token, et marque l'ancien `UTILISÉ`

#### Scenario: Rôle relu au refresh

- **WHEN** le rôle de l'utilisateur a changé en base depuis l'émission du jeton
- **THEN** le nouvel access token porte le rôle actuel lu en base

### Requirement: Détection de réutilisation d'un refresh token

Le système SHALL stocker les refresh tokens hashés et regroupés en familles, et SHALL
révoquer toute la famille si un refresh token déjà `UTILISÉ` ou `RÉVOQUÉ` est présenté
de nouveau.

#### Scenario: Vol détecté

- **WHEN** un refresh token déjà marqué `UTILISÉ` est présenté une seconde fois
- **THEN** le système révoque toute la famille et exige une reconnexion

#### Scenario: Stockage hashé

- **WHEN** un refresh token est persisté
- **THEN** seule sa forme hashée est stockée, jamais la valeur en clair

### Requirement: Déconnexion révoquant le refresh

À la déconnexion, le système SHALL révoquer le refresh token courant (au minimum sa
famille) et SHALL effacer les cookies d'authentification.

#### Scenario: Déconnexion

- **WHEN** un utilisateur connecté se déconnecte
- **THEN** le refresh courant est révoqué et les cookies d'authentification sont supprimés

### Requirement: Secrets et durées en variables d'environnement

Le système SHALL lire le secret de signature JWT, les durées de vie des jetons et les
options de cookie depuis l'environnement, et SHALL refuser de démarrer si une variable
requise est absente. Aucun secret ne SHALL être codé en dur.

#### Scenario: Variable manquante au démarrage

- **WHEN** une variable d'environnement d'authentification requise est absente
- **THEN** l'application refuse de démarrer avec une erreur explicite
