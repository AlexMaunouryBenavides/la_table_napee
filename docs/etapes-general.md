Etapes ESSENTIELS a la reation d un projet full stack :

CONCEPTION (une fois)

- use cases
- modélisation de la base de données
- contrat des routes de l'API (dérivé des use cases)
- maquette front

MISE EN PLACE (une fois)

- installation du monorepo
- outillage qualité ( eslint, prettiern husky, commitLint, kit)
- fondations transverses de l'API (CORS, helmet, throttler, validation globale, configuration par variables d environnement, filtre d exeption globale)
- création de la base de données (+ docker)
- Creation du CI
- les entités
- migration initiale : le DDL devient la migration n°1
- les seeds (données de référence = obligatoires / données d'exemple = confort)
- authentification et rôles

PAR FEATURE (en boucle)

- contrat d'entrée (DTO)
- logique métier (service)
- controller + routes

FRONT (en boucle, par écran)

- consommer l'API, pages et navigation, formulaires

MISE EN LIGNE

- déploiement (nom de domaine, variables de production, hébergement)
