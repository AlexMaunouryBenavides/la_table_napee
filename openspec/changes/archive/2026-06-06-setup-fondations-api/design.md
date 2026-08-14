## Context

L'API NestJS n'a encore que le squelette par défaut. Avant de coder des features
(tranches verticales par cas d'usage), il faut poser les comportements transverses
appliqués à TOUTES les requêtes. Ces réglages vivent dans le bootstrap (`main.ts`)
et le module racine, à la manière de Nest (pipes/filtres/intercepteurs/guards
globaux). Ce change ne contient aucune logique métier.

## Goals / Non-Goals

**Goals :**

- Sécurité et cohérence **par défaut** (validation, sérialisation, erreurs, en-têtes).
- Rendre l'auth par cookie fonctionnelle de bout en bout (CORS crédentialisé).
- Respecter la façon de faire de Nest (mécanismes transverses natifs).

**Non-Goals :**

- Logique métier des features (à venir, par cas d'usage).
- Déploiement (Docker/Traefik/CI) — exploration future.
- Auth elle-même (`setup-authentification`) ; ici on ne pose que CORS/cookies et le
  throttler du login.

## Decisions

### D1 — ValidationPipe global strict

`whitelist: true` (retire les champs non déclarés), `forbidNonWhitelisted: true`
(rejette les champs en trop), `transform: true` (typage des entrées). Raison :
applique « ne pas faire confiance au client » à toute l'API d'un coup, sans le
répéter par controller.

### D2 — CORS crédentialisé, origine restreinte

CORS avec `credentials: true` et `origin` = URL du front lue depuis l'environnement
(pas `*`). Raison : les cookies httpOnly ne circulent en cross-origin que si CORS
autorise les credentials ET une origine précise. Couplé à la contrainte « même
domaine enregistrable » de l'auth (`SameSite`).

### D3 — Erreurs REST uniformes (filtre d'exception global)

Un filtre global produit une forme d'erreur unique (statut, message, timestamp,
chemin). Raison : un client doit recevoir des erreurs prévisibles ; cohérent avec
`docs/conventions/rest.md`.

### D4 — Sérialisation de sortie sûre

`ClassSerializerInterceptor` global + `@Exclude` sur les champs sensibles (ou DTO de
réponse explicites). Raison : « DTO ≠ colonnes » vaut aussi en SORTIE — un
`return user` ne doit jamais exposer `password_hash` ni un champ interne.

**Alternative considérée :** DTO de réponse explicites partout (plus verbeux mais
très clair) — compatible, à panacher selon les cas.

### D5 — Durcissement : helmet + throttler

`helmet` pose des en-têtes de sécurité ; `@nestjs/throttler` limite le débit, avec
une limite stricte sur le login (anti-bruteforce). Raison : protections standard,
posées globalement.

### D6 — Journalisation structurée (pino)

`nestjs-pino` pour des logs structurés + corrélation de requêtes. Raison : utile dès
maintenant et indispensable le jour du VPS.

### D7 — Documentation API (Swagger) pliée ici

`@nestjs/swagger` expose `/api/docs`. Raison : explorer/tester l'API manuellement,
fort signal de sérieux ; léger à poser, décoré par endpoint ensuite.

### D8 — Tout via @nestjs/config, validé au démarrage

URL front, origines CORS, paramètres throttler, niveaux de log lus de
l'environnement et validés au boot. Raison : aucun secret/URL en dur (priorité n°2).

## Risks / Trade-offs

- **CORS mal configuré** → soit l'auth casse (cookies bloqués), soit trop permissif
  (`*` + credentials interdit par la spec). Mitigation : origine explicite via env.
- **Sérialisation oubliée sur une réponse** → fuite de champ sensible. Mitigation :
  intercepteur GLOBAL + `@Exclude` sur les entités sensibles, testé.
- **Throttler trop strict** → gêne les utilisateurs légitimes. Mitigation : limites
  généreuses en global, strictes seulement sur le login.
- **Logs verbeux/bruyants** → pino en niveau adapté par environnement.

## Migration Plan

1. Durcir `main.ts` (prefix, ValidationPipe, cookie-parser, CORS, helmet).
2. Ajouter le filtre d'exception et l'intercepteur de sérialisation globaux.
3. Throttler (+ login) et logger pino.
4. Swagger (optionnel) sur `/api/docs`.
5. Brancher `@nestjs/config` + validation des variables.

**Rollback :** réglages concentrés dans le bootstrap/module racine ; retrait =
enlever les enregistrements globaux.

## Open Questions

- Sérialisation : intercepteur global + `@Exclude` vs DTO de réponse explicites
  partout (ou panachage) ?
- Limites exactes du throttler (global vs login).
- Swagger exposé aussi en production, ou seulement hors-prod ?
