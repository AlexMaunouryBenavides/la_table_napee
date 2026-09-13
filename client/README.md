# Front — La Table Nappée

Application React Router 7 en mode SPA (rendu dans le navigateur), TanStack Query pour
les données du serveur, Zustand pour le brouillon de l'éditeur, Tailwind 4.
**Installation et lancement : voir le [README à la racine](../README.md).**

Commandes utiles, depuis la racine :

| Commande                         | Rôle                                              |
| -------------------------------- | ------------------------------------------------- |
| `npm run dev --workspace client` | front en développement (http://localhost:5173)    |
| `npm test --workspace client`    | tests de composants (Vitest + Testing Library)    |
| `npm run cypress:prepare`        | prépare la base de test pour les parcours Cypress |
| `npm run test:cypress`           | lance les parcours Cypress (API et front à part)  |

Organisation : `app/routes/` (écrans, minces), un dossier par écran pour la logique
(`app/catalogue/`, `app/recette/`, `app/panneau/`…), `app/composants/` pour le partagé,
`app/requetes/` pour le cache TanStack Query, `cypress/` pour les parcours de bout en bout.
