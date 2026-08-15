# Guide — L'authentification

> À lire **avant** d'écrire la première ligne du module `auth`. Ce guide explique le
> _pourquoi_ des décisions figées dans `openspec/changes/setup-authentification/design.md`.
> Le contrat des routes est dans `design/routes-api.md` § 3.1.
>
> Objectif : que tu saches **contre quelle attaque** chaque brique existe. Un code de
> sécurité qu'on recopie sans ça est un code qu'on désactive au premier bug.

## 1. Le mot de passe : Argon2, et pourquoi pas SHA-256

Un mot de passe ne se chiffre pas, il se **hache** : la transformation est à sens
unique, on ne peut que re-hacher une saisie et comparer. Si la base fuit, l'attaquant
n'a pas les mots de passe — il a de quoi **essayer** des mots de passe.

Et c'est là que le choix de l'algorithme se joue. SHA-256 est conçu pour être
**rapide** : une carte graphique en calcule des milliards par seconde. Un attaquant qui
vole ta table teste tout le dictionnaire en quelques heures.

Argon2 est conçu pour être **lent et gourmand en mémoire**. Chaque tentative coûte du
temps ET de la RAM — et la RAM ne se parallélise pas comme le calcul pur, ce qui ruine
l'avantage des cartes graphiques. Vérifier un mot de passe à la connexion coûte ~100 ms :
invisible pour l'utilisateur, ruineux pour qui en teste des milliards.

Deux détails qui comptent :

- **Le sel est inclus dans le hash.** Argon2 génère un sel aléatoire par mot de passe et
  le stocke dans la chaîne produite (`$argon2id$v=19$m=...,t=...,p=...$sel$hash`). Tu n'as
  donc **pas** de colonne `salt` à gérer : deux utilisateurs avec le même mot de passe
  ont deux hash différents, et une table pré-calculée (rainbow table) ne sert à rien.
- **On ne compare jamais deux hash à la main.** On utilise `argon2.verify(hash, saisie)`,
  qui relit les paramètres depuis le hash lui-même. Le jour où on augmentera le coût,
  les anciens hash resteront vérifiables.

## 2. Où mettre le jeton : la balançoire XSS / CSRF

Une fois connecté, le navigateur doit prouver son identité à chaque requête. Le jeton
doit donc être stocké quelque part — et **il n'existe pas d'emplacement sans risque**.
C'est un arbitrage entre deux familles d'attaques, pas un choix entre bien et mal.

| Emplacement                              | Vulnérable à… | Le problème                                                 |
| ---------------------------------------- | ------------- | ----------------------------------------------------------- |
| `localStorage` + en-tête `Authorization` | **XSS**       | tout script de la page peut lire le jeton et l'exfiltrer    |
| Cookie `httpOnly`                        | **CSRF**      | le navigateur l'envoie tout seul, même depuis un autre site |

**XSS** (cross-site scripting) : un attaquant réussit à faire exécuter son JavaScript
dans ta page — via un champ de commentaire mal échappé, une dépendance npm compromise,
une extension. Son script lit `localStorage`, envoie le jeton chez lui, et il est toi.
Tu ne le sauras jamais.

**CSRF** (cross-site request forgery) : tu es connecté chez nous, tu visites un site
piégé, ce site déclenche en fond un `POST` vers notre API. Le navigateur, serviable,
**joint automatiquement nos cookies**. L'action part en ton nom.

Le projet choisit le **cookie `httpOnly`**. La raison est pragmatique : `httpOnly` rend
le cookie **invisible au JavaScript** — `document.cookie` ne le voit pas, donc un XSS ne
peut pas l'exfiltrer. On échange une faille difficile à contenir (le XSS peut venir de
n'importe quelle dépendance) contre une faille à **parade connue et déclarative** (§ 3).

Conséquence concrète côté client : **aucun code React ne manipule de token**. Pas de
`localStorage.setItem('token', ...)`, pas d'en-tête `Authorization` à construire. Le
front envoie juste ses requêtes avec `credentials: 'include'` et le navigateur fait le
reste. Si tu vois un jour un token traîner dans du code front, c'est un bug de
conception.

## 3. Neutraliser le CSRF : `SameSite`, `Secure`, `httpOnly`

Trois attributs, trois rôles distincts — on les confond souvent :

| Attribut       | Empêche…                                                            |
| -------------- | ------------------------------------------------------------------- |
| `httpOnly`     | la lecture du cookie par JavaScript (anti-XSS)                      |
| `Secure`       | l'envoi du cookie en clair sur HTTP (anti-écoute)                   |
| `SameSite=Lax` | l'envoi du cookie sur une requête venue d'un autre site (anti-CSRF) |

`SameSite=Lax` est la parade au problème ouvert au § 2 : le navigateur **refuse
d'attacher le cookie** quand la requête est déclenchée par un autre domaine — le `POST`
du site piégé part sans cookie, donc en anonyme, donc en `401`. L'exception de `Lax` :
la **navigation de premier niveau** (cliquer un lien externe vers notre site) envoie
quand même le cookie. C'est ce qui permet « je clique un lien reçu par mail et j'arrive
connecté ». `SameSite=Strict` bloquerait aussi ce cas — plus sûr, mais l'expérience
devient déroutante.

**Le piège à retenir** : `SameSite` raisonne sur le **domaine enregistrable**, pas sur
le sous-domaine. `app.recettes.fr` et `api.recettes.fr` sont « same site » (les cookies
passent) ; `recettes.fr` et `mon-api.vercel.app` ne le sont pas. Cette décision de
sécurité **contraint donc le déploiement** : le front et l'API devront partager le
domaine. À ne pas découvrir le jour de la mise en ligne.

## 4. Deux jetons : un court qui prouve, un long qui renouvelle

Un JWT est **autoportant** : il contient l'identité et le rôle, signés. L'API n'a pas
besoin de la base pour le vérifier — c'est toute sa force… et son défaut : **on ne peut
pas le révoquer**. Il n'y a rien à supprimer, il vit dans le navigateur du client
jusqu'à sa date d'expiration.

Le scénario qui fait mal : tu rétrogrades un modérateur qui abuse. Son jeton, lui,
continue d'affirmer « modérateur » — et l'API le croit, puisqu'il est bien signé. Avec
un jeton de 24 h, l'ex-modérateur garde ses pouvoirs jusqu'à demain.

D'où deux jetons aux rôles séparés :

| Jeton       | Durée   | Rôle                                                                        |
| ----------- | ------- | --------------------------------------------------------------------------- |
| **access**  | ~15 min | prouve l'identité à chaque requête ; vérifié par signature, sans accès base |
| **refresh** | jours   | ne sert QU'À obtenir un nouvel access ; vérifié **en base**                 |

L'access court **borne les dégâts** : au pire 15 minutes de privilège périmé. Et comme
le renouvellement passe par la base, c'est le moment où l'on **relit le rôle réel** du
compte : le nouvel access porte le rôle d'aujourd'hui, pas celui d'hier. La révocation
n'est plus impossible, elle est simplement **différée d'au plus 15 minutes**.

## 5. Rotation et détection de vol : les familles

Le refresh vit longtemps : c'est lui, désormais, qui vaut de l'or. On ne peut pas
empêcher son vol (une machine compromise reste compromise), mais on peut le **détecter**.

L'idée tient en une phrase : **un refresh est à usage unique**.

1. Le client présente son refresh → on le marque `UTILISÉ` (la ligne **reste** en base)
   et on en émet un nouveau, portant le même `family_id`.
2. Une « famille » est donc la lignée d'une session : connexion → jeton 1 → jeton 2 → …

Et maintenant le piège se referme tout seul. Si un voleur copie le refresh, deux
détenteurs existent. Tôt ou tard, **les deux s'en servent** :

- le premier tourne le jeton normalement ;
- le second présente un jeton déjà marqué `UTILISÉ` → **cette situation est impossible
  dans un usage normal** ;
- l'API en conclut à une copie et **révoque toute la famille** : victime et voleur sont
  déconnectés, une reconnexion (donc le mot de passe) est exigée.

On ne sait pas lequel des deux est le voleur — et on n'a pas besoin de le savoir. La
détection est **gratuite** : elle ne coûte qu'une ligne qu'on ne supprime pas.

Dernier réflexe : le refresh est stocké **haché** en base, exactement comme un mot de
passe. Une fuite de la table `refresh_token` ne donne alors aucune session utilisable.

## 6. Les guards : où se décide « as-tu le droit »

Nest fournit le bon endroit pour ça : un **guard** s'exécute avant le controller et
répond oui/non. Deux guards, deux questions :

| Guard          | Question posée               | Refus |
| -------------- | ---------------------------- | ----- |
| `JwtAuthGuard` | « es-tu authentifié ? »      | `401` |
| `RolesGuard`   | « ton rôle suffit-il ici ? » | `403` |

`JwtAuthGuard` s'appuie sur **passport-jwt**, avec une seule particularité chez nous :
l'extracteur par défaut lit l'en-tête `Authorization`, or notre jeton est dans un
**cookie** — il faut donc fournir un extracteur qui lit le cookie. Le guard valide la
signature, puis attache l'identité (`id`, `role`) à la requête pour la suite.

`RolesGuard` lit, via le `Reflector` de Nest, les rôles exigés par le décorateur
`@Roles('moderateur')` posé sur la route. Les rôles sont **hérités** (admin ⊃ modérateur
⊃ utilisateur) : un admin passe une porte marquée « modérateur ». Cette hiérarchie
s'exprime **une fois** dans le guard, jamais en `if` dispersés.

`401` et `403` ne sont pas interchangeables : `401` = « je ne sais pas qui tu es »
(reconnecte-toi), `403` = « je sais qui tu es, et c'est non » (te reconnecter n'y
changera rien).

## 7. Le rôle ne dit jamais « c'est à moi » (anti-IDOR)

Voilà le point le plus important du guide, et celui qu'on rate le plus souvent.

`DELETE /avis/42` est autorisé dans deux cas très différents :

- **UC-08** : je suis l'**auteur** de l'avis 42 → c'est de la **propriété** ;
- **UC-14** : je suis **modérateur** → c'est du **rôle**.

Un guard ne peut trancher que le second. Il s'exécute **avant** le controller : à ce
moment, l'avis 42 n'a pas été chargé, personne ne sait à qui il appartient. La propriété
ne peut donc se vérifier qu'**après** avoir lu la donnée — c'est-à-dire **dans le
service**, en comparant `avis.utilisateur.id` à `user.id`.

Oublier cette comparaison, c'est l'**IDOR** (référence directe non sécurisée à un objet) :
la route est bien protégée par `JwtAuthGuard`, tout le monde est authentifié… et
n'importe quel utilisateur connecté supprime les avis de n'importe qui en changeant le
numéro dans l'URL. La faille ne vient pas d'un guard manquant, elle vient d'un guard qui
répondait à la **mauvaise question**.

La règle, donc : **rôle → guard ; propriété → service.** Et quand l'URL peut s'en
passer, on la supprime carrément : c'est le sens de `/utilisateurs/moi` plutôt que
`/utilisateurs/:id` (`routes-api.md` § 3.4) — sans identifiant dans l'URL, il n'y a rien
à falsifier.

## 8. Les secrets ne sont pas dans le dépôt

Le secret de signature JWT, les durées de vie et les options de cookie viennent des
**variables d'environnement**, validées au démarrage par `env.validation.ts`. Si une
variable manque, **l'application refuse de démarrer**.

C'est volontaire, et c'est plus qu'une bonne pratique : une valeur par défaut de
repli (`process.env.JWT_SECRET ?? 'dev-secret'`) est exactement ce qui finit un jour en
production. Un secret de signature connu = **n'importe qui fabrique un jeton
« administrateur » valide**. On préfère un démarrage qui échoue bruyamment.

## 9. Le fil complet, en une lecture

```
INSCRIPTION   mot de passe → Argon2 → users.password_hash
CONNEXION     vérification Argon2 → access (15 min) + refresh (jours)
                → 2 cookies httpOnly + Secure + SameSite=Lax
                → refresh haché en base, nouvelle famille
REQUÊTE       cookie → JwtAuthGuard (signature) → RolesGuard (@Roles)
                → service : propriété (user.id == propriétaire ?)
RENOUVELLEMENT refresh présenté → actif ? → rôle relu EN BASE
                → ancien marqué UTILISÉ, nouveau émis (même famille)
                → si déjà UTILISÉ : famille révoquée, reconnexion exigée
DÉCONNEXION   famille révoquée + cookies effacés
```

## 10. Ce qu'on ne fait PAS maintenant

Décidé, assumé, et écrit ici pour qu'on ne se le redemande pas :

- **Pas de token anti-CSRF double-submit.** `SameSite=Lax` suffit pour démarrer ; c'est
  une couche de défense en profondeur qu'on ajoutera si besoin.
- **Pas de Redis.** Les refresh restent en MySQL — mais derrière un _repository_, pour
  qu'un futur changement de stockage ne touche pas la logique d'auth.
- **Pas d'OAuth** (« se connecter avec Google »).
- **Pas de limite du nombre de sessions actives** par utilisateur.
