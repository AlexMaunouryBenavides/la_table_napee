import type { ReactNode } from 'react';

/** Le haut de chaque écran du panneau : où l'on est, le titre, l'action principale. */
export function EnTetePanneau({
  fil,
  titre,
  action,
}: {
  fil: string;
  titre: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-trait pb-4">
      <div>
        <p className="text-xs tracking-bouton text-encre-55 uppercase">{fil}</p>
        <h1 className="mt-2 text-3xl leading-none">{titre}</h1>
      </div>
      {action}
    </header>
  );
}
