# Guide — La couche de données

> À lire **avant** d'écrire la première entité. Ce guide explique le _pourquoi_ des
> décisions prises dans `openspec/changes/setup-couche-donnees/design.md`. Les règles
> vivent dans `docs/conventions/` ; ici on apprend.
>
> Objectif : que tu comprennes le mapping ORM, pas que tu le recopies.

## 1. Migrations ou auto-synchronisation : le premier choix

TypeORM sait faire deux choses très différentes, et il faut choisir **une fois pour
toutes**.

**L'auto-synchronisation** (`synchronize: true`) : au démarrage, TypeORM compare tes
entités à la base et la modifie pour qu'elles correspondent. Magique en apparence.

Le problème : cette comparaison n'a **aucune notion d'intention**. Tu renommes une
propriété `titre` en `intitule` ? TypeORM ne voit pas un renommage, il voit une colonne
disparue et une colonne apparue. Il exécute donc `DROP COLUMN titre` puis
`ADD COLUMN intitule`. **Tous les titres de toutes tes recettes sont perdus**, sans
question, sans confirmation, au démarrage de l'application.

**Une migration** est un fichier de code, versionné dans git, qui décrit **explicitement**
un changement de schéma :

- tu la **relis** avant de l'exécuter — donc tu vois le `DROP` avant qu'il ne s'exécute ;
- elle est **rejouable à l'identique** sur ta machine, celle d'un collègue, la prod ;
- elle est **réversible** (`down()`), donc une erreur se rattrape ;
- elle constitue l'**historique** du schéma : tu peux dire pourquoi la base est ainsi.

D'où la décision, sans exception : **`synchronize: false` dans tous les
environnements**, y compris en développement. La tentation de l'activer « juste en
local » est réelle ; la refuser dès le début t'évite d'avoir deux façons de faire
évoluer le schéma — et donc deux schémas qui divergent.

## 2. Notre modèle : bootstrap, puis code-first

Il y a trois façons de faire vivre un schéma. Comprendre laquelle on prend, et pourquoi
on écarte les autres, évite de dériver plus tard.

| Modèle                     | Source de vérité                      | Pourquoi on l'écarte / le prend            |
| -------------------------- | ------------------------------------- | ------------------------------------------ |
| _Database-first_           | le SQL, écrit à la main               | deux représentations à maintenir → dérive  |
| _Code-first pur_           | les entités, depuis zéro              | jetterait le `database.sql` déjà travaillé |
| **Bootstrap → code-first** | le SQL **une fois**, puis les entités | **retenu**                                 |

Concrètement, notre chemin :

1. `docs/database.sql` (corrigé) devient le **contenu de la migration n°1**. C'est le
   point de départ, écrit une fois.
2. À partir de là, **les entités TypeORM sont la seule source vivante**. Le fichier
   `database.sql` devient une **archive de genèse** : on ne le modifie plus, on ne le
   synchronise plus. Le jour où il contredira les entités, ce sont les entités qui
   auront raison.

### Le workflow des migrations, en trois commandes

```
migration:generate   compare tes entités à la base → écrit un fichier de migration
migration:run        applique les migrations en attente
migration:revert     annule la dernière migration appliquée
```

**La règle d'or, celle qu'on oublie :** `generate` produit un **brouillon**, jamais un
résultat final. Tu le **lis** avant de faire `run`. TypeORM devine, et il devine mal les
renommages exactement comme l'auto-sync — la différence, c'est qu'ici tu as un fichier
sous les yeux et le temps de le corriger à la main.

### Le piège du bootstrap

Il y a un moment délicat : quand tu auras écrit les entités censées correspondre à la
migration n°1, il faudra **vérifier qu'elles correspondent vraiment**. Le test est
simple et sans appel :

> Lance un `migration:generate` juste après. S'il produit **un fichier vide**, tes
> entités reflètent exactement le schéma. S'il produit quoi que ce soit, il y a un
> écart — corrige l'entité, pas la base.

C'est la tâche 5.7 du change. Ne la saute pas : un écart non détecté ici reviendra sous
forme de migration parasite au pire moment.

## 3. Table ≠ entité ≠ DTO

Trois mots qui décrivent « les données », trois choses différentes. Les confondre est
l'erreur la plus courante — et la plus coûteuse en sécurité.

| Objet      | Répond à la question                      | Vit où           |
| ---------- | ----------------------------------------- | ---------------- |
| **Table**  | comment c'est **stocké**                  | dans MySQL       |
| **Entité** | comment le code **manipule** ça           | dans `entities/` |
| **DTO**    | ce que le client a le **droit d'envoyer** | dans `dto/`      |

Prends `users`, l'exemple le plus parlant :

- **Table** : colonne `password_hash VARCHAR(255)` — le hash Argon2.
- **Entité** `Utilisateur` : propriété `motDePasseHash`, marquée `@Exclude()` pour ne
  jamais sortir dans une réponse HTTP.
- **DTO** `CreerUtilisateurDto` : propriété `motDePasse` — **en clair**, parce que c'est
  ce que le client envoie. Elle n'existe dans aucune table : le service la hache, puis
  l'oublie.

Trois formes, trois noms, trois raisons d'être. Et surtout : **un DTO n'est jamais une
copie des colonnes**. S'il l'était, un client pourrait envoyer `role: "admin"` à
l'inscription et se promouvoir lui-même. Le DTO décrit un **contrat d'API**, pas un
stockage — c'est la priorité sécurité n°2 du projet appliquée à cette couche.

## 4. La composition : quand une relation devient une entité

C'est la décision de modélisation la plus importante du projet, et celle qui te servira
partout ailleurs. Le raisonnement compte plus que le résultat.

Une relation N–N s'écrit normalement `@ManyToMany` en TypeORM : une recette a plusieurs
régimes, un régime concerne plusieurs recettes, et le lien lui-même **n'a rien à dire**.
TypeORM crée la table de jonction en coulisses, tu n'y penses jamais. C'est le cas de
`regime_recipe`, `recipe_health_criteria`, `recipe_food_type` — trois jonctions **nues**.

Mais recette ⇄ ingrédient est différent. Le lien porte une information :
**« 200 g de farine »**. Le `200` et le `g` n'appartiennent ni à la recette (elle ne
contient pas « 200 » toute seule) ni à l'ingrédient (la farine n'est pas « 200 g » dans
l'absolu). Ils appartiennent **au lien**.

> **La question à se poser à chaque relation N–N : est-ce que le lien a quelque chose à
> dire ?**
> Non ⇒ `@ManyToMany`, jonction nue.
> Oui ⇒ c'est une **entité à part entière**, avec deux `@ManyToOne`.

Donc `composition` s'écrit comme une entité normale : sa propre clé primaire, un
`@ManyToOne` vers `Recette`, un `@ManyToOne` vers `Ingredient`, plus `quantity` et
`unit`. **Pas de `@ManyToMany`.**

Deux détails qui ont leur raison :

- **`quantity` est nullable** : c'est « à volonté » (sel, poivre). `NULL` ne veut pas
  dire zéro, il veut dire « pas de quantité définie ».
- **Clé primaire `id` propre + `UNIQUE(recipe_id, ingredient_id)`** plutôt qu'une clé
  composite. La contrainte d'unicité garantit la même chose (un ingrédient au plus une
  fois par recette), mais un `id` simple est bien plus commode à manipuler en ORM.

Ce que ce choix débloque, concrètement : les listes de courses (agréger les quantités de
plusieurs recettes) et les portions dynamiques (quantité × ratio). Avec une jonction
nue, ces deux features seraient **impossibles** sans refonte.

## 5. Les énumérations vivent dans le code

Quatre champs ont un ensemble de valeurs fermé : `role`, `difficulty`, `recipe_type`, et
`composition.unit`.

Ils sont stockés en `VARCHAR(20)` côté base, et l'ensemble des valeurs autorisées est
défini **dans le code TypeScript**, puis validé à la frontière par `@IsEnum()` sur le
DTO. La base ne connaît qu'une chaîne ; c'est l'application qui décide ce qui est valide.

Pourquoi pas une table `unite` en base ? Parce qu'une table sert à stocker ce que les
**utilisateurs** font évoluer. Or personne ne doit pouvoir inventer un rôle depuis le
panneau d'administration — ce serait une faille. Ces valeurs sont **structurelles**,
donc elles vivent avec le code.

C'est exactement l'inverse des catégories (régimes, critères santé, types d'aliment,
nationalités) : celles-là **sont** des tables, parce qu'un admin doit pouvoir en ajouter
sans redéploiement (UC-15).

> **Le critère : qui a le droit d'ajouter une valeur ?**
> Un développeur ⇒ énum dans le code.
> Un administrateur ⇒ table en base.

Le prix à payer : ajouter une unité demande un redéploiement. C'est **voulu** — et pour
l'unité c'est même vital, puisque l'agrégation future des listes de courses est
impossible si l'unité est du texte libre (200 « g » + 1 « kg » ne s'additionnent pas).

## 6. Les cascades : possédé, partagé, anonymisé

Quand tu supprimes une ligne, que devient tout ce qui pointait vers elle ? Il y a trois
réponses possibles, et le schéma les utilise toutes les trois.

> **La question à se poser : sans son parent, cet objet a-t-il encore un sens ?**

| Famille       | Règle SQL            | Sens                                | Exemples                                                              |
| ------------- | -------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| **Possédé**   | `ON DELETE CASCADE`  | n'a aucun sens seul → il meurt avec | `composition`, `steps`, `review`, jonctions (côté recette)            |
| **Anonymisé** | `ON DELETE SET NULL` | garde son sens, perd son auteur     | `review → user`, `recipe → author`                                    |
| **Partagé**   | `ON DELETE RESTRICT` | vit indépendamment → on protège     | `ingredient`, `nationality`, `regime`, `health_criteria`, `food_type` |

Applique-la aux trois cas :

- **Une étape de préparation** sans sa recette ? Aucun sens. → CASCADE.
- **Un avis** dont l'auteur a supprimé son compte ? Il garde tout son sens : la note et
  le commentaire restent utiles aux autres lecteurs. → SET NULL, l'avis devient anonyme
  (UC-09b). Même logique pour une recette dont l'auteur part.
- **La farine**, quand on supprime une recette qui en utilise ? Elle est employée par
  cinquante autres recettes. → jamais touchée. Et si on tente de supprimer la farine
  elle-même alors qu'elle est utilisée, la base **refuse** (RESTRICT).

**Retiens la règle générale : une cascade ne traverse jamais une entité partagée.**
C'est la protection qui empêche une suppression de recette de saccager le référentiel.

Deux conséquences directes dans le code, à ne pas découvrir trop tard :

- **`RESTRICT` n'est pas une gêne, c'est une fonctionnalité.** Quand la base refuse, ton
  service doit traduire ce refus en `409 Conflict` — pas le laisser remonter en `500`
  (voir `design/routes-api.md` § 4.2).
- **`SET NULL` rend la colonne nullable.** Donc partout où tu affiches un auteur, le code
  doit savoir représenter un **auteur absent** sans planter. C'est un cas limite qui
  mérite un test (`docs/guides/ecrire-une-feature-api.md` § 4).

## 7. Seeds et migrations : structure contre contenu

Deux mécanismes qu'on confond souvent, alors que la frontière est nette :

- une **migration** change la **structure** (créer une table, ajouter une colonne) ;
- un **seed** insère des **données**.

Ne mets jamais d'insertion de données métier dans une migration de structure : le jour
où tu rejoues les migrations sur une base qui contient déjà ces lignes, tu récoltes des
doublons ou une erreur.

Et il y a **deux natures de seeds**, à ne pas mélanger non plus :

| Nature                   | Contenu                                  | Comment                         |
| ------------------------ | ---------------------------------------- | ------------------------------- |
| Données de **référence** | « Végan », « Halal », « Italienne »…     | listes **fixes**, à la main     |
| Données d'**exemple**    | des recettes et utilisateurs pour tester | générées avec `@faker-js/faker` |

Les données de référence sont de **vraies valeurs métier** : elles doivent être exactes,
donc écrites à la main. Générer des noms de régimes alimentaires avec faker produirait du
charabia inutilisable.

Les données d'exemple, elles, servent uniquement à **avoir du volume** pour valider la
lecture, la recherche et la pagination. Là, faker est parfait — et reste une dépendance
de **développement uniquement** : il n'a rien à faire en production.

Enfin, un seed doit être **idempotent** : le lancer deux fois ne doit pas créer les
catégories en double. Cela s'appuie sur les contraintes `UNIQUE(name)` déjà présentes
dans le schéma.

## 8. Ce qui t'attend, dans l'ordre

Le change `setup-couche-donnees` déroule exactement ce guide :

| Groupe | Ce que tu fais                   | Le concept correspondant   |
| ------ | -------------------------------- | -------------------------- |
| 2      | relire le schéma corrigé         | § 6 (cascades)             |
| 3      | configurer TypeORM               | § 1 (`synchronize: false`) |
| 4      | écrire la migration n°1          | § 2 (bootstrap)            |
| 5      | écrire les entités               | § 3 et § 4                 |
| 6      | définir les énums                | § 5                        |
| 7      | écrire les seeds                 | § 7                        |
| 8      | écrire les DTO                   | § 3                        |
| 9      | vérifier contraintes et cascades | § 6                        |

## 9. Ce qui reste à décider

Ces points sont ouverts dans `design.md` et se trancheront en chemin :

- **Les valeurs exactes** de chaque énumération (`role`, `difficulty`, `recipe_type`,
  `unit`) — à figer avant le groupe 6.
- **`UNIQUE(recipe_id, number)` sur `steps`** : confort ou contrainte trop rigide ?
- **UUID en `CHAR(36)` ou `BINARY(16)`** : lisible ou compact ? `CHAR(36)` retenu par
  défaut pour la lisibilité au démarrage.

## 10. En résumé

Le schéma n'évolue que par des migrations relues ; les entités sont la source vivante
après le bootstrap ; table, entité et DTO sont trois choses distinctes et le DTO protège
l'API ; un lien qui porte une information est une entité, pas un `@ManyToMany` ; les
valeurs qu'un développeur seul peut ajouter vivent en code, celles qu'un admin gère
vivent en base ; et chaque relation déclare explicitement si l'objet lié est possédé,
partagé ou anonymisable.
