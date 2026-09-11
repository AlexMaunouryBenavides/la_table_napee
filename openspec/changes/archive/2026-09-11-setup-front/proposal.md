## Why

L'API est terminée (37 routes, 128 tests verts) et la conception du front est posée
(`design/ecrans.md` : 14 écrans, plus un handoff de maquettes haute fidélité hors
dépôt). Mais `client/` est encore le template React Router v7 par défaut : **aucun
change OpenSpec ne couvre le front**, donc rien ne le suit.

Avant d'écrire le premier écran, il faut poser une fois ce que les 14 écrans
partagent : les tokens visuels, les composants de base, et surtout **une seule**
couche d'accès à l'API. L'authentification passe par cookie `httpOnly` avec rotation
de jeton : si chaque écran écrit son propre `fetch`, le refresh transparent sera
dupliqué, mal fait, et la session cassera de façon aléatoire.

## What Changes

**Ce change pose le socle du front, pas les écrans.** Les écrans viendront ensuite,
un par un, comme les features de l'API sont venues après `setup-fondations-api`.

- **Tokens visuels** : `theme.css` du handoff traduit en `@theme` Tailwind v4 dans
  `app/app.css` (couleurs, échelle typographique, espacements 4 px, rayons, ombres).
  Plus aucune valeur arbitraire (`p-[13px]`, `text-[#333]`) n'est tolérée ensuite.
- **Couche d'accès API unique** : un module qui porte l'URL de base, l'envoi des
  cookies, la forme d'erreur `{ statusCode, message, details[] }`, et le **refresh
  transparent sur 401, rejoué une seule fois**. Aucun jeton en JS, jamais de
  `localStorage`.
- **Session et rôles côté client** : l'état « connecté » se déduit de
  `GET /utilisateurs/moi`, chargé une fois par la racine. La navigation du back-office
  est **construite depuis le rôle**, pas masquée en CSS.
- **Coquilles / layouts** : `EnTeteSite` (écrans publics), `CoquilleAuth` (connexion,
  inscription), `CoquilleBackOffice` (panneau + le 403), et l'ossature de
  `app/routes.ts` pour les 14 écrans.
- **Composants partagés** listés par le handoff et réutilisés par au moins deux
  écrans : `Bouton`, `Champ`/`Selecteur`/`Case`, `Bandeau`, `EtatVide`, `Squelette`,
  `Pagination`, `ModaleConfirmation`, `Etoiles`, `EtiquetteRole`.
- **Écrans système 12–14** (404, 403, erreur inattendue) : ils font partie du socle
  parce que ce sont des `ErrorBoundary` par segment, pas des pages parmi d'autres.
- **Nettoyage du template** : `app/welcome/` et `routes/home.tsx` disparaissent.

### Ce que ce change ne fait PAS

Les écrans 1 à 11 (accueil, catalogue, détail, connexion, inscription, compte,
back-office). Ils arriveront un par un, chacun validé par sa propre liste de tests.
Le socle se prouve avec les écrans système et un écran de fumée, pas avec 11 écrans
d'un coup.

## Capabilities

### New Capabilities

- `front-foundations` : le socle visuel et structurel du client — tokens, composants
  partagés, coquilles, ossature de routes, écrans système et états de chargement.
- `front-api-access` : le contrat d'accès à l'API depuis le client — cookies, refresh
  transparent, forme d'erreur, session et rôles, l'URL comme source de vérité pour
  les filtres et la pagination.

### Modified Capabilities

<!-- Aucune capacité existante ne change : l'API n'est pas touchée. -->

## Impact

- **`client/`** : `app/app.css` (tokens), `app/root.tsx` (session, `ErrorBoundary`),
  `app/routes.ts`, et les nouveaux dossiers de composants, de coquilles et d'accès
  API. Le template par défaut est supprimé.
- **`packages/types`** : source unique du modèle, déjà liée — la couche d'accès API
  type ses réponses depuis `@recipe/types`, sans redéclarer de forme.
- **`setup-authentification`** : les 3 tâches restantes (groupe 11) sont ici — appels
  avec cookies, aucun jeton en JS, refresh transparent. Le change se fermera quand le
  premier écran protégé existera.
- **Dépendances** : Tailwind v4 est déjà installé. Les polices (Cormorant Garamond,
  Maitree, Ruthie) sont à servir ; aucune librairie de composants tierce.
- **Qualité** : `npm run verify` couvre déjà `client/app`. Le front n'a aucun harnais
  de tests : **ce change le pose en premier** (Vitest + Testing Library), pour que la
  couche d'accès API et les composants porteurs de règle s'écrivent en TDD.

## Écarts repérés entre le handoff et le contrat

Le handoff nomme quelques routes qui **n'existent pas**. Le contrat
(`design/routes-api.md`) fait foi ; ces écarts sont tranchés ici pour qu'ils ne
soient pas découverts en cours d'écran :

| Le handoff dit               | La réalité                     | Décision                                                                                    |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `POST /authentification/...` | `POST /auth/...`               | c'est `/auth`                                                                               |
| `GET /avis?limite=5`         | n'existe pas                   | pas de tuile « derniers avis » sur le panneau (déjà écrit dans `design/ecrans.md`)          |
| `POST /ingredients`          | seul `GET /ingredients` existe | pas de création d'ingrédient à la volée dans l'éditeur ; à trancher au moment de l'écran 09 |
