/// <reference types="vite/client" />

// Les variables d'environnement exposées au navigateur. Elles sont PUBLIQUES : tout
// ce qui est déclaré ici finit dans le bundle, donc jamais de secret.
interface ImportMetaEnv {
  readonly VITE_URL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
