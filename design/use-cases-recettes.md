# Cas d'usage & décisions de conception — Site de recettes

> Document de référence. Sert à : (1) valider le modèle de données,
> (2) tracer les diagrammes UML (Looping), (3) dériver les routes d'API
> et leurs autorisations.

---

## Les acteurs (en couches : chacun hérite du précédent)

1. **Visiteur anonyme** — non connecté, lecture seule
2. **Utilisateur connecté** — hérite du visiteur + agit sur SES données
3. **Modérateur** — hérite de l'utilisateur + gère le contenu (recettes, avis)
4. **Administrateur** — hérite du modérateur + gère les personnes et la structure

Principe directeur : **moindre privilège**. Chaque rôle n'a que les droits
strictement nécessaires à sa fonction. Plus un pouvoir peut causer de dégâts
larges/structurels, plus il est réservé à un rôle élevé.

---

## Cas d'usage par acteur

### Visiteur anonyme

| ID    | Cas d'usage                                 | Données touchées                                        |
| ----- | ------------------------------------------- | ------------------------------------------------------- |
| UC-01 | Consulter la liste des recettes             | RECETTE (lecture)                                       |
| UC-02 | Consulter le détail d'une recette (+ avis)  | RECETTE, COMPOSITION, INGREDIENT, AVIS (lecture)        |
| UC-03 | Rechercher / filtrer (multicritère) + trier | RECETTE + jonctions catégories + COMPOSITION/INGREDIENT |
| UC-04 | Créer un compte (s'inscrire)                | UTILISATEUR (création)                                  |

Note UC-03 : filtres combinables (ex : « desserts végans < 30 min »).
La recherche traverse les tables de jonction → justifie toute la modélisation N–N.
Le filtre par ingrédient passe par INGREDIENT puis COMPOSITION (pas de parcours texte).

### Utilisateur connecté (hérite : UC-01 → UC-04)

| ID     | Cas d'usage                             | Règle / précondition                  |
| ------ | --------------------------------------- | ------------------------------------- |
| UC-05  | Se connecter / se déconnecter           | vérif. mot de passe (Argon2)          |
| UC-06  | Laisser un avis (note 1–5 + texte)      | **1 seul avis par (user, recette)**   |
| UC-07  | Modifier SON avis                       | l'avis doit lui appartenir            |
| UC-08  | Supprimer SON avis                      | l'avis doit lui appartenir            |
| UC-09  | Gérer son compte (profil, mot de passe) | c'est bien son compte                 |
| UC-09b | Supprimer son propre compte             | ses avis → anonymisés (pas supprimés) |

Sécurité clé : UC-07/08/09 exigent le **contrôle de propriété au niveau de
l'objet** (vérifier que l'objet appartient au demandeur, pas juste qu'il est
connecté). Évite la faille « référence directe non sécurisée à un objet ».

### Modérateur (hérite : UC-01 → UC-09b)

| ID    | Cas d'usage                                | Données touchées                                                                    |
| ----- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| UC-10 | Accéder au panneau d'administration        | rôle modérateur ou admin                                                            |
| UC-11 | Créer une recette                          | RECETTE + COMPOSITION (+ « trouver ou créer » INGREDIENT) + jonctions + nationalité |
| UC-12 | Modifier n'importe quelle recette          | RECETTE + liens                                                                     |
| UC-13 | Supprimer n'importe quelle recette         | RECETTE + COMPOSITION/jonctions (cascade)                                           |
| UC-14 | Supprimer n'importe quel avis (modération) | AVIS (suppression)                                                                  |

Sécurité clé : UC-14 (supprimer un avis quelconque) repose sur une
autorisation **par rôle**, à distinguer d'UC-08 (supprimer son avis) qui
repose sur la **propriété**. Même opération, deux logiques d'autorisation.

Note UC-11 : à la saisie, pour chaque ingrédient tapé → logique « trouver ou
créer » dans INGREDIENT (réutiliser la ligne existante ou en créer une).

### Administrateur (hérite : UC-01 → UC-14)

| ID    | Cas d'usage                                                                   | Règle / précondition |
| ----- | ----------------------------------------------------------------------------- | -------------------- |
| UC-15 | Gérer les catégories (régimes, critères santé, types d'aliment, nationalités) | **admin seul**       |
| UC-16 | Gérer les utilisateurs (lister, changer rôle, supprimer)                      | **admin seul**       |

Sécurité critique UC-16 : la **promotion de rôle** distribue le pouvoir →
route à protéger en priorité. Prévoir une règle anti-auto-rétrogradation
(ne pas se retirer/retirer le dernier admin).

---

## Décisions de conception & conséquences techniques

| Décision                                   | Conséquence sur la base de données                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1 avis par (user, recette)                 | **Contrainte d'unicité** sur la paire (user_id, recette_id) dans AVIS                                                           |
| Avis anonymisés à la suppression du compte | Lien avis→user **nullable** + `ON DELETE SET NULL`                                                                              |
| Suppression d'une recette                  | Ses lignes de **COMPOSITION** et de jonction partent en cascade — **PAS** les ingrédients ni les catégories (entités partagées) |
| Ingrédient = entité partagée               | Table INGREDIENT (nom unique) + table COMPOSITION porteuse de quantité/unité (relation N–N enrichie)                            |
| Catégories dynamiques (gérées par admin)   | Tables REGIME, CRITERE_SANTE, TYPE_ALIMENT, NATIONALITE en base                                                                 |
| Note moyenne                               | **Non stockée** : calculée à partir des avis (DRY)                                                                              |
| Clés primaires                             | **UUID** pour UTILISATEUR (anti-énumération) ; **entiers auto-incr.** pour le reste (perf. jointures)                           |
| Mot de passe                               | Hash **Argon2** (le sel est inclus dans le hash → pas de colonne sel)                                                           |
| Difficulté & type de recette               | **Figés** dans le code (énumérations stables)                                                                                   |
| Nationalité                                | **Entité en base** (relation N–1 : 1 recette → 1 nationalité)                                                                   |

---

## En attente (additif, à greffer plus tard sans refonte)

- **Favoris** : future table de jonction UTILISATEUR ⇄ RECETTE.
  Purement additive → aucun risque à reporter.

---

## Entités identifiées (pour le modèle de données)

RECETTE · INGREDIENT · COMPOSITION (jonction enrichie recette⇄ingrédient) ·
UTILISATEUR · AVIS ·
REGIME · CRITERE_SANTE · TYPE_ALIMENT · NATIONALITE

- 3 tables de jonction (recette ⇄ régime / critère santé / type d'aliment)

### Distinction clé : entités possédées vs partagées

- **Possédées** (meurent avec leur parent) : COMPOSITION, jonctions, AVIS
- **Partagées** (survivent, réutilisées par plusieurs recettes) : INGREDIENT,
  REGIME, CRITERE_SANTE, TYPE_ALIMENT, NATIONALITE
- La cascade de suppression ne touche jamais une entité partagée.

---

## Idées de fonctionnalités futures (toutes additives sur la base actuelle)

> Chacune se greffe en AJOUTANT des tables/colonnes, sans remanier
> l'existant. Triées par simplicité d'ajout. À piocher selon l'envie,
> rien n'est obligatoire.

### Très simples (1 table de jonction ou quelques colonnes)

- **Favoris** (déjà noté) : jonction UTILISATEUR ⇄ RECETTE.

- **Listes de courses** : à partir d'une ou plusieurs recettes, générer
  une liste d'ingrédients agrégés. S'appuie DIRECTEMENT sur INGREDIENT +
  COMPOSITION qu'on vient de créer (sans eux, ce serait impossible — belle
  preuve que la refonte ingrédient valait le coup). Table LISTE_COURSES
  - jonction vers INGREDIENT.

- **Réponses des modérateurs aux avis** : un modérateur/auteur répond à un
  avis. Colonne `parent_avis_id` nullable dans AVIS (auto-référence), ou
  petite table REPONSE_AVIS. Additif.

- **Signalement d'un avis** : un utilisateur signale un avis inapproprié,
  le modérateur traite. Table SIGNALEMENT (qui, quel avis, motif, statut).
  Alimente naturellement UC-14 (modération).

- **Tags libres** (mots-clés « rapide », « économique », « de saison ») :
  même patron exact que tes catégories — table TAG + jonction N–N.
  Tu sais déjà faire, c'est ta 4e jonction du même type.

### Simples (quelques tables)

- **Collections / menus** : l'utilisateur regroupe des recettes en
  « Repas de Noël », « Batch cooking »… Table COLLECTION (appartient à un
  user) + jonction COLLECTION ⇄ RECETTE. Cousine des favoris en plus riche.

- **Historique de consultation** : « recettes vues récemment ». Table
  HISTORIQUE (user, recette, date). Purement additif.

- **Suivre un autre utilisateur / un auteur** : jonction UTILISATEUR ⇄
  UTILISATEUR (auto-référence N–N). Ouvre la voie à un fil d'actualité.

- **Photos d'avis** : les utilisateurs ajoutent des photos de leur
  réalisation. Table PHOTO_AVIS (un avis → plusieurs photos). Additif.

### Moyennes (logique applicative en plus de la base)

- **Variantes d'une recette** : « version sans gluten de … ». Colonne
  `recette_parente_id` nullable dans RECETTE (auto-référence). Additif
  côté base, mais demande de la réflexion UX.

- **Système de portions dynamiques** : recalculer les quantités selon le
  nombre de convives. AUCUNE nouvelle table — c'est du calcul à la volée
  sur COMPOSITION (quantité × ratio). Encore un bénéfice direct de la
  refonte ingrédient/composition.

- **Recherche par ingrédients disponibles** : « qu'est-ce que je peux
  cuisiner avec ce que j'ai ? ». Aucune table nouvelle, repose entièrement
  sur INGREDIENT + COMPOSITION. Pur travail de requête.

### À surveiller (additif MAIS demande prudence)

- **Notifications** : table NOTIFICATION additive, mais attention, ça
  introduit une logique d'événements qui peut vite grossir. Commencer
  minimal si un jour tu t'y mets.

- **Internationalisation (recettes en plusieurs langues)** : ATTENTION —
  ce n'est PAS purement additif. Traduire titres/étapes/ingrédients
  toucherait la structure de tables existantes (RECETTE, INGREDIENT).
  À penser TÔT si c'est un objectif, sinon migration lourde plus tard.
  Signalé ici par honnêteté, pas recommandé en ajout tardif.

---

### Note de méthode

Toutes les features ci-dessus (sauf l'i18n signalée) sont additives parce
que la base actuelle a été bien normalisée : entités partagées isolées,
relations N–N via jonctions. C'est CE travail de conception qui rend ces
évolutions faciles. Une base mal pensée fermerait la moitié de ces portes.
