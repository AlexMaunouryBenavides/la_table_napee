# Convention — Client React Router v7 + Vite (couche jugement)

> Le client tourne en **React Router v7 « framework mode »** (sur Vite). Ce mode a ses
> fichiers et ses points d'extension attendus : on travaille _avec_ eux, on ne les
> contourne pas. Références : https://reactrouter.com et https://vite.dev.

## 1. Respecter l'arborescence attendue

- `app/root.tsx` : layout racine (html, `<Outlet/>`, `ErrorBoundary`).
- `app/routes.ts` : déclaration des routes (la source de vérité du routage).
- `app/routes/*.tsx` : un module par route.
- `~/*` est l'alias de `app/*` (cf. `tsconfig.json`) ; l'utiliser pour les imports
  internes plutôt que des `../../..`.
- Assets statiques dans `public/`. Ne crée pas de structure parallèle « maison ».

## 2. Charger la donnée par `loader`, muter par `action`

- Lecture de données d'une route → **`loader`** (s'exécute avant le rendu), pas un
  `fetch` dans un `useEffect`. On évite ainsi les écrans qui clignotent et les
  cascades de requêtes.
- Mutation (formulaire) → **`action`** + `<Form>`, pas un `onSubmit` qui `fetch` à la
  main. Le routeur gère l'état d'envoi et la revalidation.
- `useEffect` est réservé aux effets _réellement_ liés au cycle de vie (abonnements,
  focus…), pas au chargement de données.

## 3. Sécurité des types : utiliser les types générés

- React Router génère les types par route dans `./+types/<route>` (via
  `react-router typegen`, déjà branché dans le `typecheck`). Typer `loader`, `action`
  et le composant avec `Route.LoaderArgs`, `Route.ComponentProps`, etc.
- Ne réinvente pas des types de props que le framework fournit déjà.

## 4. Vite : conventions et variables d'environnement

- Config dans `vite.config.ts`. Variables d'environnement via `import.meta.env`
  (préfixe `VITE_` pour celles exposées au navigateur).
- **Aucun secret** côté client : tout ce qui part dans le bundle est public.
- L'URL de l'API passe par une variable d'environnement, jamais en dur (12-factor).

## 5. Accessibilité (déjà outillée, mais c'est du jugement aussi)

- `eslint-plugin-jsx-a11y` attrape le mécanique (alt manquant, rôle invalide). Le
  reste se juge : ordre de tabulation logique, libellés de formulaire associés,
  contrastes, sémantique HTML (`<button>` pour une action, pas un `<div onClick>`).

## Checklist de revue rapide

- [ ] Fichiers/dossiers conformes au framework mode (pas de structure parallèle).
- [ ] Données chargées par `loader` / mutées par `action` (pas de `fetch` en
      `useEffect` quand une route convient).
- [ ] `loader`/`action`/composant typés via les types générés `./+types`.
- [ ] Aucun secret côté client ; URL d'API via variable d'environnement.
- [ ] Sémantique HTML et accessibilité soignées au-delà du linter.
