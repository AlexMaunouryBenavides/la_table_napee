# Contrat de l'API — inventaire des routes

> Document de référence, dérivé de `design/use-cases-recettes.md` en appliquant
> `docs/conventions/rest.md`. Chaque route ci-dessous répond à un cas d'usage précis :
> aucune route n'existe « au cas où ».
>
> **Ce document dit CE QU'IL FAUT construire.** La manière de le construire vit dans
> `docs/guides/ecrire-une-feature-api.md`.

---

## 1. La frontière de vocabulaire (français / anglais)

Le projet mélange deux langues, et c'est **volontaire** — mais la frontière doit être
nette, sinon la question se repose à chaque feature :

| Couche                              | Langue      | Exemple                        |
| ----------------------------------- | ----------- | ------------------------------ |
| Base de données (tables, colonnes)  | **anglais** | `recipe`, `review`, `users`    |
| Code applicatif (classes, méthodes) | français    | `Recette`, `trouverParId`      |
| URL et corps JSON de l'API          | français    | `/api/recettes`, `{ "titre" }` |

Raison : l'anglais est la norme SQL et le schéma est déjà écrit ainsi ; le français est
la règle du projet côté code (`docs/conventions/clean-code.md`, § 2) et le modèle partagé
`packages/types` l'applique déjà. La traduction se fait **à un seul endroit** : l'entité
TypeORM, qui mappe explicitement un nom de table anglais sur une classe française.

## 2. Les invariants (vrais pour toutes les routes)

- **Préfixe** : tout est sous `/api` (posé dans `main.ts`).
- **Authentification** : par **cookie httpOnly**, jamais par en-tête `Authorization` ni
  `localStorage`. Aucune route ne prend d'identifiant de session en paramètre.
- **Forme d'erreur unique** : `{ statusCode, message, timestamp, path }`, produite par le
  filtre global, plus un champ `details` (tableau) quand la validation d'entrée échoue :
  `{ "statusCode": 400, "message": "Requête invalide", "details": ["property bidon should not exist"] }`.
  Aucun détail interne (stack, SQL) ne sort jamais.
- **Listes paginées** : réponse enveloppée en `{ donnees, total, page, limite }`. On ne
  renvoie jamais une table entière. Par défaut `page=1`, `limite=20`, **maximum 100** —
  sans plafond, `?limite=999999` reviendrait à renvoyer toute la table.
- **Validation** : toute entrée passe par un DTO + `ValidationPipe` global
  (`whitelist` + `forbidNonWhitelisted`). Un champ non déclaré ⇒ `400`.
- **`429`** est possible sur **toutes** les routes (throttler global) : il n'est pas
  répété dans les tableaux.

---

## 3. Inventaire des routes

### 3.1 Authentification — `/api/auth`

| Verbe | URL                      | UC    | Rôle requis      | Succès | Erreurs  |
| ----- | ------------------------ | ----- | ---------------- | ------ | -------- |
| POST  | `/auth/inscription`      | UC-04 | anonyme          | 201    | 400, 409 |
| POST  | `/auth/connexion`        | UC-05 | anonyme          | 200    | 400, 401 |
| POST  | `/auth/deconnexion`      | UC-05 | connecté         | 204    | 401      |
| POST  | `/auth/rafraichissement` | —     | cookie _refresh_ | 200    | 401      |

- `409` à l'inscription = email ou pseudo déjà pris (contraintes `UNIQUE` sur `users`).
- `401` à la connexion, **jamais** `404` : ne pas révéler si un email existe en base.
  Le message doit être identique dans les deux cas (email inconnu / mot de passe faux).
- `/auth/rafraichissement` ne vient d'aucun UC : c'est le support technique de la
  rotation de jetons décidée dans `setup-authentification`.
- Ces routes reçoivent la **limite stricte** du throttler (anti-bruteforce), plus basse
  que la limite globale.

### 3.2 Recettes — `/api/recettes`

| Verbe  | URL             | UC          | Rôle requis | Succès | Erreurs                 |
| ------ | --------------- | ----------- | ----------- | ------ | ----------------------- |
| GET    | `/recettes`     | UC-01/UC-03 | anonyme     | 200    | 400                     |
| GET    | `/recettes/:id` | UC-02       | anonyme     | 200    | 404                     |
| POST   | `/recettes`     | UC-11       | modérateur  | 201    | 400, 401, 403, 409      |
| PATCH  | `/recettes/:id` | UC-12       | modérateur  | 200    | 400, 401, 403, 404, 409 |
| DELETE | `/recettes/:id` | UC-13       | modérateur  | 204    | 401, 403, 404           |

**Paramètres de `GET /recettes`** (UC-03, tous combinables, tous en query string) :

| Paramètre                               | Effet                                     |
| --------------------------------------- | ----------------------------------------- |
| `page`, `limite`                        | pagination (obligatoire par défaut)       |
| `tri`                                   | ex. `-dateCreation` (`-` = décroissant)   |
| `recherche`                             | sur le titre                              |
| `difficulte`, `type`                    | énums figées                              |
| `nationalite`                           | identifiant de nationalité                |
| `regime`, `critereSante`, `typeAliment` | répétables (« végan ET sans gluten »)     |
| `ingredient`                            | passe par `composition`, pas par du texte |
| `tempsMax`                              | préparation + cuisson                     |

`400` si un filtre est inconnu ou mal typé — c'est le `ValidationPipe` sur un DTO de
query, pas un `if` dans le controller.

`PATCH` et non `PUT` : on modifie une recette par petits bouts (corriger un temps de
cuisson), jamais en la remplaçant entièrement. `409` = titre déjà pris (`UNIQUE(title)`).

### 3.3 Avis — `/api/recettes/:id/avis` et `/api/avis`

| Verbe  | URL                  | UC          | Rôle requis                    | Succès | Erreurs            |
| ------ | -------------------- | ----------- | ------------------------------ | ------ | ------------------ |
| GET    | `/recettes/:id/avis` | UC-02       | anonyme                        | 200    | 404                |
| POST   | `/recettes/:id/avis` | UC-06       | connecté                       | 201    | 400, 401, 404, 409 |
| PATCH  | `/avis/:id`          | UC-07       | **propriétaire**               | 200    | 400, 401, 403, 404 |
| DELETE | `/avis/:id`          | UC-08/UC-14 | **propriétaire OU modérateur** | 204    | 401, 403, 404      |

Pourquoi la création est imbriquée (`/recettes/:id/avis`) et la modification ne l'est
pas (`/avis/:id`) : à la création, la recette est le **contexte nécessaire** — sans elle
l'avis n'a pas de cible. Une fois créé, l'avis a son propre identifiant et se désigne
directement. Imbriquer donnerait `/recettes/7/avis/42`, soit trois niveaux et un `7`
redondant que personne ne vérifierait. `rest.md` § 1 fixe la limite à ~2 niveaux.

### 3.4 Son propre compte — `/api/utilisateurs/moi`

| Verbe  | URL                              | UC     | Rôle requis | Succès | Erreurs       |
| ------ | -------------------------------- | ------ | ----------- | ------ | ------------- |
| GET    | `/utilisateurs/moi`              | UC-09  | connecté    | 200    | 401           |
| PATCH  | `/utilisateurs/moi`              | UC-09  | connecté    | 200    | 400, 401, 409 |
| PATCH  | `/utilisateurs/moi/mot-de-passe` | UC-09  | connecté    | 204    | 400, 401      |
| DELETE | `/utilisateurs/moi`              | UC-09b | connecté    | 204    | 401           |

**`/moi` plutôt que `/utilisateurs/:id`** : c'est une décision de sécurité, pas de style.
Sans identifiant dans l'URL, il n'y a **rien à falsifier** — toute une classe de failles
(référence directe non sécurisée à un objet) disparaît par construction plutôt que par
vérification. L'identité vient du cookie, qui est signé.

Le changement de mot de passe est une route **séparée** parce que c'est une opération
différente : elle exige l'ancien mot de passe et invalide les sessions en cours.
`400` si l'ancien mot de passe est faux — pas `401`, on est bien authentifié.

### 3.5 Administration des utilisateurs — `/api/utilisateurs`

| Verbe  | URL                      | UC    | Rôle requis | Succès | Erreurs                 |
| ------ | ------------------------ | ----- | ----------- | ------ | ----------------------- |
| GET    | `/utilisateurs`          | UC-16 | **admin**   | 200    | 401, 403                |
| PATCH  | `/utilisateurs/:id/role` | UC-16 | **admin**   | 200    | 400, 401, 403, 404, 409 |
| DELETE | `/utilisateurs/:id`      | UC-16 | **admin**   | 204    | 401, 403, 404, 409      |

Le rôle est une **sous-ressource dédiée**, pas un champ de `PATCH /utilisateurs/:id`.
Raison : c'est l'opération la plus dangereuse de l'API (elle distribue le pouvoir) ; lui
donner sa propre URL permet de la garder, de la journaliser et de la tester isolément.
Voir la règle anti-auto-rétrogradation en § 4.

### 3.6 Catégories — un patron répété 4 fois

Quatre ressources partagent **exactement** le même contrat :
`/api/regimes`, `/api/criteres-sante`, `/api/types-aliment`, `/api/nationalites`.

| Verbe  | URL                | UC    | Rôle requis | Succès | Erreurs                 |
| ------ | ------------------ | ----- | ----------- | ------ | ----------------------- |
| GET    | `/<ressource>`     | UC-03 | anonyme     | 200    | —                       |
| POST   | `/<ressource>`     | UC-15 | **admin**   | 201    | 400, 401, 403, 409      |
| PATCH  | `/<ressource>/:id` | UC-15 | **admin**   | 200    | 400, 401, 403, 404, 409 |
| DELETE | `/<ressource>/:id` | UC-15 | **admin**   | 204    | 401, 403, 404, 409      |

- **La lecture est ouverte à tous** : le visiteur anonyme en a besoin pour construire les
  filtres d'UC-03. Seule l'écriture est réservée à l'admin.
- `409` à la suppression : la catégorie est utilisée par au moins une recette. Les
  entités partagées sont protégées par `ON DELETE RESTRICT` — la base refuse, l'API doit
  traduire ce refus en conflit, pas en erreur 500.
- Ces quatre ressources se ressemblent, mais **elles ne partagent pas de code générique
  d'emblée**. Écris-les explicitement ; factorise seulement si tu constates que la
  troisième est identique à la lettre (`clean-code.md` § 3 : pas d'abstraction avant deux
  ou trois cas réels).

### 3.7 Ingrédients — `/api/ingredients`

| Verbe | URL            | UC            | Rôle requis | Succès | Erreurs  |
| ----- | -------------- | ------------- | ----------- | ------ | -------- |
| GET   | `/ingredients` | support UC-11 | modérateur  | 200    | 401, 403 |

Une seule route, en lecture, avec un paramètre `recherche` : elle sert l'autocomplétion
du formulaire de recette. **Il n'y a volontairement pas de `POST /ingredients`** : la
création d'ingrédient passe par la logique « trouver ou créer » au moment d'enregistrer
une recette (UC-11). Exposer une création directe ouvrirait la porte aux doublons de
saisie (« Tomate » / « tomates ») que la contrainte `UNIQUE(name)` cherche à éviter.

---

## 4. Les règles qui se cachent derrière les routes

Un tableau de routes perd toujours l'essentiel. Voici ce qu'il ne montre pas.

### 4.1 `DELETE /api/avis/:id` porte DEUX autorisations différentes

Même URL, même verbe, deux raisons d'avoir le droit :

- **UC-08** — c'est **mon** avis : autorisation par **propriété** (comparer `user.id` à
  l'auteur de l'avis, dans le **service**, une fois l'avis chargé) ;
- **UC-14** — je suis **modérateur** : autorisation par **rôle** (dans un **guard**,
  avant même d'atteindre le service).

C'est le piège classique. Un guard ne peut pas décider seul, parce qu'il ne connaît pas
encore le propriétaire de l'avis n°42 — il faudrait aller en base, ce qui n'est pas son
rôle. Donc : le guard laisse passer tout utilisateur connecté, et **le service tranche**
en connaissant à la fois le demandeur et l'objet. Un utilisateur qui n'est ni l'auteur ni
modérateur reçoit `403`.

### 4.2 `400`, `409` ou `422` — choisir juste

- **`400`** : la requête est mal formée. Une note à `7`, un champ inconnu, un identifiant
  non numérique. Détectable **sans regarder la base**.
- **`409`** : la requête est valide, mais elle entre en conflit avec l'état actuel. Un
  deuxième avis sur la même recette, un titre déjà pris, une catégorie encore utilisée.
  Détectable **seulement en consultant la base**.
- **`422`** : une règle métier refuse, sans conflit d'état. À n'utiliser que si `400` et
  `409` ne conviennent vraiment pas — n'invente pas de cas pour le justifier.

Le test simple : _ai-je besoin de la base pour dire non ?_ Non ⇒ `400`. Oui ⇒ `409`.

### 4.3 « Trouver ou créer » l'ingrédient (UC-11)

À l'enregistrement d'une recette, chaque ingrédient saisi est cherché par son nom ; s'il
existe, on réutilise la ligne, sinon on la crée. Deux conséquences :

- l'opération doit être **transactionnelle** avec la création de la recette — une recette
  à moitié enregistrée est pire que pas de recette du tout ;
- attention à la **requête en boucle** (N+1) : dix ingrédients ne doivent pas faire dix
  allers-retours. C'est la seule alerte de performance immédiate du projet
  (`CLAUDE.md`, priorité n°3).

### 4.4 Anti-auto-rétrogradation (UC-16)

`PATCH /api/utilisateurs/:id/role` doit refuser (`409`) :

- qu'un admin **se** retire son propre rôle d'admin ;
- que le **dernier** admin du système soit rétrogradé ou supprimé.

Sans cette règle, une seule requête peut rendre l'administration définitivement
inaccessible. C'est une règle **métier**, donc elle vit dans le service — pas dans un
guard, pas dans le contrôleur.

### 4.5 La note moyenne est calculée, jamais stockée

Aucune route ne renvoie un champ persisté « note moyenne ». Elle se calcule à partir des
avis (décision du design : stocker une valeur dérivée = risque d'incohérence).
Cas limite à ne pas oublier : **une recette sans aucun avis** — la moyenne n'est pas `0`,
elle est **absente**. Zéro signifierait « très mal notée », ce qui est faux.

### 4.6 Supprimer un compte anonymise, ne supprime pas (UC-09b)

`DELETE /api/utilisateurs/moi` ne fait pas disparaître les avis : leur `user_id` passe à
`NULL` (`ON DELETE SET NULL`). L'API doit donc savoir représenter un **auteur absent**
sans planter, partout où un auteur est affiché — avis et recettes (`recipe.author_id` est
nullable pour la même raison).

### 4.7 Ne jamais faire sortir `password_hash`

Aucune réponse, nulle part, ne contient le hash — ni `GET /utilisateurs/moi`, ni la liste
admin, ni l'auteur inclus dans un avis. Le mécanisme est déjà en place
(`ClassSerializerInterceptor` global) ; il ne s'activera que si le champ porte
`@Exclude()` sur l'entité. C'est à faire au moment d'écrire l'entité `Utilisateur`.

---

## 5. Ce qui n'est pas encore tranché

Ces points n'ont pas de réponse évidente ; ils se décideront à l'écriture de la feature
concernée, et ce document sera mis à jour.

- **Les étapes de préparation** (`steps`) : sous-ressource (`/recettes/:id/etapes`) ou
  simple tableau dans le corps de la recette ? Le tableau est plus simple et suffit
  probablement — elles n'ont pas de vie propre.
- **Syntaxe de tri** : `-dateCreation` (proposé ici) ou `tri=dateCreation&ordre=desc` ?
- **Note moyenne dans les listes** : absente en F1 (la calculer imposerait de charger les
  avis de chaque recette). À ajouter en F2 via une seule requête d'agrégation, jamais en
  bouclant recette par recette.
- **Favoris** : reporté par le design, purement additif. Aucune route aujourd'hui.
