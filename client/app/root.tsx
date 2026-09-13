import { QueryClientProvider } from '@tanstack/react-query';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import { ErreurInattendue } from './composants/erreur-inattendue';
import { Squelette } from './composants/squelette';
import { PageIntrouvable } from './introuvable/page-introuvable';
import { clientRequetes } from './requetes/client-requetes';
import { requeteSession } from './requetes/session';

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
 * La session est chargée avant le premier rendu, dans le cache partagé.
 *
 * Une panne de cet appel ne fait PAS tomber le site : `prefetchQuery` ne lève jamais.
 * Le catalogue se lit sans être connecté, et `useSession` distingue « visiteur » (l'API
 * a répondu 401) de « on ne sait pas » (l'API n'a pas répondu).
 */
export async function clientLoader(): Promise<null> {
  await clientRequetes.prefetchQuery(requeteSession);
  return null;
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
  return (
    <QueryClientProvider client={clientRequetes}>
      <Outlet />
    </QueryClientProvider>
  );
}

const INTROUVABLE = 404;

/**
 * Dernier filet : une erreur qu'aucun segment n'a rattrapée. Les segments enfants ont
 * leurs propres `ErrorBoundary`, si bien qu'une panne locale ne blanchit pas tout.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === INTROUVABLE) {
    // Pas de suggestions ici : ce filet n'a pas de chargement pour les calculer.
    return <PageIntrouvable suggestions={[]} />;
  }

  return <ErreurInattendue />;
}
