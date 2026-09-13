## ADDED Requirements

### Requirement: Garde d'authentification

Le système SHALL fournir un guard qui n'autorise l'accès aux routes protégées que si
un access token valide est présent dans le cookie, et SHALL attacher l'identité de
l'utilisateur à la requête pour les couches suivantes.

#### Scenario: Accès sans jeton valide refusé

- **WHEN** une requête vers une route protégée n'a pas d'access token valide
- **THEN** le système répond 401 sans exécuter la logique métier

#### Scenario: Identité attachée

- **WHEN** un access token valide est présent
- **THEN** l'identité (id, rôle) est attachée à la requête pour les guards et services

### Requirement: Autorisation par rôle

Le système SHALL fournir un guard de rôle piloté par un décorateur `@Roles()` qui
n'autorise une route que si le rôle de l'utilisateur figure parmi les rôles requis,
en appliquant le principe de moindre privilège et l'héritage des rôles.

#### Scenario: Rôle suffisant

- **WHEN** un modérateur accède à une route exigeant le rôle modérateur (ex. supprimer un avis quelconque, UC-14)
- **THEN** l'accès est autorisé

#### Scenario: Rôle insuffisant

- **WHEN** un utilisateur simple accède à une route réservée à l'admin (ex. gérer les utilisateurs, UC-16)
- **THEN** le système répond 403

### Requirement: Contrôle de propriété au niveau de l'objet

Pour les ressources possédées (avis, compte), le système SHALL vérifier dans la
couche métier que la ressource appartient au demandeur en comparant son identifiant,
indépendamment de toute vérification de rôle, afin de prévenir l'IDOR.

#### Scenario: Modifier son propre avis

- **WHEN** un utilisateur modifie un avis dont il est l'auteur (UC-07)
- **THEN** l'opération est autorisée

#### Scenario: Modifier l'avis d'autrui refusé

- **WHEN** un utilisateur tente de modifier ou supprimer un avis qui ne lui appartient pas (sans rôle de modération)
- **THEN** le système refuse l'opération (403)

### Requirement: Protection des actions admin sensibles

Le système SHALL protéger la promotion/rétrogradation de rôle (UC-16) par le rôle
admin et SHALL empêcher un admin de se retirer le dernier privilège admin
(anti-auto-rétrogradation).

#### Scenario: Dernier admin protégé

- **WHEN** le dernier administrateur tente de se rétrograder ou de retirer le dernier rôle admin
- **THEN** le système refuse l'opération
