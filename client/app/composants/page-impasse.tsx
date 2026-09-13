import type { ReactNode } from 'react';

type ProprietesImpasse = {
  /** Décoratif : l'information vit dans le titre, pas dans ce chiffre. */
  code: number;
  titre: string;
  explication: string;
  actions?: ReactNode;
  /** Référence d'incident, chemin demandé… jamais une trace technique. */
  detail?: string;
};

export function PageImpasse({
  code,
  titre,
  explication,
  actions,
  detail,
}: ProprietesImpasse) {
  return (
    <section className="mx-auto max-w-150 py-16 text-center">
      {/* Masqué aux lecteurs d'écran : « 404 » ne dit rien à personne, le titre si. */}
      <p
        aria-hidden="true"
        className="font-titre text-5xl leading-none font-medium text-ardoise"
      >
        {code}
      </p>

      <h1 className="mt-3 text-3xl leading-tight">{titre}</h1>
      <p className="mx-auto mt-4 max-w-110 text-base leading-relaxed text-encre-55">
        {explication}
      </p>

      {actions !== undefined && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}

      {detail !== undefined && (
        <p className="mt-10 rounded-sm bg-lin px-4 py-3 font-mono text-sm text-encre-55">
          {detail}
        </p>
      )}
    </section>
  );
}
