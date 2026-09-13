import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import { chargerSession } from './acces-api/session';
import { ErreurInattendue } from './composants/erreur-inattendue';
import { Squelette } from './composants/squelette';
import Introuvable from './routes/introuvable';
import type { EtatSession } from './session-courante';

import './app.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Un seul appel à `GET /utilisateurs/moi` pour toute l'application.
 *
 * Une panne de cet appel ne fait PAS tomber le site : le catalogue se lit sans être
 * connecté, et la vitrine doit survivre à une session indisponible. On distingue donc
 * « visiteur » (l'API a répondu 401) de « on ne sait pas » (l'API n'a pas répondu).
 */
export async function clientLoader(): Promise<EtatSession> {
  try {
    return { session: await chargerSession(), sessionIndisponible: false };
  } catch {
    return { session: null, sessionIndisponible: true };
  }
}

/**
 * Affiché pendant que la session se charge : jamais un écran blanc, et surtout jamais
 * un écran protégé ni un 403 tant qu'on ne sait pas qui est là.
 */
export function HydrateFallback() {
  return (
    <div className="min-h-dvh bg-nappe px-10 py-6">
      <Squelette lignes={2} hauteur={11} className="max-w-160" />
    </div>
  );
}

export default function App() {
  return <Outlet />;
}

const INTROUVABLE = 404;

/**
 * Dernier filet : une erreur qu'aucun segment n'a rattrapée. Les segments enfants ont
 * leurs propres `ErrorBoundary`, si bien qu'une panne locale ne blanchit pas tout.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === INTROUVABLE) {
    return <Introuvable />;
  }

  return <ErreurInattendue />;
}
