# Guide — Les fondations transverses de l'API

> À lire **avant** la mise en place. Ce guide explique le _pourquoi_ et le _comment_
> des comportements transverses de l'API. Les règles vivent dans `docs/conventions/`
> (notamment `nest.md` et `rest.md`) ; ici on apprend.

## 1. Un « comportement transverse », c'est quoi ?

C'est une règle qui s'applique à **toutes les requêtes**, peu importe l'endpoint :
valider l'entrée, renvoyer une erreur au bon format, ne jamais fuiter un mot de
passe, poser des en-têtes de sécurité, limiter le débit, journaliser…

L'idée centrale : **on la pose UNE fois, au démarrage de l'app, pas dans chaque
controller.** Sinon, chaque nouvelle feature devrait penser à re-valider, re-sécuriser,
re-formater ses erreurs — et un oubli = une faille. En centralisant, **la sécurité et
la cohérence sont acquises par défaut**, et les features se concentrent sur le métier.

C'est l'application directe de la priorité n°2 (sécurité) au niveau de la _plateforme_.

## 2. Où ça vit dans Nest

Deux endroits, et deux seulement :

- **`main.ts`** (le _bootstrap_) : ce qui se règle sur l'instance de l'app au boot —
  préfixe d'URL, `ValidationPipe` global, CORS, `cookie-parser`, `helmet`.
- **le module racine** (`app.module.ts`) : ce qui s'enregistre comme _provider global_
  — filtre d'exception, intercepteur de sérialisation, throttler, config, logger.

À la manière de Nest, on n'invente rien : on utilise ses **mécanismes transverses
natifs** (pipes, filtres, intercepteurs, guards) en version _globale_.

## 3. Le trajet d'une requête (pour situer chaque pièce)

Comprendre l'ordre d'exécution rend tout le reste limpide :

```
Requête
  │
  ▼
[helmet / CORS]        en-têtes & autorisation cross-origin (avant Nest)
  │
  ▼
[Guard]               a-t-on le droit d'entrer ? (auth/rôles — viendra plus tard)
  │
  ▼
[Interceptor (avant)] démarre le chrono, prépare la transformation de sortie
  │
  ▼
[Pipe]                VALIDE et transforme l'entrée (ValidationPipe)
  │
  ▼
[Handler]             ton code (controller → service)
  │
  ▼
[Interceptor (après)] SÉRIALISE la sortie (retire les champs sensibles)
  │
  ▼
Réponse        ── en cas d'exception n'importe où ──▶ [Exception Filter] (forme l'erreur)
```

Chaque pièce ci-dessous correspond à une étape de ce trajet.

## 4. Chaque pièce, et POURQUOI

### `ValidationPipe` global — la frontière de confiance

Valide **toute** entrée client contre son DTO, avant qu'elle n'atteigne le métier.
Réglages clés :

- `whitelist` : retire les champs non déclarés dans le DTO.
- `forbidNonWhitelisted` : rejette carrément la requête si elle contient un champ en
  trop (plus strict, plus sûr).
- `transform` : convertit l'entrée dans les types attendus (ex. `"3"` → `3`).

**Pourquoi global ?** « Ne jamais faire confiance au client » devient vrai partout
d'un coup, sans le répéter dans chaque controller. Rappel : TypeScript ne protège
**pas** au runtime — un body JSON peut mentir ; la validation, si.

### CORS crédentialisé + `cookie-parser` — le lien avec l'auth par cookie

C'est le point le plus subtil, alors prenons-le posément.

Le front (`client`) et l'API (`api`) sont sur des **origines différentes**. Par
défaut, un navigateur **bloque** les requêtes cross-origin. CORS est le mécanisme qui
dit « j'autorise telle origine ».

Pour une auth par **cookie httpOnly**, il ne suffit pas d'autoriser l'origine : il
faut autoriser les **credentials** (`credentials: true`). Et la règle du navigateur
est stricte : on **ne peut pas** combiner `credentials: true` avec une origine joker
`*`. Il faut donc déclarer **l'origine exacte du front** (lue depuis l'environnement,
jamais en dur).

- `credentials: true` + `origin = <URL du front>` → les cookies circulent.
- `cookie-parser` → l'API sait _lire_ les cookies entrants.

Sans ça, l'auth (change suivant) ne marchera tout simplement pas : les cookies seront
silencieusement ignorés. On pose donc la plomberie maintenant.

### Préfixe global `/api`

Toutes les routes sous `/api` (ex. `/api/recettes`). Sépare proprement l'API du reste
(front, docs) et simplifie le reverse-proxy le jour du déploiement.

### Filtre d'exception global — des erreurs prévisibles

Quoi qui échoue (validation, autorisation, bug serveur), le client reçoit **la même
structure** : statut, message, horodatage, chemin. Cohérent avec
`docs/conventions/rest.md` (« le code de statut EST l'information », pas de détail
interne fuité). Évite les `try/catch` éparpillés.

### `ClassSerializerInterceptor` global — « DTO ≠ colonnes » en SORTIE

On sait qu'il ne faut pas faire confiance à l'entrée. Le pendant en **sortie** : un
`return user` ne doit **jamais** exposer `password_hash` ou un champ interne. Cet
intercepteur applique les décorateurs `@Exclude()` posés sur les entités, pour filtrer
automatiquement la réponse.

> ⚠️ Aujourd'hui il n'y a pas encore d'entités : on pose le **mécanisme** global
> maintenant ; les `@Exclude` sur les champs sensibles arriveront avec la couche
> données.

### `helmet` — les en-têtes de sécurité

Pose une série d'en-têtes HTTP qui durcissent le navigateur (anti-clickjacking,
nosniff, etc.). Une ligne, beaucoup de surface d'attaque en moins.

### `@nestjs/throttler` — l'anti-bruteforce

Limite le nombre de requêtes par fenêtre de temps. **Généreux en global** (ne pas
gêner les utilisateurs légitimes), **strict sur le login** (empêcher d'essayer 10 000
mots de passe). La limite stricte du login se branchera avec l'auth ; ici on pose le
throttler global.

### `nestjs-pino` — les logs structurés

Des logs en JSON (lisibles par une machine) avec corrélation de requêtes, plutôt que
des `console.log` épars. Utile maintenant, indispensable le jour du serveur.

### `@nestjs/swagger` — la doc qui se teste (optionnel)

Expose `/api/docs` : une interface pour explorer et tester l'API à la main, générée
depuis les DTO. Léger à poser, fort signal de sérieux.

### `@nestjs/config` — la config validée au démarrage

URL du front, origines CORS, paramètres throttler, niveaux de log : **tout** vient de
l'environnement, **rien** en dur (priorité n°2). Et on **valide au boot** : si une
variable requise manque, l'app **refuse de démarrer** avec une erreur claire — mieux
vaut un crash immédiat et explicite qu'un bug sournois en production.

## 5. Ce que ce change ne fait PAS

- Pas de logique métier (les features viendront par cas d'usage).
- Pas l'auth elle-même (`setup-authentification`) : on ne pose ici que CORS/cookies et
  le throttler, prêts à l'accueillir.
- Pas le déploiement (Docker/CI) : différé, mais la config 12-factor le prépare.

## 6. En résumé

Après ce change, **toute** requête qui entre dans l'API est validée, autorisée en
cross-origin pour le front, sécurisée par des en-têtes, limitée en débit, journalisée ;
et **toute** réponse qui sort est filtrée des champs sensibles et, en cas d'erreur,
mise au format unique. Les features n'auront plus à y penser : c'est la plateforme.
