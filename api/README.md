# API — La Table Nappée

API NestJS du projet. **Installation et lancement : voir le [README à la racine](../README.md)**
(le projet est un monorepo, tout s'installe et se lance depuis la racine).

Commandes utiles, depuis la racine :

| Commande                                     | Rôle                                            |
| -------------------------------------------- | ----------------------------------------------- |
| `npm run start:dev --workspace api`          | API en rechargement à chaud (port 3000)         |
| `npm run migration:run --workspace api`      | applique les migrations sur la base de dev      |
| `npm run migration:run:test --workspace api` | applique les migrations sur la base de test     |
| `npm run seed:exemples --workspace api`      | référentiels, 3 comptes et 50 recettes          |
| `npm test --workspace api`                   | tests unitaires (Jest)                          |
| `npm run test:e2e --workspace api`           | tests e2e sur la base de test (Jest, supertest) |

Le contrat des routes est dans `design/routes-api.md`.
