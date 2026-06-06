## Why

Le site de recettes distingue quatre rôles (visiteur, utilisateur, modérateur,
administrateur) avec des droits hérités et le principe de **moindre privilège**.
Avant toute fonctionnalité protégée (avis, modération, administration), il faut une
authentification robuste qui porte l'identité ET le rôle, et qui résiste aux
attaques courantes. Ce change pose cette fondation : JWT + rôles + guards NestJS,
jetons portés par des cookies httpOnly, avec une stratégie de révocation réelle.

## What Changes

- **Inscription / connexion / déconnexion** : mot de passe haché en **Argon2**
  (le sel est inclus dans le hash).
- **Jetons access + refresh** : access court (~15 min) + refresh long, tous deux
  en **cookie httpOnly + Secure + SameSite=Lax**. Le JWT est extrait du cookie
  (pas du `Authorization` header), jamais du localStorage.
- **Rotation + détection de vol** : table `REFRESH_TOKEN` en MySQL (tokens hashés,
  regroupés en "familles"). Chaque refresh tourne le jeton ; un jeton déjà utilisé
  qui resurgit déclenche la révocation de toute la famille.
- **Garde-fous d'autorisation** : `JwtAuthGuard` (authentifié ?) + `RolesGuard`
  (`@Roles()` + Reflector) pour l'autorisation **par rôle** ; contrôle de
  **propriété** dans le service (comparer `user.id`) pour les ressources possédées
  (anti-IDOR), conformément aux UC-07/08/14 du design.
- **Défense CSRF** : `SameSite=Lax` comme première couche ; token anti-CSRF
  double-submit **différé** (défense en profondeur à ajouter au besoin).
- **Nouvelle entité** `REFRESH_TOKEN` (additive, absente du Merise initial).
- **Abstraction de stockage** : les refresh passent par un *repository* pour
  permettre une migration future vers Redis sans refonte.
- **Guide d'apprentissage** `docs/guides/authentification.md` créé en premier (à lire
  avant), et code écrit à la manière de Nest (@nestjs/passport, guards, modules, DI).

## Capabilities

### New Capabilities

- `authentication` : inscription, connexion, déconnexion, cycle de vie des jetons
  (access + refresh), rotation et détection de vol, configuration des cookies.
- `authorization` : guards d'authentification et de rôle, contrôle de propriété au
  niveau de l'objet (anti-IDOR), application du moindre privilège.

### Modified Capabilities

<!-- Aucune : openspec/specs/ est vide. La capacité tooling (setup-outillage-qualite)
     n'est pas modifiée par ce change. -->

## Impact

- **`api/`** : module `auth` (controller, service, strategies passport-jwt,
  guards `JwtAuthGuard`/`RolesGuard`, décorateur `@Roles()`), module `users`,
  entité `REFRESH_TOKEN`, repository de refresh, hachage Argon2, configuration des
  cookies, validation des entrées par DTO + class-validator.
- **`client/`** : flux de connexion/inscription (react-hook-form), appel `/refresh`
  transparent sur 401 (react-query), pas de stockage de token côté JS.
- **`packages/types/`** : types partagés du contrat d'auth (payload utilisateur,
  rôles).
- **Configuration** : secrets de signature JWT et durées de vie en **variables
  d'environnement** (jamais en dur), validés au démarrage.
- **Dépendances** : ce change suppose l'outillage qualité en place et les entités
  `UTILISATEUR` écrites. Il n'inclut PAS le cache Redis (exploration future).
