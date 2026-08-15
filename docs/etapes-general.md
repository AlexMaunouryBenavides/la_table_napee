Etapes ESSENTIELS a la reation d un projet full stack :

CONCEPTION (une fois)

- use cases
- modélisation de la base de données
- contrat des routes de l'API (dérivé des use cases)
- maquette front

MISE EN PLACE (une fois)

- installation du monorepo
- fondations transverses de l'API (CORS, helmet, throttler, validation globale…)
- création de la base de données (+ docker)
- migration initiale : le DDL devient la migration n°1
- les entités
- les seeds (données de référence = obligatoires / données d'exemple = confort)
- authentification et rôles

PAR FEATURE (en boucle)

- contrat d'entrée (DTO)
- logique métier (service)
- controller + routes

FRONT (en boucle, par écran)

- consommer l'API, pages et navigation, formulaires

MISE EN LIGNE

- déploiement (build, variables d'environnement, hébergement)
