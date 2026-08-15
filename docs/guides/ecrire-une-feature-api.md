# Guide — Écrire une feature de l'API

> À lire **une fois en entier**, puis à rouvrir au § 3 (le fil) et au § 4 (quoi tester)
> à chaque nouvelle feature.
>
> Ce guide explique **comment** construire. Ce qu'il faut construire est dans
> `design/routes-api.md`. Les règles à respecter sont dans `docs/conventions/`.
> Ce guide ne les répète pas, il dit **dans quel ordre** les appliquer.

## 1. La place des tests : on écrit le code, puis on le vérifie

**Ce projet ne fait pas de TDD.** On écrit la feature, puis on écrit les tests qui
vérifient ce qui mérite de l'être. La discipline n'est pas dans l'ordre d'écriture, elle
est dans le **choix de ce qu'on teste** — c'est tout l'objet du § 4.

Concrètement, trois niveaux, chacun avec son rôle :

| Niveau                 | Couvre                                    | Quand              |
| ---------------------- | ----------------------------------------- | ------------------ |
| Tests unitaires ciblés | les règles métier (§ 4)                   | à chaque feature   |
| Noyau `supertest`      | les règles d'autorisation (§ 5)           | routes sensibles   |
| Cypress                | les parcours utilisateur dans l'interface | au moment du front |

Ces trois niveaux s'appuient sur le harnais posé par `openspec/changes/setup-tests/`
(profils Jest, base de test isolée, factories). Ce change fournit la **capacité** de
tester ; ce guide dit **quoi** en faire. Rien à réviser de ce côté : le harnais arrive
après la couche données et l'authentification, donc avant la première feature.

## 2. Avant de coder : trois lectures de cinq minutes

1. **Le cas d'usage** dans `design/use-cases-recettes.md` — qui fait ça, et sous quelle
   précondition ?
2. **La ligne correspondante** dans `design/routes-api.md` — verbe, URL, rôle requis,
   statuts attendus. Si la ligne n'existe pas, la feature n'est pas prête : ajoute-la au
   contrat d'abord.
3. **La section § 4 de `routes-api.md`** (« les règles qui se cachent ») — la feature
   y a-t-elle un piège documenté ?

Si après ces trois lectures tu ne peux pas énoncer en une phrase _« qui a le droit de
faire quoi, et qu'est-ce qui doit échouer »_, ne code pas encore. C'est le moment de
poser la question, pas après.

## 3. Le fil d'une feature

L'ordre compte : chaque étape rend la suivante évidente. On va **de l'extérieur vers
l'intérieur**, puis on ressort.

### Étape 1 — Scaffolder avec le CLI Nest

```
nest g resource avis
```

Pas à la main. Le CLI produit la structure idiomatique (module, controller, service,
`dto/`, `entities/`) et l'enregistre dans le module racine. Tu obtiens gratuitement ce
que `docs/conventions/nest.md` § 1 demande. **Supprime ensuite ce que tu n'utilises
pas** : le CLI génère les cinq routes CRUD, or ta ressource n'en a peut-être que trois.
Une route générée non voulue est du code mort — `knip` te le dira, mais autant ne pas
l'écrire.

### Étape 2 — Le DTO d'entrée

C'est la **frontière de confiance**. Trois règles, dans cet ordre d'importance :

1. **Un DTO n'est pas une copie des colonnes.** `CreerAvisDto` contient `note` et
   `commentaire` — pas `id`, pas `userId`, pas `createdAt`. L'auteur vient du cookie, pas
   du corps de la requête. Le jour où tu mets `userId` dans un DTO, n'importe qui peut
   écrire un avis au nom d'un autre.
2. **Un DTO par cas d'usage**, pas un par entité. Créer et modifier n'ont pas les mêmes
   champs obligatoires.
3. **Tout champ est décoré** (`@IsInt()`, `@Min()`, `@MaxLength()`…). Ce qui n'est pas
   décoré est retiré par `whitelist` — silencieusement. Un champ oublié ne provoque pas
   d'erreur, il **disparaît** : c'est le bug le plus déroutant de cette couche.

Rappel de `nest.md` § 4 : les propriétés non initialisées s'écrivent `note!: number`.

### Étape 3 — Le service : tout le métier, zéro HTTP

Le service ne connaît ni `req`, ni `res`, ni les cookies. Il reçoit des valeurs simples
et l'identité de l'appelant en paramètre. S'il importe quoi que ce soit d'Express, c'est
un signal d'alarme (`nest.md` § 2).

C'est ici que vivent : les vérifications de propriété, les règles de conflit, les
calculs, les transactions. Un service correctement écrit est testable **sans serveur**,
et c'est précisément ce qui rendra le § 4 facile.

Pour signaler une erreur, **lève une exception Nest** (`NotFoundException`,
`ConflictException`, `ForbiddenException`) — pas de `try/catch`, pas de retour d'objet
`{ erreur: ... }`. Le filtre global les met en forme (`rest.md` § 5).

### Étape 4 — Le controller : mince

Il reçoit, il délègue, il renvoie. Une méthode de controller qui dépasse trois lignes
contient probablement du métier qui devrait descendre dans le service.

Il porte en revanche les **décorateurs** : la route, le statut de succès quand il n'est
pas celui par défaut (`@HttpCode(204)` sur une suppression), les guards, et le décorateur
qui extrait l'utilisateur courant du cookie.

### Étape 5 — L'autorisation, au bon endroit

C'est l'étape où l'on se trompe le plus. La règle :

| Question posée               | Où ça se décide        |
| ---------------------------- | ---------------------- |
| Est-il connecté ?            | guard (`JwtAuthGuard`) |
| A-t-il le bon **rôle** ?     | guard (`RolesGuard`)   |
| Est-ce **son** objet à lui ? | **service**            |

Pourquoi la propriété ne peut pas être dans un guard : le guard s'exécute **avant** que
quoi que ce soit ne soit chargé. Pour savoir si l'avis n°42 appartient au demandeur, il
faut d'abord aller le chercher en base — ce n'est pas le travail d'un guard, et ça
dupliquerait la requête que le service fera de toute façon.

### Étape 6 — La sortie

Vérifie ce qui **sort**, pas seulement ce qui entre. Aucun `password_hash`, aucun
identifiant interne inutile. Le mécanisme est déjà global
(`ClassSerializerInterceptor`) ; il ne fait rien tant que l'entité ne porte pas
`@Exclude()` sur les champs sensibles.

### Étape 7 — Les tests, puis `npm run verify`

Voir § 4 et § 5. Puis `npm run verify` — qui garantit déjà format, types, code mort et
duplication, donc inutile de les relire toi-même.

---

## 4. Quoi tester, et surtout quoi NE PAS tester

Le risque d'une stratégie « seulement ce qui mérite un test », c'est qu'elle devienne
« au feeling », donc rien. Voici le critère explicite.

### La règle du « si »

> **Ce qui contient une condition mérite un test. Ce qui n'en contient pas, non.**

Un bout de code avec un `si` a au moins deux chemins d'exécution, donc au moins un chemin
que tu n'as jamais exécuté à la main. C'est là que les bugs se logent.

**À tester :**

| Catégorie                   | Exemples concrets dans ce projet                                       |
| --------------------------- | ---------------------------------------------------------------------- |
| Règle de conflit            | deuxième avis sur la même recette → `409` ; titre de recette déjà pris |
| Contrôle de propriété       | modifier l'avis d'un autre → `403`                                     |
| Règle métier avec exception | dernier admin non rétrogradable ; on ne se retire pas son propre rôle  |
| Calcul                      | note moyenne : arrondi, et surtout **liste d'avis vide**               |
| Logique conditionnelle      | « trouver ou créer » : ingrédient existant vs nouveau                  |
| Cas limite structurel       | recette introuvable → `404` ; liste vide ; page au-delà du total       |

**À ne PAS tester :**

- Les **getters** et le mapping sans branche. Un test qui vérifie qu'un champ recopié est
  recopié ne détecte rien : il casse quand tu renommes, jamais quand tu te trompes.
- Le **framework**. Que `@IsInt()` rejette `"abc"` est garanti par `class-validator` ;
  que `whitelist` retire un champ en trop est garanti par Nest. Tester ça, c'est tester
  du code que tu n'as pas écrit.
- Ce que la **base garantit déjà** par contrainte, _au niveau unitaire_. La contrainte
  `UNIQUE(user_id, recipe_id)` existe ; ce que tu testes, c'est que **ton service la
  traduit en `409`** au lieu de laisser remonter une erreur SQL brute en `500`.
- Les **détails d'implémentation**. Teste « un deuxième avis est refusé », pas « la
  méthode `findOne` du dépôt a été appelée une fois ». Le premier survit à un
  refactoring, le second casse à chaque fois.

### À quoi ressemble un test unitaire Nest

L'ossature, à la manière de Nest — le service est instancié par le module de test, ses
dépendances sont remplacées par des faux :

```ts
const module = await Test.createTestingModule({
  providers: [
    AvisService,
    { provide: getRepositoryToken(Avis), useValue: fauxDepotAvis },
  ],
}).compile();
```

Puis un test = un comportement, nommé comme une phrase qui décrit la **règle métier**,
pas la méthode testée :

- ✅ `« refuse un deuxième avis du même utilisateur sur la même recette »`
- ❌ `« creer() retourne une erreur »`

Le reste (montage du faux dépôt, assertions) est à toi : c'est exactement le genre de
code où l'on apprend en butant dessus.

---

## 5. Le noyau sécurité en `supertest`

Les tests unitaires vérifient qu'un service **sait dire non**. Ils ne vérifient pas que
le guard est bien **branché sur la route**. Un `@Roles('admin')` oublié au-dessus d'un
`@Delete()` passe tous les tests unitaires du monde.

D'où un petit ensemble de tests HTTP, **uniquement** sur les routes sensibles. Le format
est une matrice : pour chaque route, chaque acteur, le statut attendu.

|                                | anonyme | utilisateur | **autre** utilisateur | modérateur | admin |
| ------------------------------ | ------- | ----------- | --------------------- | ---------- | ----- |
| `PATCH /avis/:id`              | 401     | 200         | **403**               | 403        | 403   |
| `DELETE /avis/:id`             | 401     | 204         | **403**               | 204        | 204   |
| `POST /recettes`               | 401     | 403         | 403                   | 201        | 201   |
| `DELETE /recettes/:id`         | 401     | 403         | 403                   | 204        | 204   |
| `PATCH /utilisateurs/:id/role` | 401     | 403         | 403                   | **403**    | 200   |
| `POST /regimes`                | 401     | 403         | 403                   | **403**    | 201   |

Les cases en gras sont celles qui ont une vraie chance d'être fausses. La colonne
« **autre** utilisateur » est la plus importante du tableau : c'est le scénario d'attaque
réel (quelqu'un de légitimement connecté qui vise l'objet de quelqu'un d'autre), et c'est
exactement ce qu'un test de parcours dans un navigateur ne produira jamais, puisque
l'interface ne lui proposera pas le bouton.

Remarque sur `PATCH /avis/:id` : un modérateur reçoit `403` alors qu'il reçoit `204` sur
`DELETE`. Ce n'est pas une incohérence — UC-14 lui donne le droit de **supprimer** un
avis (modération), pas de **réécrire** les propos de quelqu'un d'autre.

Ces tests ont besoin d'utilisateurs authentifiés dans plusieurs rôles. Prévois un helper
qui fabrique une session pour un rôle donné : sans lui, chaque test recommencerait le
parcours d'inscription et le noyau deviendrait illisible.

---

## 6. « Terminé », concrètement

Une feature est finie quand **toutes** ces cases sont cochées. Elles viennent des
checklists de `rest.md`, `nest.md` et `clean-code.md`, réunies ici pour n'avoir qu'une
liste à parcourir.

**Contrat**

- [ ] La route correspond exactement à sa ligne dans `design/routes-api.md`.
- [ ] Statuts justes : `201` à la création, `204` à la suppression (corps vide), `4xx`
      adaptés — et jamais un `200` porteur d'un message d'erreur.
- [ ] Les listes sont paginées ; filtres et tri en query string.

**Sécurité**

- [ ] Toute entrée passe par un DTO décoré ; aucun champ sensible n'est acceptable en
      entrée (`role`, `userId`, `id`).
- [ ] Aucune réponse ne contient `password_hash` ni de champ interne.
- [ ] Rôle vérifié en guard, propriété vérifiée en service.
- [ ] Aucun secret, aucune URL en dur.

**Code**

- [ ] Controller mince ; aucun `req`/`res` dans le service.
- [ ] Dépendances injectées par constructeur (jamais de `new`).
- [ ] Noms en français, qui disent l'intention ; commentaires sur le _pourquoi_.
- [ ] Aucune requête en boucle (N+1).

**Vérification**

- [ ] Un test par règle contenant un « si » (§ 4).
- [ ] La matrice de sécurité est à jour si la feature touche une route sensible (§ 5).
- [ ] `npm run verify` passe.
- [ ] `npm test` passe.

---

## 7. Dans quel ordre construire les features

Le principe : **la première feature doit valider la chaîne complète sur le cas le plus
simple**. On n'apprend rien en débutant par le plus dur, et on ne débogue pas trois
problèmes à la fois.

| Ordre | Feature                                    | UC          | Ce que ça t'apprend                                       |
| ----- | ------------------------------------------ | ----------- | --------------------------------------------------------- |
| F1    | Lire les recettes (liste + détail)         | UC-01/02    | la chaîne entière, **sans authentification**              |
| F2    | Filtrer, trier, paginer                    | UC-03       | DTO de query, jointures, N+1                              |
| F3    | Catégories en lecture                      | UC-03       | le patron répété 4 fois, et le piège de la factorisation  |
| F4    | Avis : créer, modifier, supprimer          | UC-06/07/08 | **la propriété** — le cœur de la sécurité                 |
| F5    | Recettes : créer, modifier, supprimer      | UC-11/12/13 | transactions, « trouver ou créer », autorisation par rôle |
| F6    | Compte : profil, mot de passe, suppression | UC-09/09b   | l'anonymisation                                           |
| F7    | Administration des catégories              | UC-15       | `RESTRICT` traduit en `409`                               |
| F8    | Administration des utilisateurs            | UC-16       | la route la plus dangereuse, gardée pour la fin           |

F1 à F3 ne dépendent pas de l'authentification : tu peux les écrire pendant que
`setup-authentification` n'est pas terminé. F4 et au-delà en dépendent entièrement.

Prérequis à tout : `setup-couche-donnees` (entités, migrations, seeds). Sans base, il n'y
a rien à lire.
