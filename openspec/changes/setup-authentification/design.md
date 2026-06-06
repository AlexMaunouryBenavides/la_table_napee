## Context

Le design fonctionnel (`design/use-cases-recettes.md`) définit 4 rôles hérités sous
le principe de moindre privilège, une contrainte forte de propriété sur les avis
(UC-07/08) distincte de la modération par rôle (UC-14), et un hachage Argon2 des
mots de passe. Ce document fige l'architecture technique de l'authentification et de
l'autorisation, issue d'une exploration où chaque alternative a été pesée.

Le développeur est junior et veut un code de **niveau professionnel** ; les choix
privilégient donc les patterns standards et formateurs, tout en respectant
« pas d'optimisation prématurée » (priorité n°3 du projet).

## Goals / Non-Goals

**Goals :**

- Porter identité + rôle de façon **vérifiable** et **révocable**.
- Protéger le jeton contre le vol par XSS (cookie httpOnly) tout en neutralisant le
  CSRF que ce choix introduit.
- Détecter activement le vol d'un refresh token (rotation + familles).
- Séparer nettement autorisation **par rôle** (guard) et **par propriété** (service),
  pour prévenir l'IDOR.
- Aucun secret en dur ; toute la config sensible en variables d'environnement
  validées au démarrage.

**Non-Goals :**

- Cache Redis (exploration future) — le stockage des refresh reste en MySQL, mais
  derrière un repository pour un swap futur indolore.
- Token anti-CSRF double-submit (différé ; `SameSite=Lax` suffit pour démarrer).
- OAuth / connexion via tiers (Google, etc.).
- Écriture des entités métier (faite par le développeur, SQL Looping = doc).

## Decisions

### D1 — JWT en cookie httpOnly plutôt qu'en localStorage

**Choix :** le jeton vit dans un cookie `httpOnly` + `Secure` + `SameSite=Lax`,
extrait du cookie côté serveur (extracteur passport custom).

**Pourquoi :** localStorage est lisible par tout JavaScript → un XSS vole le jeton
directement (attaque répandue, difficile à neutraliser). Le cookie httpOnly est
invisible au JS → l'XSS ne peut pas le lire. On échange une faille difficile (XSS
sur le jeton) contre une faille à parade connue (CSRF, voir D3).

**Alternative écartée :** _localStorage + Authorization header_ — immunisé au CSRF
mais expose le jeton à l'XSS ; jugé moins sûr.

### D2 — Access token court + refresh token long

**Choix :** access ~15 min + refresh long (jours), tous deux en cookie httpOnly.

**Pourquoi :** un JWT est sans état → non révocable nativement. Un changement de
rôle (ex. rétrograder un admin) resterait actif jusqu'à l'expiration. L'access court
borne la fenêtre de dégâts ; au `/refresh`, on relit le rôle/le compte en base.

**Alternative écartée :** _JWT unique_ (1h–24h) — beaucoup plus simple mais
révocation faible, inadapté à des rôles admin/modérateur.

### D3 — Défense CSRF : SameSite d'abord, double-submit différé

**Choix :** `SameSite=Lax` sur les cookies comme première couche ; token
double-submit ajouté plus tard si durcissement voulu. Flags `Secure` + `HttpOnly`
systématiques.

**Pourquoi :** le cookie est envoyé automatiquement par le navigateur → vecteur du
CSRF. `SameSite=Lax` empêche l'envoi sur une requête déclenchée par un autre site,
ce qui tue l'essentiel du CSRF sans casser l'arrivée depuis un lien externe
(`Strict` casserait ce cas).

**Contrainte de déploiement :** `SameSite` n'opère que si front et API partagent le
même domaine enregistrable (ex. `app.recettes.fr` + `api.recettes.fr` = same site).
À répercuter sur la configuration Traefik/VPS.

**Alternative écartée :** _`SameSite=Strict`_ — plus sûr mais casse « cliquer un
lien et arriver connecté ».

### D4 — Refresh tokens en MySQL, derrière un repository

**Choix :** table `REFRESH_TOKEN` (token **hashé**, `user_id`, `family_id`, état
`ACTIF`/`UTILISÉ`/`RÉVOQUÉ`, `expires_at`), accédée via un repository (interface de
stockage).

**Pourquoi :** réutilise le MySQL existant (zéro nouvelle infra), donne la rotation
fine, la détection de vol et la gestion d'appareils, et reste le pattern le plus
**transférable**. Le repository découple le besoin présent (MySQL) d'un éventuel
besoin futur (Redis pour le cache) → migration contenue.

**Alternatives écartées :** _Redis maintenant_ (couplerait auth et cache, ajoute une
infra avant qu'elle serve, persistance à gérer) ; _colonne `tokenVersion`_ (révocation
en gros, sans rotation ni détection de vol).

### D5 — Rotation + détection de réutilisation (familles)

**Choix :** chaque `/refresh` marque le jeton présenté `UTILISÉ` et en émet un
nouveau (même `family_id`). Un jeton `UTILISÉ` (ou révoqué) présenté à nouveau =
preuve de copie → révocation de toute la famille → reconnexion forcée.

**Pourquoi :** un refresh « à usage unique » qui resurgit signale qu'au moins deux
parties le détiennent (vol). La détection est gratuite car la ligne `UTILISÉ` reste
en base.

### D6 — Autorisation : par rôle (guard) vs par propriété (service)

**Choix :** `JwtAuthGuard` (authentifié ?) + `RolesGuard` (`@Roles()` + Reflector)
pour le rôle ; contrôle de propriété dans le service en comparant `user.id` à
l'auteur de la ressource.

**Pourquoi :** « supprimer un avis » a deux logiques distinctes (UC-08 propriété vs
UC-14 rôle). Un rôle ne dit pas « c'est à moi » : la propriété se vérifie avec la
donnée, dans le service. C'est la protection contre l'IDOR (référence directe non
sécurisée à un objet).

### D7 — Secrets et durées de vie en variables d'environnement

**Choix :** secret de signature JWT, durées access/refresh, options cookie lues
depuis l'environnement et **validées au démarrage** (l'app refuse de démarrer si une
variable manque).

**Pourquoi :** priorité sécurité n°2 du projet (aucun secret en dur). La validation
au boot transforme la règle en garantie, pas en discipline.

## Risks / Trade-offs

- **CSRF (introduit par le cookie)** → `SameSite=Lax` + flags `Secure`/`HttpOnly` ;
  double-submit en réserve.
- **Refresh token volé** → rotation + détection de réutilisation (révocation de
  famille).
- **Fuite de la base** → tokens **hashés**, inutilisables tels quels (comme les mots
  de passe).
- **Déconnexion sur changement de rôle pas instantanée** → access court (~15 min) +
  relecture du rôle au refresh ; révocation de famille possible pour un effet
  immédiat.
- **Couplage déploiement** → front et API doivent partager le domaine enregistrable
  (contrainte Traefik) pour que `SameSite` fonctionne.
- **Complexité de la rotation** → assumée : c'est le code le plus formateur, isolé
  dans le service/repository auth.

## Migration Plan

1. Écrire/confirmer l'entité `UTILISATEUR` ; ajouter l'entité `REFRESH_TOKEN`
   (additive) + migration.
2. Hachage Argon2 + inscription/connexion/déconnexion.
3. Émission access + refresh, configuration des cookies (httpOnly/Secure/SameSite).
4. Endpoint `/refresh` avec rotation + détection de vol.
5. Guards (`JwtAuthGuard`, `RolesGuard`) + décorateur `@Roles()` + contrôle de
   propriété.
6. Câblage côté client (login/register, refresh transparent sur 401).

**Rollback :** modules `auth`/`users` isolés ; retrait = supprimer ces modules,
l'entité `REFRESH_TOKEN` et sa migration.

## Open Questions

- Durées exactes : access (15 min ?) et refresh (7 j ? 30 j ?) à fixer.
- Faut-il borner le **nombre de sessions actives** par utilisateur (anti-abus) ?
- Anti-auto-rétrogradation (UC-16) : géré dans l'autorisation admin ou en règle
  métier dédiée ?
- Migration future des refresh vers **Redis** : à décider quand le cache arrivera.
