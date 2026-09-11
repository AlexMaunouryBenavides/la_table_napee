## ADDED Requirements

### Requirement: Point d'accès unique à l'API

Tout appel réseau du client SHALL passer par la couche d'accès API. Aucun composant,
loader ou action ne SHALL appeler `fetch` directement sur l'API.

#### Scenario: Un écran lit une ressource

- **WHEN** un loader a besoin de `GET /recettes`
- **THEN** il appelle la couche d'accès API, qui ajoute l'URL de base, l'en-tête
  `Content-Type` et les options communes
- **AND** aucun `fetch('http://…/recettes')` n'apparaît dans le code de l'écran

#### Scenario: L'URL de base change d'environnement

- **WHEN** l'API n'est plus sur `localhost`
- **THEN** une seule variable d'environnement suffit à tout rebrancher

### Requirement: Authentification par cookie, aucun jeton en JS

Tout appel SHALL être émis avec `credentials: 'include'`. Le client NE DOIT JAMAIS
lire, stocker ni afficher un jeton d'accès ou de rafraîchissement — ni en mémoire, ni
en `localStorage`, ni en `sessionStorage`.

#### Scenario: Appel authentifié

- **WHEN** le client appelle une route protégée
- **THEN** la requête part avec `credentials: 'include'` et le navigateur joint le
  cookie `httpOnly`

#### Scenario: Recherche d'un jeton dans le code client

- **WHEN** on cherche `localStorage`, `sessionStorage` ou « token » dans `client/app`
- **THEN** aucune occurrence liée à l'authentification n'existe

### Requirement: Refresh transparent rejoué une seule fois

Quand un appel reçoit `401`, la couche d'accès SHALL appeler
`POST /auth/rafraichissement` puis rejouer la requête initiale **exactement une fois**.
Si le rafraîchissement échoue, ou si le rejeu reçoit encore `401`, la session SHALL
être considérée comme terminée et l'erreur propagée.

#### Scenario: Jeton d'accès expiré, session encore valide

- **WHEN** un appel reçoit `401` et que le rafraîchissement réussit
- **THEN** la requête initiale est rejouée et l'appelant reçoit le résultat normal,
  sans le savoir

#### Scenario: Session réellement terminée

- **WHEN** le rafraîchissement échoue
- **THEN** aucune nouvelle tentative n'est faite, la session passe à « déconnecté » et
  l'appelant reçoit l'erreur

#### Scenario: Pas de boucle de rafraîchissement

- **WHEN** la requête rejouée reçoit à nouveau `401`
- **THEN** elle n'est pas rejouée une deuxième fois

#### Scenario: Plusieurs appels reçoivent 401 en même temps

- **WHEN** deux appels parallèles reçoivent `401`
- **THEN** un seul `POST /auth/rafraichissement` est émis, les deux appels attendent
  son résultat

### Requirement: Forme d'erreur de l'API restituée aux écrans

La couche d'accès SHALL traduire toute réponse non-2xx en une erreur typée portant le
`statusCode`, le `message` et le tableau `details` quand il existe. Elle NE DOIT PAS
avaler l'erreur ni renvoyer une valeur par défaut.

#### Scenario: Validation refusée

- **WHEN** l'API répond `400` avec `{ statusCode, message, details: [...] }`
- **THEN** l'écran reçoit une erreur qui porte `details`, et peut afficher les
  messages champ par champ

#### Scenario: Réponse illisible

- **WHEN** l'API est injoignable ou renvoie un corps non-JSON
- **THEN** la couche produit quand même une erreur exploitable, jamais un `undefined`
  silencieux

### Requirement: Session et rôle déduits du serveur

L'état « connecté » et le rôle SHALL être déduits de `GET /utilisateurs/moi`, chargé
par la racine. Le client NE DOIT PAS déduire un rôle d'une valeur qu'il a lui-même
écrite.

#### Scenario: Visiteur anonyme

- **WHEN** `GET /utilisateurs/moi` répond `401`
- **THEN** la session vaut « visiteur », et ce n'est pas une erreur affichée

#### Scenario: Navigation construite depuis le rôle

- **WHEN** un modérateur ouvre le back-office
- **THEN** les entrées réservées à l'administrateur ne sont pas rendues du tout
- **AND** elles ne sont pas simplement masquées en CSS

#### Scenario: Rôle pas encore connu

- **WHEN** `GET /utilisateurs/moi` n'a pas encore répondu
- **THEN** l'écran n'affiche ni le contenu protégé, ni un `403` — il affiche un
  squelette

### Requirement: L'URL est la source de vérité des critères de liste

Recherche, filtres, tri, page et onglet SHALL vivre dans l'URL et être lus par le
loader. Tout changement de critère SHALL ramener à `page=1`.

#### Scenario: Lien partagé

- **WHEN** on ouvre une URL de catalogue filtrée dans un autre navigateur
- **THEN** on voit exactement la même liste, sans état client préalable

#### Scenario: Retour arrière

- **WHEN** l'utilisateur applique un filtre puis fait « retour »
- **THEN** la liste précédente revient

#### Scenario: Changement de filtre en page 4

- **WHEN** l'utilisateur est page 4 et change un filtre
- **THEN** la nouvelle URL porte `page=1`

### Requirement: Trois états pour toute donnée distante

Chaque chargement SHALL rendre un état de chargement, un état vide et un état
d'erreur. Une liste vide N'EST PAS une erreur. Aucun écran blanc, aucun spinner plein
écran.

#### Scenario: Chargement

- **WHEN** une liste est en cours de chargement
- **THEN** un squelette de même géométrie que le contenu final est affiché

#### Scenario: Liste vide

- **WHEN** l'API répond `{ donnees: [], total: 0 }`
- **THEN** un état vide explique pourquoi c'est vide et propose une sortie

#### Scenario: Échec partiel

- **WHEN** une donnée secondaire échoue mais que la principale est disponible
- **THEN** la page reste utilisable et l'échec est signalé localement
