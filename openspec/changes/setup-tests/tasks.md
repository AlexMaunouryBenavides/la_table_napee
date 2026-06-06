> Pré-requis : outillage qualité, fondations API, données et auth en place (de quoi
> écrire un vrai test fumée). À faire avant les features. Façon Nest : Jest +
> `Test.createTestingModule`, `supertest` pour les e2e. Le groupe 1 produit un guide
> à LIRE d'abord.

## 1. Comprendre avant de coder

- [ ] 1.1 Créer `docs/guides/tests.md` expliquant : la différence unitaire vs e2e (et quand utiliser chacun), pourquoi une base de test ISOLÉE, le rôle des factories/fixtures, la règle « tester un comportement, pas l'implémentation », et pourquoi `verify` et `test` restent séparés
- [ ] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Configuration Jest

- [ ] 2.1 Profil unitaire (services isolés, dépendances mockées)
- [ ] 2.2 Profil e2e (app Nest réelle + `supertest`)
- [ ] 2.3 Scripts `test`, `test:e2e`, `test:watch`

## 3. Base de données de test isolée

- [ ] 3.1 Configurer une base de test dédiée via l'environnement (URL distincte, jamais dev/prod)
- [ ] 3.2 Appliquer les migrations sur la base de test avant les e2e
- [ ] 3.3 Stratégie de remise à zéro entre exécutions (truncate ou recréation)

## 4. Utilitaires de test

- [ ] 4.1 Factories construites sur les entités réelles (données valides paramétrables)
- [ ] 4.2 Fixtures pour les jeux de données connus
- [ ] 4.3 Helpers : `Test.createTestingModule`, app e2e jetable, utilitaire d'auth pour les requêtes protégées

## 5. Test fumée (valider le harnais)

- [ ] 5.1 Un test unitaire simple (un service existant)
- [ ] 5.2 Un test e2e simple (un endpoint existant, ex. health ou login)
- [ ] 5.3 Confirmer que les deux profils tournent et que la base de test est bien isolée

## 6. Intégration CI

- [ ] 6.1 Ajouter l'exécution des tests (unit + e2e) au workflow, APRÈS `verify`
- [ ] 6.2 Vérifier que le merge est bloqué si un test échoue

## 7. Vérification

- [ ] 7.1 Lancer `npm run test` et `npm run test:e2e` → vert
- [ ] 7.2 Lancer `npm run verify` → vert
