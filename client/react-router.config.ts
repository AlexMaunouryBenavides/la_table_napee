import type { Config } from '@react-router/dev/config';

export default {
  // SPA : les données se chargent depuis le navigateur (clientLoader). L'authentification
  // passe par un cookie httpOnly posé sur une AUTRE origine — dans le navigateur,
  // `credentials: 'include'` suffit, là où un loader serveur devrait recopier l'en-tête
  // Cookie puis relayer chaque Set-Cookie, rotation de jeton comprise.
  ssr: false,
} satisfies Config;
