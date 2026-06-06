> Pré-requis : outillage qualité en place. À faire avant de coder les features (le
> ValidationPipe global est requis pour que les DTO valident). Tout à la manière de
> Nest (mécanismes transverses natifs : pipes/filtres/intercepteurs/guards globaux).
> Le groupe 1 produit un guide à LIRE d'abord.

## 1. Comprendre avant de coder

- [ ] 1.1 Créer `docs/guides/fondations-api.md` expliquant : ce qu'est un comportement transverse (posé une fois, appliqué partout), le rôle de chaque pièce (ValidationPipe, CORS, filtre d'exception, intercepteur de sérialisation, helmet, throttler, logger, Swagger) et POURQUOI, avec le lien CORS ↔ auth par cookie
- [ ] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Configuration transverse (@nestjs/config)

- [ ] 2.1 Centraliser la config via `@nestjs/config` (origine front, throttler, logs)
- [ ] 2.2 Valider les variables au démarrage (refus de démarrer si une manque)

## 3. Durcissement du bootstrap (main.ts)

- [ ] 3.1 Préfixe global `/api`
- [ ] 3.2 `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
- [ ] 3.3 `cookie-parser`
- [ ] 3.4 CORS `credentials: true` + origine = URL du front (env), jamais `*`
- [ ] 3.5 `helmet` (en-têtes de sécurité)

## 4. Erreurs cohérentes

- [ ] 4.1 Filtre d'exception global → forme d'erreur unique (statut, message, timestamp, chemin)
- [ ] 4.2 Aligner avec `docs/conventions/rest.md`

## 5. Sérialisation de sortie

- [ ] 5.1 `ClassSerializerInterceptor` global (ou DTO de réponse explicites)
- [ ] 5.2 `@Exclude` sur les champs sensibles des entités (`password_hash`, etc.)
- [ ] 5.3 Vérifier qu'aucune réponse ne fuit un champ sensible

## 6. Anti-bruteforce & journalisation

- [ ] 6.1 `@nestjs/throttler` global (limites généreuses)
- [ ] 6.2 Limite stricte sur le login (préparer l'intégration côté auth)
- [ ] 6.3 `nestjs-pino` : logs structurés + log des requêtes

## 7. Documentation API (Swagger, optionnel)

- [ ] 7.1 `@nestjs/swagger` exposant `/api/docs`
- [ ] 7.2 Décider de l'exposition en production (oui / hors-prod uniquement)

## 8. Vérification

- [ ] 8.1 Démarrer l'app : prefix, validation, CORS, en-têtes actifs
- [ ] 8.2 Tester : champ inconnu rejeté, erreur au format unique, réponse sans secret
- [ ] 8.3 Lancer `npm run verify` → vert
