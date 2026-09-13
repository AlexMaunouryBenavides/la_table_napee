import { ErreurApi, STATUT_SANS_REPONSE } from './erreur-api';

type MethodeHttp = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type OptionsAppel = {
  methode?: MethodeHttp;
  corps?: unknown;
};

const URL_API_PAR_DEFAUT = 'http://localhost:3000/api';
const NON_AUTHENTIFIE = 401;
const SANS_CONTENU = 204;
const CHEMIN_RAFRAICHISSEMENT = '/auth/rafraichissement';

// Un 401 sur ces chemins n'est pas un jeton expiré : c'est un identifiant faux ou une
// session réellement finie. Les rafraîchir mènerait à une récursion ou à un appel
// inutile.
const CHEMINS_SANS_RAFRAICHISSEMENT = [
  '/auth/connexion',
  CHEMIN_RAFRAICHISSEMENT,
];

// Lue à chaque appel (et non figée à l'import) pour rester remplaçable en test.
function urlDeBase(): string {
  return import.meta.env.VITE_URL_API ?? URL_API_PAR_DEFAUT;
}

/** La rotation du jeton interdit deux rafraîchissements concurrents : ils
 *  invalideraient la famille et déconnecteraient l'utilisateur. Tous les appels qui
 *  prennent un 401 en même temps attendent donc la même promesse. */
let rafraichissementEnCours: Promise<boolean> | null = null;

async function emettre(
  chemin: string,
  options: OptionsAppel,
): Promise<Response> {
  const aUnCorps = options.corps !== undefined;

  try {
    return await fetch(`${urlDeBase()}${chemin}`, {
      method: options.methode ?? 'GET',
      credentials: 'include',
      headers: aUnCorps ? { 'Content-Type': 'application/json' } : undefined,
      body: aUnCorps ? JSON.stringify(options.corps) : undefined,
    });
  } catch {
    throw new ErreurApi(
      STATUT_SANS_REPONSE,
      'Le service est injoignable. Vérifiez votre connexion, puis réessayez.',
    );
  }
}

async function corpsJson(reponse: Response): Promise<unknown> {
  try {
    return await reponse.json();
  } catch {
    return undefined;
  }
}

/** Reconstruit l'erreur de l'API ; retombe sur le statut HTTP si le corps est
 *  illisible — une page d'erreur HTML de proxy, par exemple. */
async function erreurDepuis(reponse: Response): Promise<ErreurApi> {
  const corps = await corpsJson(reponse);

  if (corps === null || typeof corps !== 'object') {
    return new ErreurApi(
      reponse.status,
      'Le service a renvoyé une réponse inattendue.',
    );
  }

  const { message, details } = corps as {
    message?: string;
    details?: string[];
  };

  return new ErreurApi(
    reponse.status,
    message ?? 'Le service a renvoyé une réponse inattendue.',
    details,
  );
}

async function executerRafraichissement(): Promise<boolean> {
  const reponse = await emettre(CHEMIN_RAFRAICHISSEMENT, { methode: 'POST' });
  return reponse.ok;
}

function rafraichirLaSession(): Promise<boolean> {
  rafraichissementEnCours ??= executerRafraichissement().finally(() => {
    rafraichissementEnCours = null;
  });

  return rafraichissementEnCours;
}

async function interpreter<T>(reponse: Response): Promise<T> {
  if (!reponse.ok) {
    throw await erreurDepuis(reponse);
  }

  if (reponse.status === SANS_CONTENU) {
    return undefined as T;
  }

  return (await corpsJson(reponse)) as T;
}

async function executer<T>(
  chemin: string,
  options: OptionsAppel,
  rejeuAutorise: boolean,
): Promise<T> {
  const reponse = await emettre(chemin, options);

  const peutRejouer =
    rejeuAutorise &&
    reponse.status === NON_AUTHENTIFIE &&
    !CHEMINS_SANS_RAFRAICHISSEMENT.includes(chemin);

  if (peutRejouer && (await rafraichirLaSession())) {
    return executer<T>(chemin, options, false);
  }

  return interpreter<T>(reponse);
}

/**
 * Le seul point de sortie réseau du client. Les écrans ne l'appellent pas
 * directement : ils passent par le module de leur ressource.
 */
export async function appelerApi<T>(
  chemin: string,
  options: OptionsAppel = {},
): Promise<T> {
  return executer<T>(chemin, options, true);
}
