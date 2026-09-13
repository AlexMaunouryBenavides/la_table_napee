# Inventaire des écrans — front

> Dérivé de `design/use-cases-recettes.md` et `design/routes-api.md`. **Aucun écran
> n'existe sans route derrière lui**, et aucune route du contrat n'est orpheline.
>
> Ce document dit CE QU'IL FAUT dessiner puis construire. Le « comment » côté code
> vient de `eng-kit/rules/architecture/react.md` et `frontend/data-fetching.md`.

---

## Les écrans, par acteur

### Visiteur anonyme

| #   | Écran                 | Routes API consommées                         | UC          |
| --- | --------------------- | --------------------------------------------- | ----------- |
| 1   | Accueil               | `GET /recettes?limite=…` (mise en avant)      | UC-01       |
| 2   | Catalogue / recherche | `GET /recettes` + les 4 listes de catégories  | UC-01/UC-03 |
| 3   | Détail d'une recette  | `GET /recettes/:id`, `GET /recettes/:id/avis` | UC-02       |
| 4   | Connexion             | `POST /auth/connexion`                        | UC-05       |
| 5   | Inscription           | `POST /auth/inscription`                      | UC-04       |

### Utilisateur connecté

| #   | Écran      | Routes API consommées                                               | UC            |
| --- | ---------- | ------------------------------------------------------------------- | ------------- |
| 6   | Mon compte | `GET`/`PATCH`/`DELETE /utilisateurs/moi`, `PATCH /moi/mot-de-passe` | UC-09, UC-09b |

Le dépôt, la modification et la suppression de SON avis (UC-06/07/08) n'ont pas
d'écran propre : ils vivent **dans le détail de la recette**, là où l'avis a un sens.

### Modérateur

| #   | Écran              | Routes API consommées                                                    | UC          |
| --- | ------------------ | ------------------------------------------------------------------------ | ----------- |
| 7   | Panneau — accueil  | aucune (coquille + navigation)                                           | UC-10       |
| 8   | Panneau — recettes | `GET /recettes`, `DELETE /recettes/:id`                                  | UC-13       |
| 9   | Éditeur de recette | `POST`/`PATCH /recettes`, `GET /ingredients`, les 4 listes de catégories | UC-11/UC-12 |

La modération d'un avis (UC-14) se fait **depuis le détail de la recette** : le
contrat n'expose pas de `GET /avis` global, il n'y a donc pas de file de modération.

### Administrateur

| #   | Écran                  | Routes API consommées                                                           | UC    |
| --- | ---------------------- | ------------------------------------------------------------------------------- | ----- |
| 10  | Panneau — utilisateurs | `GET /utilisateurs`, `PATCH /utilisateurs/:id/role`, `DELETE /utilisateurs/:id` | UC-16 |
| 11  | Panneau — catégories   | `GET`/`POST`/`PATCH`/`DELETE` sur les 4 ressources                              | UC-15 |

### Écrans système

| #   | Écran              | Quand                                                    |
| --- | ------------------ | -------------------------------------------------------- |
| 12  | 404 — introuvable  | recette ou URL inconnue                                  |
| 13  | 403 — accès refusé | rôle insuffisant (l'API répond 403, pas une redirection) |
| 14  | Erreur inattendue  | 5xx, API injoignable                                     |

**Total : 14 écrans**, dont 5 publics.

---

## Ce qu'aucun écran ne doit montrer

Ces fonctionnalités **n'existent pas dans l'API** : les dessiner créerait une dette
immédiate.

- **Favoris** — reporté par le design, aucune route.
- **« Mes avis »** — il n'existe aucune route pour lister les avis d'un utilisateur.
- **File de modération globale des avis** — pas de `GET /avis`.
- **Note moyenne dans les listes** — `RecetteResume.noteMoyenne` existe mais vaut
  toujours `null` aujourd'hui (décision reportée : une seule requête d'agrégation,
  jamais une par recette). Prévoir l'emplacement, prévoir l'absence.
- **Inscription en tant que modérateur/admin** — le rôle ne s'attribue jamais depuis
  le client.

---

## Là où le handoff de maquettes se trompe

Le paquet `design_handoff_la_table_nappee/` a été dessiné APRÈS l'API, mais sans la
lire jusqu'au bout. **Le projet fait foi ; le handoff s'adapte.** Les écarts relevés
en construisant les écrans :

| Le handoff dit                                       | La réalité                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /authentification/connexion`                   | c'est `/auth/connexion`                                                                                                                                   |
| `GET /avis` global, file de modération               | n'existe pas                                                                                                                                              |
| `POST /ingredients`                                  | n'existe pas : seul `GET /ingredients` est au contrat, donc pas de création à la volée                                                                    |
| Filtres `typeRecette`, `tempsTotalMax`, des pluriels | `type`, `tempsMax`, et `regime`/`critereSante`/`typeAliment` au singulier, répétables                                                                     |
| `tri=noteMoyenne`                                    | n'existe pas : `dateCreation`, `titre`, `tempsPreparation`, avec `-` pour décroissant                                                                     |
| Difficulté et type en choix multiple                 | l'API les valide par `@IsIn` sans `each` : **une seule valeur**, sinon 400                                                                                |
| « adresse déjà utilisée » sur le champ e-mail        | l'API répond 409 « Email ou pseudo déjà utilisé », sans dire lequel : message global uniquement                                                           |
| Inscription → « connecté immédiatement »             | `POST /auth/inscription` ne pose **aucun cookie**. Créer un compte et ouvrir une session sont deux actes distincts : après le 201, on envoie se connecter |
| Avis d'une recette paginés                           | l'API les renvoie tous, et déjà inclus dans `GET /recettes/:id`                                                                                           |

## Contraintes qui traversent tous les écrans

- **Authentification par cookie `httpOnly`** : aucun jeton n'est lisible en JS, donc
  aucun écran ne l'affiche, ne le stocke ni ne propose de « se souvenir de moi ».
  L'état « connecté » se déduit de `GET /utilisateurs/moi`.
- **Trois états par chargement** : en cours, vide, en erreur. Une liste vide n'est pas
  une erreur, et ce n'est pas non plus un écran blanc.
- **Formulaires** : l'API renvoie `{ statusCode, message, details[] }`. Le tableau
  `details` porte les erreurs de validation champ par champ — les écrans doivent
  savoir les afficher.
- **Listes paginées** : `{ donnees, total, page, limite }`, `limite` plafonnée à 100.
  Font exception les 4 listes de catégories et les avis d'une recette, renvoyés en
  tableau nu parce qu'ils sont courts et servent à construire des filtres.
- **Le français est la langue de l'URL, du JSON et de l'interface.**
