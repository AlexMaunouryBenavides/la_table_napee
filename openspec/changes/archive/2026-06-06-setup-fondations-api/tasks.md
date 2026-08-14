> Pré-requis : outillage qualité en place. À faire avant de coder les features (le
> ValidationPipe global est requis pour que les DTO valident). Tout à la manière de
> Nest (mécanismes transverses natifs : pipes/filtres/intercepteurs/guards globaux).
> Le groupe 1 produit un guide à LIRE d'abord.

## 1. Comprendre avant de coder

- [x] 1.1 Créer `docs/guides/fondations-api.md` expliquant : ce qu'est un comportement transverse (posé une fois, appliqué partout), le rôle de chaque pièce (ValidationPipe, CORS, filtre d'exception, intercepteur de sérialisation, helmet, throttler, logger, Swagger) et POURQUOI, avec le lien CORS ↔ auth par cookie
- [x] 1.2 Présenter le guide à l'utilisateur et attendre sa validation avant de poursuivre

## 2. Configuration transverse (@nestjs/config)

- [x] 2.1 Centraliser la config via `@nestjs/config` (origine front, throttler, logs)
- [x] 2.2 Valider les variables au démarrage (refus de démarrer si une manque)

## 3. Durcissement du bootstrap (main.ts)

- [x] 3.1 Préfixe global `/api`
- [x] 3.2 `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`)
- [x] 3.3 `cookie-parser`
- [x] 3.4 CORS `credentials: true` + origine = URL du front (env), jamais `*`
- [x] 3.5 `helmet` (en-têtes de sécurité)

## 4. Erreurs cohérentes

- [x] 4.1 Filtre d'exception global → forme d'erreur unique (statut, message, timestamp, chemin)
- [x] 4.2 Aligner avec `docs/conventions/rest.md`

## 5. Sérialisation de sortie

- [x] 5.1 `ClassSerializerInterceptor` global (ou DTO de réponse explicites)
- [~] 5.2 `@Exclude` sur les champs sensibles des entités (`password_hash`, etc.) — REPORTÉ : aucune entité n'existe encore (viennent avec `setup-couche-donnees`) ; le mécanisme global est posé
- [x] 5.3 Vérifier qu'aucune réponse ne fuit un champ sensible — mécanisme vérifié actif ; couverture complète quand des entités exposeront des champs sensibles

## 6. Anti-bruteforce & journalisation

- [x] 6.1 `@nestjs/throttler` global (limites généreuses)
- [~] 6.2 Limite stricte sur le login (préparer l'intégration côté auth) — REPORTÉ : pas d'endpoint login encore ; throttler global posé, prêt à recevoir un `@Throttle` strict côté `setup-authentification`
- [x] 6.3 `nestjs-pino` : logs structurés + log des requêtes

## 7. Documentation API (Swagger, optionnel)

- [~] 7.1 `@nestjs/swagger` exposant `/api/docs` — REPORTÉ (décision : pas de Swagger pour l'instant, à ajouter quand il y aura des endpoints à documenter)
- [~] 7.2 Décider de l'exposition en production (oui / hors-prod uniquement) — décidé : reporté avec 7.1

## 8. Vérification

- [x] 8.1 Démarrer l'app : prefix, validation, CORS, en-têtes actifs
- [x] 8.2 Tester : erreur au format unique ✓, helmet ✓, CORS crédentialisé ✓, throttler ✓ (champ inconnu rejeté / réponse sans secret : à confirmer quand un endpoint à DTO/entité existera)
- [x] 8.3 Lancer `npm run verify` → vert
