## Why

Chaque endpoint de l'API va dépendre de comportements **transverses** qui se posent
UNE fois au démarrage de l'app : validation des entrées, CORS (indispensable pour
l'auth par cookie entre front et API), erreurs cohérentes, sérialisation des sorties
(ne jamais exposer un champ sensible), en-têtes de sécurité, anti-bruteforce,
journalisation. Les poser AVANT de coder les features évite de réécrire chaque
controller plus tard et garantit que la sécurité et la cohérence sont par défaut.

## What Changes

- **Validation globale** : `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`,
  `transform`) → les DTO valident vraiment, les champs inconnus sont rejetés.
- **CORS + cookies** : CORS avec `credentials: true` et origine = URL du front (env),
  `cookie-parser` → cohérent avec l'auth `SameSite`/httpOnly.
- **Préfixe `/api`** global.
- **Erreurs REST cohérentes** : filtre d'exception global → forme d'erreur unique
  (statut, message, timestamp, chemin).
- **Sérialisation de sortie** : `ClassSerializerInterceptor` global / DTO de réponse
  → `password_hash` et champs internes JAMAIS exposés (le pendant en SORTIE de
  « DTO ≠ colonnes »).
- **Durcissement** : `helmet` (en-têtes) + `@nestjs/throttler` (anti-bruteforce,
  strict sur le login).
- **Journalisation structurée** : `nestjs-pino` + log des requêtes.
- **Doc API (optionnel, plié ici)** : `@nestjs/swagger` exposant `/api/docs` pour
  explorer/tester l'API.
- **Config** : tout via `@nestjs/config`, validée au démarrage (aucun secret en dur).

## Capabilities

### New Capabilities

- `api-foundations` : les comportements transverses de l'API (validation, CORS,
  erreurs, sérialisation, sécurité, journalisation, doc) — la plateforme sur laquelle
  toutes les features s'appuient.

### Modified Capabilities

<!-- Aucune capacité de spec existante n'est modifiée. -->

## Impact

- **`api/`** : `main.ts` (bootstrap durci), `app.module` (pipes/filtres/intercepteurs
  globaux, throttler, config, logger), filtre d'exception, intercepteur de
  sérialisation, éventuel setup Swagger.
- **Dépendances** : ce change suit l'outillage et précède (ou accompagne) les features.
  Le `ValidationPipe` global est requis pour que les DTO écrits ailleurs valident.
- **Sécurité** : applique les priorités du projet (ne pas faire confiance au client,
  aucun secret en dur) au niveau de la plateforme, par défaut.
