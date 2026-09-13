# Écarts entre les écrans et les maquettes

> Audit du 2026-09-13 : chaque écran réel (1280 px) comparé à sa planche desktop de
> `design_handoff_la_table_nappee/maquettes/`. Tous les écrans fonctionnent, **aucun
> n'est conforme** : le rendu a été simplifié partout.
>
> Travail purement visuel : pas de nouveaux tests, les tests existants restent verts.
> Un écran se coche après comparaison côte à côte avec sa planche.

## Hors périmètre — l'API ne le porte pas

Ces éléments de maquette restent absents, sciemment : nombre d'avis sur les cartes et
les lignes, tri « mieux notées », compteurs par rôle, colonne « recettes rattachées »,
« Être prévenu par e-mail », téléversement d'image, recherche et filtre de rôle sur les
comptes, colonne « Avis » des comptes, liens « Mentions légales · Contact ».

## Lot 1 — composants partagés

- [x] **En-tête du site** : lien « Accueil » manquant ; lien actif souligné (trait
      ardoise) ; Connexion en bouton fantôme et Inscription en bouton primaire ;
      connecté → pastille lavande à l'initiale au lieu de « pseudo + Se déconnecter » ;
      placeholder « Rechercher une recette… » ; logo plus petit.
- [x] **Carte recette** : badge du type en haut à gauche de l'image ; vraie image quand
      `image` est renseignée (aplat sinon) ; méta complète — préparation, cuisson,
      portions, difficulté, nationalité ; bordure `trait`.
- [x] **Pied de page** : une ligne « La Table Nappée · 2026 », fond nappe, filet haut.
- [x] **Coquille du panneau** : logo sur une ligne ; section « Site » avec « Voir le site
      public » ; bloc du bas pseudo + e-mail + étiquette du rôle + « Se déconnecter ».

> Côté public, « Se déconnecter » a quitté l'en-tête (la maquette n'y met que
> l'avatar) : il vit dans le menu latéral de « Mon compte » (lot 2, fait).

## Lot 2 — écrans publics

- [x] **01 Accueil** : héros deux colonnes avec assiette ronde lavande ; titre sur deux
      lignes sans point final ; bande lavande « Six familles de recettes » + bouton
      « Explorer » au lieu des pastilles.
- [x] **02 Catalogue** (visuel) : en-tête « N recettes au catalogue » ; rangée « Actifs »
      de chips retirables + « Tout effacer » + compteur ; panneau « Filtres / Tout
      effacer » à filets ; régimes et critères santé en cases à cocher ; pagination
      encadrée avec résumé à droite (composant partagé).
  - [x] Sélecteur de tri (5 tests) : les quatre tris que l'API accepte, défaut
        « Plus récentes », tri inconnu dans l'URL ramené au défaut.
  - [x] Curseur de temps 10–180 min par pas de 5 (6 tests) : au maximum, pas de
        filtre ; valeur hors bornes dans l'URL ramenée au maximum.
  - [ ] **Reste, avec tests** : titre composé des filtres (« Plats _végans_ »).
- [x] **03 Détail** : fil d'Ariane ; sur-titre « TYPE · NATIONALITÉ » ; ligne « Par X ·
      publiée le … » ; rangée de méta séparée par des filets verticaux (valeur en
      Cormorant) ; nationalité parmi les chips ; titres « Étapes » (pas
      « Préparation »), « Avis · N » ; formulaire d'avis sur fond lavande ; avis en
      cartes avec pastille d'initiale.
- [x] **04 Connexion** : titre « Se _connecter_ » ; « Pas encore de compte ? Créer un
      compte » sous le titre ; filet + note « Mot de passe oublié ? Contactez
      l'équipe… » ; colonne verte : accroche « Retrouvez vos avis et _vos recettes_ » +
      note « Aucun jeton n'est stocké… ».
- [x] **05 Inscription** : titre « Créer un _compte_ » ; « Déjà inscrit ? Se connecter »
      sous le titre ; aides d'e-mail et de pseudo ; note sur le rôle ; colonne verte :
      « Un compte, pour _donner votre avis_ » + liste à puces + note « Nous ne
      demandons ni nom… ».
  - [ ] **Reste, avec tests** (04 et 05) : bouton « Afficher » dans le mot de passe.
- [x] **06 Mon compte** : menu latéral (Profil, Mot de passe, Supprimer mon compte, Se
      déconnecter) ; sur-titre « Compte utilisateur » ; « Bonjour, _pseudo_ » + étiquette
      de rôle à droite ; profil en deux colonnes ; ligne Rôle · Compte créé le ·
      Identifiant ; zone de suppression en fond erreur.

## Lot 3 — panneau et erreurs

- [x] **07 Tableau de bord** : sur-titre « Panneau » + bouton « Nouvelle recette » ;
      tuiles sur une rangée de 4 ; « Dernières recettes » (tableau encadré avec
      vignettes) et « Raccourcis » côte à côte ; note d'info sur le rôle.
- [x] **08 Recettes** : fil d'Ariane ; barre d'outils (recherche, selects encadrés,
      compteur) ; tableau encadré, vignettes, colonne auteur ; boutons « Modifier » et
      « Suppr. » ; pagination avec résumé.
- [x] **09 Éditeur** : fil d'Ariane + date de création ; colonne principale en
      `fieldset` titrés + aside collante (Image, Récapitulatif, Publication) ; unité
      « min » dans les champs de temps ; catégories en chips.
- [x] **10 Utilisateurs** : fil d'Ariane ; tableau encadré, pastille d'initiale, étiquette
      « vous » ; bouton « Supprimer » ; pagination avec résumé.
- [x] **11 Catégories** : fil d'Ariane ; onglets soulignés (pas en pilules) ; tableau
      encadré avec boutons « Renommer » ; carte « Ajouter » et carte « Contrat commun »
      à droite.
- [x] **12 404 · 13 403 · 14 Erreur** (visuel) : code en ardoise ; actions en liens
      habillés en boutons (`LienBouton`) ; texte recentré.
  - [ ] **Reste, avec tests** : suggestions de recettes issues des mots de l'URL (404).
