import type { ReactNode } from 'react';

type ProprietesEtatVide = {
  titre: string;
  /** Dit POURQUOI c'est vide : un filtre trop étroit n'est pas une base neuve. */
  explication: string;
  action?: ReactNode;
  glyphe?: string;
};

export function EtatVide({
  titre,
  explication,
  action,
  glyphe = '◍',
}: ProprietesEtatVide) {
  return (
    <div className="rounded-md border border-dashed border-trait-fort px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="inline-flex h-16 w-16 items-center justify-center rounded-pilule bg-lavande text-2xl text-ardoise"
      >
        {glyphe}
      </span>

      <p className="mt-4 text-2xl">{titre}</p>
      <p className="mt-2 text-base text-encre-70">{explication}</p>

      {action !== undefined && <div className="mt-6">{action}</div>}
    </div>
  );
}
