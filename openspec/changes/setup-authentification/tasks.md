> Pré-requis : l'outillage qualité (`setup-outillage-qualite`) en place, et l'entité
> `UTILISATEUR` + la table `refresh_token` écrites (`setup-couche-donnees`).
> Posture mentor : on comprend chaque brique de sécurité avant de la coder.
> Le groupe 1 produit un guide à LIRE d'abord.
> Règle transverse : suivre la façon de faire de Nest (passport, guards, modules, DI)
> et de @nestjs/passport — ne pas réinventer ce que le framework fournit.

## 1. Comprendre avant de coder

- [ ] 1.1 Créer `docs/guides/authentification.md` expliquant simplement : pourquoi cookie httpOnly vs localStorage (la balançoire XSS/CSRF), access token court + refresh long, `SameSite` et la défense CSRF, la rotation + détection de vol (familles), les guards Jwt/Roles, la différence propriété vs rôle (anti-IDOR), Argon2
- [ ] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Pré-requis données

- [ ] 2.1 Confirmer l'entité `users` (UUID, role, email unique, password_hash)
- [ ] 2.2 Confirmer l'entité `refresh_token` (token hashé, `user_id`, `family_id`, état, `expires_at`)

## 3. Configuration & secrets

- [ ] 3.1 Définir via `@nestjs/config` : secret JWT, durée access, durée refresh, options cookie
- [ ] 3.2 Valider ces variables au démarrage (l'app refuse de démarrer si une manque)
- [ ] 3.3 Ne JAMAIS committer de secret ; fournir un `.env.example` sans valeurs réelles

## 4. Module auth à la manière de Nest

- [ ] 4.1 Scaffolder le module via le CLI Nest (`nest g module auth`, `nest g service auth`, `nest g controller auth`) — structure module/provider/DI
- [ ] 4.2 Garder le controller fin (reçoit la requête) et la logique dans le service (jamais de `req/res` dans le métier)

## 5. Mots de passe & inscription

- [ ] 5.1 Service de hachage Argon2 (hash + vérification)
- [ ] 5.2 DTO d'inscription + class-validator (email, robustesse du mot de passe)
- [ ] 5.3 Endpoint d'inscription (création de compte, mot de passe haché)

## 6. Connexion & émission des jetons

- [ ] 6.1 Vérification des identifiants (message neutre si échec)
- [ ] 6.2 Émettre l'access token (court) + le refresh token (long)
- [ ] 6.3 Déposer les deux en cookies `httpOnly` + `Secure` + `SameSite=Lax`
- [ ] 6.4 Persister le refresh **hashé** avec une nouvelle `family_id`

## 7. Repository de refresh (abstraction pour swap futur)

- [ ] 7.1 Définir l'interface du repository (créer, retrouver par hash, marquer `UTILISÉ`, révoquer famille)
- [ ] 7.2 Implémentation MySQL (TypeORM) derrière cette interface

## 8. Renouvellement, rotation & détection de vol

- [ ] 8.1 Endpoint `/refresh` : valider le refresh présenté (actif, non expiré)
- [ ] 8.2 Relire le compte/rôle en base et émettre un nouvel access token
- [ ] 8.3 Rotation : marquer l'ancien `UTILISÉ`, émettre un nouveau refresh (même famille)
- [ ] 8.4 Détection de vol : un refresh `UTILISÉ`/`RÉVOQUÉ` re-présenté → révoquer toute la famille
- [ ] 8.5 Déconnexion : révoquer la famille courante + effacer les cookies

## 9. Guards d'autorisation (façon @nestjs/passport)

- [ ] 9.1 Stratégie passport-jwt avec extracteur lisant le JWT depuis le COOKIE
- [ ] 9.2 `JwtAuthGuard` (authentifié ?) attachant l'identité à la requête
- [ ] 9.3 Décorateur `@Roles()` + `RolesGuard` (Reflector) pour l'autorisation par rôle
- [ ] 9.4 Vérifier l'héritage des rôles (admin ⊃ modérateur ⊃ utilisateur)

## 10. Contrôle de propriété (anti-IDOR)

- [ ] 10.1 Dans le service, comparer `user.id` au propriétaire pour les ressources possédées (avis, compte)
- [ ] 10.2 Distinguer explicitement propriété (UC-07/08) et rôle (UC-14) dans le code
- [ ] 10.3 Règle anti-auto-rétrogradation pour le dernier admin (UC-16)

## 11. Intégration client

- [ ] 11.1 Formulaires connexion/inscription (react-hook-form)
- [ ] 11.2 Appels API avec envoi des cookies ; aucun token stocké côté JS
- [ ] 11.3 Refresh transparent sur 401 (react-query) puis rejouer la requête

## 12. Vérification de sécurité

- [ ] 12.1 Confirmer : aucun jeton lisible en JS, cookies bien `httpOnly`/`Secure`/`SameSite=Lax`
- [ ] 12.2 Tester le scénario de vol (refresh réutilisé → famille révoquée)
- [ ] 12.3 Tester rôle insuffisant (403) et propriété (modifier l'avis d'autrui → refusé)
- [ ] 12.4 Lancer `npm run verify` → vert
